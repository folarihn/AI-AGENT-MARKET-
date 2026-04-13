export type UserRole = 'BUYER' | 'CREATOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

export type AgentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';

export interface Agent {
  id: string;
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
}

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alice Buyer',
    email: 'buyer@example.com',
    role: 'BUYER',
    isVerified: true,
  },
  {
    id: 'u2',
    name: 'Bob Creator',
    email: 'creator@example.com',
    role: 'CREATOR',
    isVerified: true,
  },
  {
    id: 'u3',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    isVerified: true,
  },
];

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'a1',
    slug: 'code-review-buddy',
    name: 'code-review-buddy',
    displayName: 'Code Review Buddy',
    description: 'Analyzes GitHub Pull Requests for common bugs and style violations.',
    category: 'DEVTOOLS',
    tags: ['github', 'code-quality'],
    status: 'PUBLISHED',
    price: 0,
    creatorId: 'u2',
    creatorName: 'Bob Creator',
    version: '1.0.0',
    updatedAt: '2023-10-25',
    verified: true,
    downloads: 1250,
    rating: 4.8,
    reviewsCount: 42,
    permissions: { network: true, filesystem: true, subprocess: false },
  },
  {
    id: 'a2',
    slug: 'seo-blogsmith',
    name: 'seo-blogsmith',
    displayName: 'SEO Blogsmith',
    description: 'Generates SEO-optimized articles from keywords.',
    category: 'PRODUCTIVITY',
    tags: ['seo', 'writing'],
    status: 'PUBLISHED',
    price: 19.99,
    creatorId: 'u2',
    creatorName: 'Bob Creator',
    version: '2.1.0',
    updatedAt: '2023-11-01',
    verified: true,
    downloads: 850,
    rating: 4.5,
    reviewsCount: 15,
    permissions: { network: true, filesystem: false, subprocess: false },
  },
  {
    id: 'a3',
    slug: 'competitor-monitor',
    name: 'competitor-monitor',
    displayName: 'Competitor Monitor',
    description: 'Tracks competitor pricing changes.',
    category: 'DATA',
    tags: ['market-research', 'scraping'],
    status: 'PENDING_REVIEW',
    price: 49.00,
    creatorId: 'u2',
    creatorName: 'Bob Creator',
    version: '1.0.0',
    updatedAt: '2023-11-05',
    verified: false,
    downloads: 0,
    rating: 0,
    reviewsCount: 0,
    permissions: { network: true, filesystem: false },
  },
];
