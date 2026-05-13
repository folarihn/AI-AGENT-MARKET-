import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'BUYER' | 'CREATOR' | 'ADMIN';
      name?: string | null;
      email?: string | null;
      image?: string | null;
      walletAddress?: string;
    };
  }

  interface User {
    role?: 'BUYER' | 'CREATOR' | 'ADMIN';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'BUYER' | 'CREATOR' | 'ADMIN';
  }
}
