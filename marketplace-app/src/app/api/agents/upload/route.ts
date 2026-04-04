import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { scanner } from '@/lib/scanner';
import { AgentStatus } from '@/data/mock';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string);
    const creatorId = formData.get('creatorId') as string;
    const creatorName = formData.get('creatorName') as string;

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
    } catch (e) {
      return NextResponse.json({ error: 'Invalid agent.json format' }, { status: 400 });
    }

    if (!agentJsonContent.name || !agentJsonContent.version) {
      return NextResponse.json({ error: 'agent.json missing name or version' }, { status: 400 });
    }

    // 2. Perform Security Scan (Blocking for MVP)
    const scanResults = await scanner.scanPackage(buffer);

    // 3. Store File (Mock S3)
    const timestamp = Date.now();
    const safeFilename = `${agentJsonContent.name}-v${agentJsonContent.version}-${timestamp}.zip`;
    const storedFile = await storage.saveFile(file, safeFilename);

    // 4. Determine Initial Status
    // Auto-reject if scan failed (e.g., malware or secrets found)
    const initialStatus: AgentStatus = scanResults.status === 'PASS' ? 'PENDING_REVIEW' : 'REJECTED';

    // 5. Save to DB
    const newAgent = await db.agents.create({
      slug: agentJsonContent.name, // In real app, handle slug uniqueness
      name: agentJsonContent.name,
      displayName: metadata.displayName || agentJsonContent.display_name || agentJsonContent.name,
      description: metadata.description || agentJsonContent.description,
      category: metadata.category || agentJsonContent.category || 'dev-tools',
      tags: metadata.tags || agentJsonContent.tags || [],
      status: initialStatus,
      price: parseFloat(metadata.price) || 0,
      creatorId: creatorId,
      creatorName: creatorName,
      version: agentJsonContent.version,
      permissions: agentJsonContent.permissions || { network: false, filesystem: false },
    });

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
      details: `Uploaded version ${newAgent.version}. Scan status: ${scanResults.status}`,
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
      packageUrl: storedFile.url 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
