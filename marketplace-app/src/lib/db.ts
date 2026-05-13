import { Agent } from '@/data/mock';
import { prisma } from '@/lib/prisma';
import { Prisma, Agent as PrismaAgent, AgentStatus, AgentCategory, PricingModel } from '@prisma/client';

// Define Scan Result Types
export interface ScanResult {
  id: string;
  agentId: string;
  agentVersion: string;
  malwareClean: boolean;
  secretsFound: string[];
  disallowedFiles: string[];
  timestamp: string;
  status: 'PASS' | 'FAIL';
}

// Define Audit Log Types
export interface AuditLog {
  id: string;
  action: 'UPLOAD' | 'APPROVE' | 'REJECT' | 'SCAN' | 'PURCHASE' | 'VIEW_AGENT' | 'DOWNLOAD' | 'SKILL_CALL';
  targetId: string; // Agent ID
  actorId: string; // User ID
  details: string;
  timestamp: string;
}

// Define Purchase and License Types
export interface License {
  id: string;
  userId: string;
  agentId: string;
  purchasedAt: string;
  pricePaid: number;
}

export interface Purchase {
  id: string;
  userId: string;
  agentId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  stripeSessionId: string;
  createdAt: string;
}

function toIsoTimestamp(value: Date) {
  return value.toISOString();
}

function toIsoDate(value: Date) {
  return value.toISOString().split('T')[0];
}

function decimalToNumber(value: Prisma.Decimal) {
  return Number(value.toString());
}

function purchaseStatusToDb(status: Purchase['status']): 'PENDING' | 'COMPLETED' | 'FAILED' {
  if (status === 'completed') return 'COMPLETED';
  if (status === 'failed') return 'FAILED';
  return 'PENDING';
}

function purchaseStatusFromDb(status: 'PENDING' | 'COMPLETED' | 'FAILED'): Purchase['status'] {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'FAILED') return 'failed';
  return 'pending';
}

function scanStatusToDb(status: ScanResult['status']): 'PASS' | 'FAIL' {
  return status === 'PASS' ? 'PASS' : 'FAIL';
}

function scanStatusFromDb(status: 'PASS' | 'FAIL'): ScanResult['status'] {
  return status === 'PASS' ? 'PASS' : 'FAIL';
}

function auditActionToDb(
  action: AuditLog['action']
): 'UPLOAD' | 'SCAN' | 'APPROVE' | 'REJECT' | 'PURCHASE' | 'VIEW_AGENT' | 'DOWNLOAD' {
  if (action === 'UPLOAD') return 'UPLOAD';
  if (action === 'SCAN') return 'SCAN';
  if (action === 'APPROVE') return 'APPROVE';
  if (action === 'REJECT') return 'REJECT';
  if (action === 'VIEW_AGENT') return 'VIEW_AGENT';
  if (action === 'DOWNLOAD') return 'DOWNLOAD';
  return 'PURCHASE';
}

function prismaAgentToApp(agent: PrismaAgent & { itemType?: string }): Agent {
  return {
    id: agent.id,
    itemType: (agent.itemType as 'AGENT' | 'SKILL') || 'AGENT',
    slug: agent.slug,
    name: agent.name,
    displayName: agent.displayName,
    description: agent.description,
    category: agent.category as AgentCategory,
    tags: agent.tags ?? [],
    status: agent.status,
    price: decimalToNumber(agent.price),
    creatorId: agent.creatorId,
    creatorName: agent.creatorName,
    version: agent.version,
    updatedAt: toIsoDate(agent.updatedAt),
    verified: agent.verified,
    downloads: agent.downloads,
    rating: agent.rating,
    reviewsCount: agent.reviewsCount,
    readmeText: agent.readmeText ?? undefined,
    permissions: {
      network: agent.permissionsNetwork,
      filesystem: agent.permissionsFilesystem,
      subprocess: (agent as unknown as { permissionsSubprocess?: boolean }).permissionsSubprocess ?? false,
    },
    pricingModel: (agent as unknown as { pricingModel?: string }).pricingModel as 'FREE' | 'ONE_TIME' | 'PER_CALL' | undefined,
  };
}

