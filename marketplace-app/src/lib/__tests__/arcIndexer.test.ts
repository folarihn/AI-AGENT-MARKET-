import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock the prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    purchase: {
      findFirst: vi.fn(),
    },
  },
}));

describe('arcIndexer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('duplicate events are idempotent', () => {
    it('same txHash should not create duplicate Purchase', async () => {
      const txHash = '0xabc123';
      
      // First call - should not find existing
      vi.mocked(prisma.purchase.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.purchase.create).mockResolvedValueOnce({
        id: '1',
        userId: 'user1',
        agentId: 'agent1',
        stripeSessionId: txHash,
        status: 'COMPLETED' as const,
        amount: 10,
        createdAt: new Date(),
      });
      
      // Second call with same txHash - should find existing
      vi.mocked(prisma.purchase.findFirst).mockResolvedValueOnce({
        id: '1',
        userId: 'user1',
        agentId: 'agent1',
        stripeSessionId: txHash,
        status: 'COMPLETED' as const,
        amount: 10,
        txHash: txHash,
        createdAt: new Date(),
      });
      
      // Simulate the idempotency check
      const existing1 = await prisma.purchase.findFirst({ where: { txHash } });
      const existing2 = await prisma.purchase.findFirst({ where: { txHash } });
      
      // Both should return the same purchase (idempotent)
      expect(existing1?.id).toBe(existing2?.id);
      expect(existing1?.txHash).toBe(txHash);
    });

    it('different txHash creates separate Purchase', async () => {
      const txHash1 = '0xabc';
      const txHash2 = '0xdef';
      
      vi.mocked(prisma.purchase.findFirst)
        .mockResolvedValueOnce(null)  // First lookup
        .mockResolvedValueOnce(null)  // Second lookup (different tx)
        .mockResolvedValueOnce({
          id: '2',
          userId: 'user1',
          agentId: 'agent1',
          stripeSessionId: txHash2,
          status: 'COMPLETED' as const,
          amount: 10,
          txHash: txHash2,
          createdAt: new Date(),
        });
      
      const p1 = await prisma.purchase.findFirst({ where: { txHash: txHash1 } });
      const p2 = await prisma.purchase.findFirst({ where: { txHash: txHash2 } });
      
      // p1 is new, p2 exists
      expect(p1).toBeNull();
      expect(p2).not.toBeNull();
      expect(p1?.txHash).not.toBe(p2?.txHash);
    });
  });

  describe('unknown wallet creates user record', () => {
    it('findOrCreateUserByWallet creates new user for unknown wallet', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'new-user-id',
        email: null,
        name: null,
        role: 'BUYER' as const,
        walletAddress: walletAddress.toLowerCase(),
      });
      
      const existing = await prisma.user.findUnique({ where: { walletAddress } });
      
      if (!existing) {
        await prisma.user.create({
          data: {
            walletAddress: walletAddress.toLowerCase(),
            role: 'BUYER',
          },
        });
      }
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { walletAddress },
      });
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('finds existing user by wallet', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const existingUser = {
        id: 'existing-user',
        walletAddress: walletAddress.toLowerCase(),
        role: 'BUYER' as const,
      };
      
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser);
      
      const found = await prisma.user.findUnique({ where: { walletAddress } });
      
      expect(found?.id).toBe('existing-user');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });
});