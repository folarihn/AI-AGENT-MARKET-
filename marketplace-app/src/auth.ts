import NextAuth from 'next-auth';
import type { User as NextAuthUser } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { siwe } from 'siwe';
import { prisma } from '@/lib/prisma';

type AppUserRole = 'BUYER' | 'CREATOR' | 'ADMIN';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    Credentials({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === 'string' ? credentials.email : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const authUser: NextAuthUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as AppUserRole,
        };

        return authUser;
      },
    }),
    Credentials({
      name: 'SIWE',
      credentials: {
        message: { label: 'Message', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
      },
      authorize: async (credentials) => {
        const messageStr = typeof credentials?.message === 'string' ? credentials.message : '';
        const signature = typeof credentials?.signature === 'string' ? credentials.signature : '';

        if (!messageStr || !signature) return null;

        try {
          const message = new siwe.SiweMessage(messageStr);
          const { data } = message.verify({ signature });

          const nonceRecord = await prisma.nonce.findUnique({
            where: { nonce: data.nonce },
          });

          if (!nonceRecord) {
            throw new Error('Invalid nonce');
          }

          if (nonceRecord.used) {
            throw new Error('Nonce already used');
          }

          if (nonceRecord.expiresAt < new Date()) {
            throw new Error('Nonce expired');
          }

          await prisma.nonce.update({
            where: { nonce: data.nonce },
            data: { used: true },
          });

          let user = await prisma.user.findFirst({
            where: { walletAddress: data.address.toLowerCase() },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: `wallet-${data.address.slice(2, 8).toLowerCase()}@agenti.local`,
                role: 'BUYER',
                walletAddress: data.address.toLowerCase(),
              },
            });
          }

          const authUser: NextAuthUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role as AppUserRole,
          };

          return authUser;
        } catch (error) {
          console.error('SIWE verification failed:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      if (user.email && adminEmails.includes(user.email.toLowerCase())) {
        await prisma.user.updateMany({
          where: { email: user.email.toLowerCase() },
          data: { role: 'ADMIN' },
        });
        user.role = 'ADMIN';
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        (token as unknown as { role?: AppUserRole }).role = user.role;
      }
      if (token?.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        if (dbUser) {
          (token as unknown as { role?: AppUserRole }).role = dbUser.role;
          (token as unknown as { walletAddress?: string }).walletAddress = dbUser.walletAddress || undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        const role = (token as unknown as { role?: AppUserRole }).role ?? 'BUYER';
        session.user.role = role;
        session.user.walletAddress = (token as unknown as { walletAddress?: string }).walletAddress;
      }
      return session;
    },
  },
});