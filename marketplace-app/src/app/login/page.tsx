'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Shield, User, Wrench } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (role: string) => {
    login(role);
    if (role === 'CREATOR') {
      router.push('/dashboard/creator');
    } else if (role === 'ADMIN') {
      router.push('/dashboard/admin');
    } else {
      router.push('/marketplace');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            (MVP Demo: Click a role to simulate login)
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Button
            onClick={() => handleLogin('BUYER')}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <User className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
            </span>
            Login as Buyer (Alice)
          </Button>

          <Button
            onClick={() => handleLogin('CREATOR')}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <Wrench className="h-5 w-5 text-green-500 group-hover:text-green-400" aria-hidden="true" />
            </span>
            Login as Creator (Bob)
          </Button>

          <Button
            onClick={() => handleLogin('ADMIN')}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <Shield className="h-5 w-5 text-red-500 group-hover:text-red-400" aria-hidden="true" />
            </span>
            Login as Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
