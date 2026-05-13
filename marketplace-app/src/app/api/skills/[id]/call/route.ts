import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createPublicClient, createWalletClient, http } from 'viem';
import { ARC_CHAIN_ID, ARC_RPC_URL } from '@/lib/wagmi';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;
const PLATFORM_PRIVATE_KEY = process.env.PLATFORM_PRIVATE_KEY;

const ESCROW_ABI = [
  {
    name: 'canCallSkill',
    type: 'function',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'skillId', type: 'bytes32' },
    ],
    outputs: [
      { name: 'canCall', type: 'bool' },
      { name: 'maxCalls', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'deductCall',
    type: 'function',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'skillId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
      { name: 'callId', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

const arcClient = createPublicClient({
  chain: {
    id: ARC_CHAIN_ID,
    name: 'Arc Testnet',
    nativeCurrency: { decimals: 6, name: 'USDC', symbol: 'USDC' },
    rpcUrls: { default: { http: [ARC_RPC_URL] }, public: { http: [ARC_RPC_URL] } },
  },
  transport: http(ARC_RPC_URL),
});

interface RateLimitEntry {
  count: number;
  windowStart: number;
  dailyCount: number;
  dailyWindowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(userId: string, skillId: string): { allowed: boolean; retryAfter: number } {
  const key = `${userId}:${skillId}`;
  const now = Date.now();
  const TEN_SECONDS = 10 * 1000;
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const MAX_PER_10SEC = 10;
  const MAX_PER_DAY = 1000;

  let entry = rateLimitStore.get(key);
  
  if (!entry || now - entry.windowStart > TEN_SECONDS) {
    entry = { count: 0, windowStart: now, dailyCount: 0, dailyWindowStart: now };
    rateLimitStore.set(key, entry);
  }

  if (now - entry.dailyWindowStart > ONE_DAY) {
    entry.dailyCount = 0;
    entry.dailyWindowStart = now;
  }

  if (entry.count >= MAX_PER_10SEC) {
    const retryAfter = Math.ceil((entry.windowStart + TEN_SECONDS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  if (entry.dailyCount >= MAX_PER_DAY) {
    return { allowed: false, retryAfter: Math.ceil((entry.dailyWindowStart + ONE_DAY - now) / 1000) };
  }

  entry.count++;
  entry.dailyCount++;

  return { allowed: true, retryAfter: 0 };
}

async function executeSkillInSandbox(
  skillId: string,
  runtime: string,
  entrypoint: string,
  inputs: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const tmpDir = join('/tmp', `agenti-skill-${skillId}-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    const skill = await prisma.agent.findUnique({
      where: { id: skillId, itemType: 'SKILL' },
    });

    if (!skill || skill.status !== 'PUBLISHED') {
      throw new Error('Skill not found or not published');
    }

    const storagePath = `agents/${skillId}/${skill.version}/package.zip`;
    const zipBuffer = await fetchSkillZip(storagePath);
    
    await extractZip(zipBuffer, tmpDir);

    const inputJson = JSON.stringify(inputs);
    const inputFile = join(tmpDir, 'input.json');
    writeFileSync(inputFile, inputJson);

    const entrypointPath = join(tmpDir, entrypoint);
    if (!existsSync(entrypointPath)) {
      throw new Error(`Entrypoint file not found: ${entrypoint}`);
    }

    let command: string;
    let timeout = 30000;

    if (runtime === 'python3.11') {
      command = `cd "${tmpDir}" && python3 -c "import json; d=json.load(open('input.json')); exec(open('${entrypoint}').read())"`;
    } else if (runtime === 'node20') {
      command = `cd "${tmpDir}" && node -e "const d=require('./input.json'); require('./${entrypoint}')"`;
    } else {
      throw new Error(`Runtime ${runtime} not yet supported for server execution`);
    }

    const { stdout, stderr, timedOut } = await runWithTimeout(command, timeout);

    if (timedOut) {
      throw new Error('Skill execution timed out after 30 seconds');
    }

    if (stderr && stderr.trim()) {
      console.error('Skill stderr:', stderr);
    }

    let output: Record<string, unknown>;
    try {
      output = JSON.parse(stdout.trim());
    } catch {
      output = { raw: stdout, parsed: false };
    }

    return output;
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function fetchSkillZip(storagePath: string): Promise<Buffer> {
  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
  if (!R2_PUBLIC_URL) {
    throw new Error('Storage not configured');
  }

  const response = await fetch(`${R2_PUBLIC_URL}/${storagePath}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch skill package: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function extractZip(zipBuffer: Buffer, destDir: string): Promise<void> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  const zipPath = join(destDir, 'package.zip');
  
  writeFileSync(zipPath, zipBuffer);
  
  try {
    await execAsync(`unzip -o "${zipPath}" -d "${destDir}"`);
  } finally {
    try {
      const { unlinkSync } = await import('fs');
      unlinkSync(zipPath);
    } catch {
      // Ignore
    }
  }
}

async function runWithTimeout(
  command: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = exec(command, { 
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
    }, async (error) => {
      if (error && (error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
        timedOut = true;
      }
      resolve({ stdout, stderr, timedOut });
    });

    if (child.stdout) {
      child.stdout.on('data', (data) => { stdout += data.toString(); });
    }
    if (child.stderr) {
      child.stderr.on('data', (data) => { stderr += data.toString(); });
    }

    setTimeout(() => {
      if (!timedOut && child.kill()) {
        timedOut = true;
      }
    }, timeoutMs);
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const walletAddress = (session.user as { walletAddress?: string }).walletAddress;
  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet required for skill calls' }, { status: 401 });
  }

  const { id: skillId } = await context.params;
  
  const skill = await prisma.agent.findUnique({
    where: { id: skillId, itemType: 'SKILL' },
  });

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  if (skill.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Skill is not published' }, { status: 400 });
  }

  if (skill.pricingModel !== 'PER_CALL' || !skill.pricePerCall) {
    return NextResponse.json({ error: 'Skill is not per-call pricing' }, { status: 400 });
  }

  const rateLimitCheck = checkRateLimit(session.user.id, skillId);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimitCheck.retryAfter },
      { status: 429, headers: { 'Retry-After': String(rateLimitCheck.retryAfter) } }
    );
  }

  let inputs: Record<string, unknown>;
  try {
    inputs = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const pricePerCallUSDC = Number(skill.pricePerCall);
  const pricePerCallRaw = BigInt(pricePerCallUSDC * 1_000_000);
  const callId = randomUUID();

  if (ESCROW_ADDRESS && PLATFORM_PRIVATE_KEY) {
    try {
      const [canCall] = await arcClient.readContract({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'canCallSkill',
        args: [walletAddress as `0x${string}`, skillId as `0x${string}`],
      });

      if (!canCall) {
        return NextResponse.json({ error: 'Insufficient USDC balance in escrow' }, { status: 402 });
      }
    } catch {
      return NextResponse.json({ error: 'Failed to check escrow balance' }, { status: 500 });
    }
  }

  let output: Record<string, unknown>;
  try {
    output = await executeSkillInSandbox(
      skillId,
      skill.runtime || 'python3.11',
      skill.name,
      inputs
    );
  } catch (error) {
    await prisma.auditLog.create({
      data: {
        agentId: skillId,
        action: 'SKILL_CALL',
        userId: session.user.id,
        details: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    });

    return NextResponse.json(
      { 
        success: false,
        error: `Skill execution failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }

  if (ESCROW_ADDRESS && PLATFORM_PRIVATE_KEY) {
    try {
      const walletClient = createWalletClient({
        chain: {
          id: ARC_CHAIN_ID,
          name: 'Arc Testnet',
          nativeCurrency: { decimals: 6, name: 'USDC', symbol: 'USDC' },
          rpcUrls: { default: { http: [ARC_RPC_URL] }, public: { http: [ARC_RPC_URL] } },
        },
        transport: http(ARC_RPC_URL),
        account: PLATFORM_PRIVATE_KEY as `0x${string}`,
      });

      await walletClient.writeContract({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'deductCall',
        args: [
          walletAddress as `0x${string}`,
          skillId as `0x${string}`,
          pricePerCallRaw,
          callId as `0x${string}`,
        ],
      });
    } catch (consoleError) {
      console.error('Escrow deduction failed:', consoleError);
    }
  }

  await prisma.skillUsage.upsert({
    where: {
      skillId_userId_period: {
        skillId,
        userId: session.user.id,
        period: currentPeriod,
      },
    },
    update: {
      callCount: { increment: 1 },
      usdcSpent: { increment: pricePerCallUSDC },
    },
    create: {
      skillId,
      userId: session.user.id,
      period: currentPeriod,
      callCount: 1,
      usdcSpent: pricePerCallUSDC,
    },
  });

  await prisma.auditLog.create({
    data: {
      agentId: skillId,
      action: 'SKILL_CALL',
      userId: session.user.id,
      details: `Skill call ${callId.slice(0, 8)}, price: ${pricePerCallUSDC} USDC`,
    },
  });

  return NextResponse.json({
    success: true,
    output,
    callId,
    usdcSpent: pricePerCallUSDC,
  });
}