export const db = {
  agents: {
    findMany: async (filter?: { creatorId?: string; status?: string; itemType?: 'AGENT' | 'SKILL' }) => {
      const where: Prisma.AgentWhereInput = {};
      if (filter?.creatorId) where.creatorId = filter.creatorId;
      if (filter?.status) where.status = filter.status as AgentStatus;
      if (filter?.itemType) where.itemType = filter.itemType;

      const result = await prisma.agent.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });

      return result.map(prismaAgentToApp);
    },
    findById: async (id: string) => {
      const agent = await prisma.agent.findUnique({ where: { id } });
      return agent ? prismaAgentToApp(agent) : undefined;
    },
    create: async (data: Omit<Agent, 'id' | 'updatedAt' | 'verified' | 'downloads' | 'rating' | 'reviewsCount'> & { itemType?: 'AGENT' | 'SKILL'; pricingModel?: 'FREE' | 'ONE_TIME' | 'PER_CALL'; pricePerCall?: number | null; runtime?: string | null; inputs?: unknown; outputs?: unknown }) => {
      const created = await prisma.agent.create({
        data: {
          itemType: data.itemType || 'AGENT',
          name: data.name,
          slug: data.slug,
          version: data.version,
          status: data.status as AgentStatus,
          price: new Prisma.Decimal(data.price),
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          displayName: data.displayName,
          description: data.description,
          category: data.category as AgentCategory,
          tags: data.tags,
          readmeText: data.readmeText ?? null,
          verified: false,
          downloads: 0,
          rating: 0,
          reviewsCount: 0,
          permissionsNetwork: data.permissions?.network ?? false,
          permissionsFilesystem: data.permissions?.filesystem ?? false,
          permissionsSubprocess: data.permissions?.subprocess ?? false,
          pricingModel: data.pricingModel || 'ONE_TIME',
          pricePerCall: data.pricePerCall != null ? new Prisma.Decimal(data.pricePerCall) : null,
          runtime: data.runtime ?? null,
          inputs: data.inputs ?? Prisma.JsonNull,
          outputs: data.outputs ?? Prisma.JsonNull,
        },
      });

      return prismaAgentToApp(created);
    },
    update: async (id: string, data: Partial<Agent>) => {
      const updateData: Prisma.AgentUncheckedUpdateInput = {};
      if (typeof data.name === 'string') updateData.name = data.name;
      if (typeof data.slug === 'string') updateData.slug = data.slug;
      if (typeof data.version === 'string') updateData.version = data.version;
      if (typeof data.status === 'string') updateData.status = data.status as AgentStatus;
      if (typeof data.price === 'number') updateData.price = new Prisma.Decimal(data.price);
      if (typeof data.creatorId === 'string') updateData.creatorId = data.creatorId;
      if (typeof data.creatorName === 'string') updateData.creatorName = data.creatorName;
      if (typeof data.displayName === 'string') updateData.displayName = data.displayName;
      if (typeof data.description === 'string') updateData.description = data.description;
      if (typeof data.category === 'string') updateData.category = data.category as AgentCategory;
      if (Array.isArray(data.tags)) updateData.tags = { set: data.tags };
      if (typeof data.verified === 'boolean') updateData.verified = data.verified;
      if (typeof data.downloads === 'number') updateData.downloads = data.downloads;
      if (typeof data.rating === 'number') updateData.rating = data.rating;
      if (typeof data.reviewsCount === 'number') updateData.reviewsCount = data.reviewsCount;
      if (typeof data.readmeText === 'string') updateData.readmeText = data.readmeText;
      if (data.permissions) {
        if (typeof data.permissions.network === 'boolean') updateData.permissionsNetwork = data.permissions.network;
        if (typeof data.permissions.filesystem === 'boolean') updateData.permissionsFilesystem = data.permissions.filesystem;
        if (typeof data.permissions.subprocess === 'boolean') updateData.permissionsSubprocess = data.permissions.subprocess;
      }

      const updated = await prisma.agent.update({
        where: { id },
        data: updateData,
      });

      return prismaAgentToApp(updated);
    },
  },
  scans: {
    create: async (data: Omit<ScanResult, 'id' | 'timestamp'>) => {
      const created = await prisma.scanResult.create({
        data: {
          agentId: data.agentId,
          version: data.agentVersion,
          passed: data.status === 'PASS',
          findings: [
            ...data.secretsFound.map((s) => `Secret: ${s}`),
            ...data.disallowedFiles.map((f) => `Disallowed: ${f}`),
            ...(data.malwareClean ? [] : ['Malware detected']),
          ],
          malwareClean: data.malwareClean,
          secretsFound: data.secretsFound,
          disallowedFiles: data.disallowedFiles,
          status: scanStatusToDb(data.status),
        },
      });

      return {
        id: created.id,
        agentId: created.agentId,
        agentVersion: created.version,
        malwareClean: created.malwareClean,
        secretsFound: created.secretsFound,
        disallowedFiles: created.disallowedFiles,
        timestamp: toIsoTimestamp(created.createdAt),
        status: scanStatusFromDb(created.status),
      };
    },
    findByAgentId: async (agentId: string) => {
      const scan = await prisma.scanResult.findFirst({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
      });

      if (!scan) return undefined;

      return {
        id: scan.id,
        agentId: scan.agentId,
        agentVersion: scan.version,
        malwareClean: scan.malwareClean,
        secretsFound: scan.secretsFound,
        disallowedFiles: scan.disallowedFiles,
        timestamp: toIsoTimestamp(scan.createdAt),
        status: scanStatusFromDb(scan.status),
      };
    },
  },
  audit: {
    create: async (data: Omit<AuditLog, 'id' | 'timestamp'>) => {
      const created = await prisma.auditLog.create({
        data: {
          agentId: data.targetId,
          action: auditActionToDb(data.action),
          userId: data.actorId === 'system' ? null : data.actorId,
          details: data.details,
        },
      });

      return {
        id: created.id,
        action: created.action,
        targetId: created.agentId,
        actorId: created.userId ?? 'system',
        details: created.details,
        timestamp: toIsoTimestamp(created.createdAt),
      };
    },
    findByTargetId: async (targetId: string) => {
      const logs = await prisma.auditLog.findMany({
        where: { agentId: targetId },
        orderBy: { createdAt: 'desc' },
      });

      return logs.map((l) => ({
        id: l.id,
        action: l.action,
        targetId: l.agentId,
        actorId: l.userId ?? 'system',
        details: l.details,
        timestamp: toIsoTimestamp(l.createdAt),
      }));
    },
  },
  licenses: {
      create: async (data: Omit<License, 'id' | 'purchasedAt'>) => {
          const created = await prisma.license.upsert({
            where: {
              userId_agentId: {
                userId: data.userId,
                agentId: data.agentId,
              },
            },
            update: {
              pricePaid: new Prisma.Decimal(data.pricePaid),
            },
            create: {
              userId: data.userId,
              agentId: data.agentId,
              pricePaid: new Prisma.Decimal(data.pricePaid),
            },
          });

          return {
            id: created.id,
            userId: created.userId,
            agentId: created.agentId,
            purchasedAt: toIsoTimestamp(created.createdAt),
            pricePaid: decimalToNumber(created.pricePaid),
          };
      },
      check: async (userId: string, agentId: string) => {
          const license = await prisma.license.findUnique({
            where: {
              userId_agentId: {
                userId,
                agentId,
              },
            },
          });
          if (!license) return undefined;
          return {
            id: license.id,
            userId: license.userId,
            agentId: license.agentId,
            purchasedAt: toIsoTimestamp(license.createdAt),
            pricePaid: decimalToNumber(license.pricePaid),
          };
      },
      findByUser: async (userId: string) => {
          const result = await prisma.license.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
          });
          return result.map((l) => ({
            id: l.id,
            userId: l.userId,
            agentId: l.agentId,
            purchasedAt: toIsoTimestamp(l.createdAt),
            pricePaid: decimalToNumber(l.pricePaid),
          }));
      }
  },
  purchases: {
      create: async (data: Omit<Purchase, 'id' | 'createdAt'>) => {
          const created = await prisma.purchase.create({
            data: {
              userId: data.userId,
              agentId: data.agentId,
              stripeSessionId: data.stripeSessionId,
              status: purchaseStatusToDb(data.status),
              amount: new Prisma.Decimal(data.amount),
            },
          });

          return {
            id: created.id,
            userId: created.userId,
            agentId: created.agentId,
            amount: decimalToNumber(created.amount),
            status: purchaseStatusFromDb(created.status),
            stripeSessionId: created.stripeSessionId,
            createdAt: toIsoTimestamp(created.createdAt),
          };
      },
      findBySessionId: async (sessionId: string) => {
          const purchase = await prisma.purchase.findUnique({ where: { stripeSessionId: sessionId } });
          if (!purchase) return undefined;
          return {
            id: purchase.id,
            userId: purchase.userId,
            agentId: purchase.agentId,
            amount: decimalToNumber(purchase.amount),
            status: purchaseStatusFromDb(purchase.status),
            stripeSessionId: purchase.stripeSessionId,
            createdAt: toIsoTimestamp(purchase.createdAt),
          };
      },
      updateStatus: async (id: string, status: 'completed' | 'failed') => {
          const updated = await prisma.purchase.update({
            where: { id },
            data: { status: purchaseStatusToDb(status) },
          });
          return {
            id: updated.id,
            userId: updated.userId,
            agentId: updated.agentId,
            amount: decimalToNumber(updated.amount),
            status: purchaseStatusFromDb(updated.status),
            stripeSessionId: updated.stripeSessionId,
            createdAt: toIsoTimestamp(updated.createdAt),
          };
      }
  }
};
