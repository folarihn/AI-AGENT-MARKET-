// Shared domain types used across the app's data layer.

export type UserRole = 'BUYER' | 'CREATOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

export type AgentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'COMING_SOON';

export interface Agent {
  id: string;
  itemType?: 'AGENT' | 'SKILL';
  slug: string;
  name: string;
  displayName: string;
  description: string;
  category: 'AUTOMATION' | 'DATA' | 'COMMUNICATION' | 'PRODUCTIVITY' | 'DEVTOOLS' | 'RESEARCH' | 'OTHER';
  tags: string[];
  status: AgentStatus;
  price: number;
  creatorId: string;
  creatorName: string;
  version: string;
  updatedAt: string;
  verified: boolean;
  downloads: number;
  rating: number;
  reviewsCount: number;
  readmeText?: string;
  permissions: {
    network: boolean;
    filesystem: boolean;
    subprocess?: boolean;
  };
  pricingModel?: 'FREE' | 'ONE_TIME' | 'PER_CALL';
}
