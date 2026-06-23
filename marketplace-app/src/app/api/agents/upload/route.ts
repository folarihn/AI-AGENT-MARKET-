import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { scanner } from '@/lib/scanner';
import { detectAssetTypeAndValidate, type SkillManifest } from '@/lib/skills/validation';
import { AgentStatus } from '@prisma/client';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rateLimit';

type PricingModel = 'FREE' | 'ONE_TIME' | 'PER_CALL';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 uploads per creator per hour
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rl = rateLimit('upload', session.user.id, { limit: 10, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many uploads. Please wait before trying again.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string);
    const creatorId = session.user.id;
    const creatorName = session.user.name || session.user.email || 'Creator';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'File must be a .zip archive' }, { status: 400 });
    }

    // Reject oversized uploads before reading the whole archive into memory.
    const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Package exceeds the 50 MB size limit' },
        { status: 413 }
      );
    }

    const buffer = await file.arrayBuffer();
    const { assetType, manifest, errors } = await detectAssetTypeAndValidate(buffer);

    if (errors.length > 0) {
      const criticalErrors = errors.filter(e => e.severity === 'ERROR');
      if (criticalErrors.length > 0) {
        return NextResponse.json({
          error: 'Validation failed',
          details: criticalErrors.map(e => ({ rule: e.rule, detail: e.detail })),
        }, { status: 400 });
      }
    }

    if (assetType === 'SKILL' && !manifest) {
      return NextResponse.json({ error: 'Invalid skill.json' }, { status: 400 });
    }

    const zip = await JSZip.loadAsync(buffer);
    const hasReadme = Object.keys(zip.files).some(n => n.endsWith('README.md'));

    if (!hasReadme) {
      return NextResponse.json({ error: 'Package missing README.md' }, { status: 400 });
    }

    let name: string;
    let displayName: string;
    let description: string;
    let version: string;
    let permissions: { network: boolean; filesystem: boolean; subprocess: boolean };
    let pricingModel: PricingModel;
    let pricePerCall: number | undefined;
    let runtime: string | undefined;
    let inputs: unknown;
    let outputs: unknown;
    let tags: string[];

    if (assetType === 'SKILL' && manifest) {
      name = manifest.name;
      displayName = manifest.name;
      description = manifest.description;
      version = manifest.version;
      runtime = manifest.runtime;
      inputs = manifest.inputs;
      outputs = manifest.outputs;
      tags = manifest.tags || [];

      const permSet = new Set(manifest.permissions.map(p => p.toLowerCase()));
      permissions = {
        network: permSet.has('network'),
        filesystem: permSet.has('filesystem'),
        subprocess: permSet.has('subprocess'),
      };

      const modelMap: Record<string, PricingModel> = {
        free: 'FREE',
        one_time: 'ONE_TIME',
        per_call: 'PER_CALL',
      };
      pricingModel = modelMap[manifest.pricing_model] || 'ONE_TIME';

      if (manifest.price_per_call) {
        pricePerCall = manifest.price_per_call;
      }
    } else {
      let agentJsonContent: Record<string, unknown> = {};
      const agentJsonFile = Object.keys(zip.files).find(n => n.endsWith('agent.json'));
      if (agentJsonFile) {
        const content = await zip.file(agentJsonFile)?.async('string');
        agentJsonContent = JSON.parse(content || '{}');
      }

      const str = (v: unknown) => (typeof v === 'string' ? v : '');
      name = str(agentJsonContent.name);
      displayName =
        (typeof metadata.displayName === 'string' && metadata.displayName.trim()
          ? metadata.displayName.trim()
          : str(agentJsonContent.display_name) || str(agentJsonContent.name));
      description =
        (typeof metadata.description === 'string' && metadata.description.trim()
          ? metadata.description.trim()
          : str(agentJsonContent.description));
      version = str(agentJsonContent.version);
      tags =
        (Array.isArray(metadata.tags) ? metadata.tags.filter((t: unknown) => typeof t === 'string') : null) ??
        (Array.isArray(agentJsonContent.tags) ? (agentJsonContent.tags as string[]) : []);

      const rawPerms = agentJsonContent.permissions;
      if (Array.isArray(rawPerms)) {
        const permSet = new Set((rawPerms as string[]).map((p) => String(p).toLowerCase()));
        permissions = {
          network: permSet.has('network'),
          filesystem: permSet.has('filesystem'),
          subprocess: permSet.has('subprocess'),
        };
      } else if (rawPerms && typeof rawPerms === 'object') {
        const p = rawPerms as Record<string, unknown>;
        permissions = {
          network: Boolean(p.network),
          filesystem: Boolean(p.filesystem),
          subprocess: Boolean(p.subprocess),
        };
      } else {
        permissions = { network: false, filesystem: false, subprocess: false };
      }

      pricingModel = 'ONE_TIME';
    }

    const normalizeCategory = (value: unknown) => {
      const allowed = ['AUTOMATION', 'DATA', 'COMMUNICATION', 'PRODUCTIVITY', 'DEVTOOLS', 'RESEARCH', 'OTHER'] as const;
      type Cat = (typeof allowed)[number];
      const v = typeof value === 'string' ? value.trim() : '';
      const map: Record<string, string> = {
        'dev-tools': 'DEVTOOLS',
        devtools: 'DEVTOOLS',
        data: 'DATA',
        content: 'PRODUCTIVITY',
      };
      const candidate = map[v.toLowerCase()] || v.toUpperCase();
      return (allowed.includes(candidate as Cat) ? (candidate as Cat) : 'OTHER') as Cat;
    };

    const advanced = await scanner.scanZip(zip, { archiveByteLength: buffer.byteLength });
    const scanResults = {
      status: advanced.passed ? ('PASS' as const) : ('FAIL' as const),
      malwareClean: !advanced.findings.some(
        f => ['MALWARE_C2', 'DANGEROUS_EVAL', 'CHILD_PROCESS_EXEC'].includes(f.rule) && f.severity !== 'INFO'
      ),
      secretsFound: advanced.findings
        .filter(f => f.rule.startsWith('SECRET_'))
        .map(f => f.rule + ' in ' + f.file),
      disallowedFiles: advanced.findings.filter(f => f.rule === 'ALLOWLIST').map(f => f.file),
    };

    const initialStatus: AgentStatus = scanResults.status === 'PASS' ? 'PENDING_REVIEW' : 'REJECTED';

    const readmeFile = Object.keys(zip.files).find(n => n.endsWith('README.md'));
    const readmeText = readmeFile ? await zip.file(readmeFile)?.async('string') : undefined;

    const itemType: 'AGENT' | 'SKILL' = assetType === 'SKILL' ? 'SKILL' : 'AGENT';
    const rawSlugSource =
      (typeof metadata.slug === 'string' && metadata.slug.trim()
        ? metadata.slug.trim()
        : displayName || name) || '';
    const slugifiedName =
      rawSlugSource
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || (itemType.toLowerCase() + '-' + Date.now());

    const newAsset = await db.agents.create({
      slug: slugifiedName,
      itemType,
      name,
      displayName,
      description,
      category: normalizeCategory(metadata.category || 'OTHER'),
      tags,
      status: initialStatus,
      price:
        assetType === 'SKILL' && pricingModel === 'ONE_TIME'
          ? metadata.price || (manifest as SkillManifest)?.price_one_time || 0
          : metadata.price || 0,
      creatorId,
      creatorName,
      version,
      readmeText: readmeText || undefined,
      permissions,
      pricingModel,
      pricePerCall: pricePerCall || null,
      runtime: runtime || null,
      inputs: inputs || null,
      outputs: outputs || null,
    });

    const storagePath = await storage.savePackage(newAsset.id, newAsset.version, Buffer.from(buffer));

    await db.scans.create({
      agentId: newAsset.id,
      agentVersion: newAsset.version,
      malwareClean: scanResults.malwareClean,
      secretsFound: scanResults.secretsFound,
      disallowedFiles: scanResults.disallowedFiles,
      status: scanResults.status,
    });

    await db.audit.create({
      action: 'UPLOAD',
      targetId: newAsset.id,
      actorId: creatorId,
      details: 'Uploaded ' + assetType.toLowerCase() + ' version ' + newAsset.version + '. Scan: ' + scanResults.status + '. Storage: ' + storagePath,
    });

    if (initialStatus === 'REJECTED') {
      await db.audit.create({
        action: 'REJECT',
        targetId: newAsset.id,
        actorId: 'system',
        details: 'Auto-rejected: ' + scanResults.secretsFound.length + ' secrets, ' + scanResults.disallowedFiles.length + ' disallowed files.',
      });
    }

    return NextResponse.json({
      success: true,
      asset: newAsset,
      assetType,
      scanStatus: scanResults.status,
      storagePath,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
