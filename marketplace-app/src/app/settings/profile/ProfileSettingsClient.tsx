'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  role: 'BUYER' | 'CREATOR' | 'ADMIN';
  image: string | null;
  emailVerified: boolean;
  createdAt: string;
};

export default function ProfileSettingsClient({ initialUser }: { initialUser: UserProfile }) {
  const [name, setName] = useState(initialUser.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onSave = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to save');
        return;
      }
      setSaved(true);
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <p className="mt-1 text-sm text-gray-600">Update your account details.</p>

      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Email</div>
            <div className="mt-1 text-sm text-gray-900">{initialUser.email}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Role</div>
            <div className="mt-1 text-sm text-gray-900">{initialUser.role}</div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            maxLength={60}
            placeholder="Your name"
          />
          <div className="mt-1 text-xs text-gray-500">Shown on your public profile and reviews.</div>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {saved ? <div className="text-sm text-green-600">Saved.</div> : null}

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
