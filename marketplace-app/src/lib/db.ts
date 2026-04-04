import { Agent, MOCK_AGENTS } from '@/data/mock';

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
  action: 'UPLOAD' | 'APPROVE' | 'REJECT' | 'SCAN';
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

// Simulate database tables
let agents = [...MOCK_AGENTS];
let scanResults: ScanResult[] = [];
let auditLogs: AuditLog[] = [];
let licenses: License[] = [];
let purchases: Purchase[] = [];

export const db = {
  agents: {
    findMany: async (filter?: { creatorId?: string; status?: string }) => {
      let result = agents;
      if (filter?.creatorId) {
        result = result.filter((a) => a.creatorId === filter.creatorId);
      }
      if (filter?.status) {
        result = result.filter((a) => a.status === filter.status);
      }
      return result;
    },
    findById: async (id: string) => {
      return agents.find((a) => a.id === id);
    },
    create: async (data: Omit<Agent, 'id' | 'updatedAt' | 'verified' | 'downloads' | 'rating' | 'reviewsCount'>) => {
      const newAgent: Agent = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        updatedAt: new Date().toISOString().split('T')[0],
        verified: false,
        downloads: 0,
        rating: 0,
        reviewsCount: 0,
      };
      agents.push(newAgent);
      return newAgent;
    },
    update: async (id: string, data: Partial<Agent>) => {
      const index = agents.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('Agent not found');
      agents[index] = { ...agents[index], ...data };
      return agents[index];
    },
  },
  scans: {
    create: async (data: Omit<ScanResult, 'id' | 'timestamp'>) => {
      const newScan: ScanResult = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
      };
      scanResults.push(newScan);
      return newScan;
    },
    findByAgentId: async (agentId: string) => {
      return scanResults.filter((s) => s.agentId === agentId).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]; // Return latest
    }
  },
  audit: {
    create: async (data: Omit<AuditLog, 'id' | 'timestamp'>) => {
      const newLog: AuditLog = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
      };
      auditLogs.push(newLog);
      return newLog;
    },
    findByTargetId: async (targetId: string) => {
      return auditLogs.filter(l => l.targetId === targetId).sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
  },
  licenses: {
      create: async (data: Omit<License, 'id' | 'purchasedAt'>) => {
          const newLicense: License = {
              ...data,
              id: Math.random().toString(36).substr(2, 9),
              purchasedAt: new Date().toISOString(),
          };
          licenses.push(newLicense);
          return newLicense;
      },
      check: async (userId: string, agentId: string) => {
          return licenses.find(l => l.userId === userId && l.agentId === agentId);
      },
      findByUser: async (userId: string) => {
          return licenses.filter(l => l.userId === userId);
      }
  },
  purchases: {
      create: async (data: Omit<Purchase, 'id' | 'createdAt'>) => {
          const newPurchase: Purchase = {
              ...data,
              id: Math.random().toString(36).substr(2, 9),
              createdAt: new Date().toISOString(),
          };
          purchases.push(newPurchase);
          return newPurchase;
      },
      findBySessionId: async (sessionId: string) => {
          return purchases.find(p => p.stripeSessionId === sessionId);
      },
      updateStatus: async (id: string, status: 'completed' | 'failed') => {
          const index = purchases.findIndex(p => p.id === id);
          if (index !== -1) {
              purchases[index].status = status;
              return purchases[index];
          }
          return null;
      }
  }
};
