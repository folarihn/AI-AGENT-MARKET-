import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { scanner } from '@/lib/scanner';
import { AgentStatus } from '@/data/mock';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    // 1. Validate Zip Content
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    
    // Check for required files
    const hasAgentJson = Object.keys(zip.files).some(name => name.endsWith('agent.json'));
    const hasReadme = Object.keys(zip.files).some(name => name.endsWith('README.md'));

    if (!hasAgentJson) {
      return NextResponse.json({ error: 'Package missing agent.json' }, { status: 400 });
    }
    if (!hasReadme) {
      return NextResponse.json({ error: 'Package missing README.md' }, { status: 400 });
    }

    // Validate agent.json content
    let agentJsonContent;
    try {
      const agentJsonFile = Object.keys(zip.files).find(name => name.endsWith('agent.json'));
      if (agentJsonFile) {
        const content = await zip.file(agentJsonFile)?.async('string');
        agentJsonContent = JSON.parse(content || '{}');
      }
    } catch {
      return NextResponse.json({ error: 'Invalid agent.json format' }, { status: 400 });
    }

    if (!agentJsonContent.name || !agentJsonContent.version) {
      return NextResponse.json({ error: 'agent.json missing name or version' }, { status: 400 });
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

    const parsePermissions = (value: unknown) => {
      const base = { network: false, filesystem: false, subprocess: false };
      if (!value) return base;
      if (Array.isArray(value)) {
        const normalized = value.map((v) => String(v).toLowerCase());
        if (normalized.includes('none')) return base;
        return {
          network: normalized.includes('network'),
          filesystem: normalized.includes('filesystem'),
          subprocess: normalized.includes('subprocess'),
        };
      }
      if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        return {
          network: Boolean(obj.network),
          filesystem: Boolean(obj.filesystem),
          subprocess: Boolean(obj.subprocess),
        };
      }
      return base;
    };

    // 2. Perform Security Scan (Blocking for MVP)
    const advanced = await scanner.scanZip(zip, { archiveByteLength: buffer.byteLength });
    const scanResults = {
      status: advanced.passed ? 'PASS' as const : 'FAIL' as const,
      malwareClean: !advanced.findings.some(f => ['MALWARE_C2','DANGEROUS_EVAL','CHILD_PROCESS_EXEC'].includes(f.rule) && f.severity !== 'INFO'),
      secretsFound: advanced.findings.filter(f => f.rule.startsWith('SECRET_')).map(f => `${f.rule} in ${f.file}`),
      disallowedFiles: advanced.findings.filter(f => f.rule === 'ALLOWLIST').map(f => f.file),
    };

    // 3. Determine Initial Status
    // Auto-reject if scan failed (e.g., malware or secrets found)
    const initialStatus: AgentStatus = scanResults.status === 'PASS' ? 'PENDING_REVIEW' : 'REJECTED';

    // 4. Save to DB
    const readmeFile = Object.keys(zip.files).find((n) => n.endsWith('README.md'));
    const readmeText = readmeFile ? await zip.file(readmeFile)?.async('string') : undefined;

    const newAgent = await db.agents.create({
      slug: agentJsonContent.name, // In real app, handle slug uniqueness
      name: agentJsonContent.name,
      displayName: metadata.displayName || agentJsonContent.display_name || agentJsonContent.name,
      description: metadata.description || agentJsonContent.description,
      category: normalizeCategory(metadata.category || agentJsonContent.category),
      tags: metadata.tags || agentJsonContent.tags || [],
      status: initialStatus,
      price: parseFloat(metadata.price) || 0,
      creatorId: creatorId,
      creatorName: creatorName,
      version: agentJsonContent.version,
      readmeText: readmeText || undefined,
      permissions: parsePermissions(agentJsonContent.permissions),
    });

    // 5. Store Package (Cloudflare R2)
    const storagePath = await storage.savePackage(newAgent.id, newAgent.version, Buffer.from(buffer));

    // 6. Save Scan Results
    await db.scans.create({
      agentId: newAgent.id,
      agentVersion: newAgent.version,
      malwareClean: scanResults.malwareClean,
      secretsFound: scanResults.secretsFound,
      disallowedFiles: scanResults.disallowedFiles,
      status: scanResults.status,
    });

    // 7. Create Audit Log
    await db.audit.create({
      action: 'UPLOAD',
      targetId: newAgent.id,
      actorId: creatorId,
      details: `Uploaded version ${newAgent.version}. Scan status: ${scanResults.status}. Storage: ${storagePath}`,
    });
    
    // If auto-rejected, log that too
    if (initialStatus === 'REJECTED') {
      await db.audit.create({
        action: 'REJECT',
        targetId: newAgent.id,
        actorId: 'system',
        details: `Auto-rejected due to scan failure: ${scanResults.secretsFound.length} secrets, ${scanResults.disallowedFiles.length} disallowed files.`,
      });
    }

    return NextResponse.json({ 
      success: true, 
      agent: newAgent,
      scanStatus: scanResults.status,
      storagePath
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
