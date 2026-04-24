import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProfileSettingsClient from './ProfileSettingsClient';

function canUseDb() {
  return Boolean(process.env.DATABASE_URL);
}

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/settings/profile');
  }

  if (!canUseDb()) {
    return <div className="p-8 text-center text-gray-500">Database not configured.</div>;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect('/login?callbackUrl=/settings/profile');
  }

  return (
    <ProfileSettingsClient
      initialUser={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        emailVerified: Boolean(user.emailVerified),
        createdAt: user.createdAt.toISOString(),
      }}
    />
  );
}
