import { PublicClient, createPublicClient, http } from 'viem';
import { ARC_CHAIN_ID, ARC_RPC_URL } from '@/lib/wagmi';

const AGENTI_LICENSE_ADDRESS = process.env.NEXT_PUBLIC_LICENSE_ADDRESS as string | undefined;

const LENSE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

let arcClient: PublicClient | null = null;

function getArcClient(): PublicClient {
  if (!arcClient) {
    arcClient = createPublicClient({
      chain: {
        id: ARC_CHAIN_ID,
        name: 'Arc Testnet',
        nativeCurrency: {
          decimals: 6,
          name: 'USDC',
          symbol: 'USDC',
        },
        rpcUrls: {
          default: { http: [ARC_RPC_URL] },
          public: { http: [ARC_RPC_URL] },
        },
      },
      transport: http(ARC_RPC_URL),
    });
  }
  return arcClient;
}

interface LicenseCheckCache {
  result: boolean;
  timestamp: number;
}

const licenseCache = new Map<string, LicenseCheckCache>();

const CACHE_TTL_MS = 60 * 1000;

export async function checkNFTOwnership(
  walletAddress: string,
  agentId: string
): Promise<boolean> {
  const cacheKey = `${walletAddress.toLowerCase()}:${agentId}`;
  const cached = licenseCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  if (!AGENTI_LICENSE_ADDRESS) {
    return false;
  }

  try {
    const client = getArcClient();
    const tokenId = BigInt(agentId);

    const balance = await client.readContract({
      address: AGENTI_LICENSE_ADDRESS as `0x${string}`,
      abi: LENSE_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`, tokenId],
    });

    const hasLicense = balance > 0;

    licenseCache.set(cacheKey, {
      result: hasLicense,
      timestamp: Date.now(),
    });

    return hasLicense;
  } catch {
    return false;
  }
}

export function clearLicenseCache(): void {
  licenseCache.clear();
}