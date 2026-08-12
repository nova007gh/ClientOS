'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Input } from '@clientos/ui';
import { ArrowLeft, Plus, Trash } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

interface Party {
  name: string;
  email: string;
  role: string;
}

export default function NewContractPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [title, setTitle] = useState('Master Services Agreement');
  const [parties, setParties] = useState<Party[]>([
    { name: '', email: '', role: 'PROVIDER' },
    { name: '', email: '', role: 'CLIENT' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddParty = () => {
    setParties([...parties, { name: '', email: '', role: 'SIGNER' }]);
  };

  const handleRemoveParty = (index: number) => {
    setParties(parties.filter((_, i) => i !== index));
  };

  const handlePartyChange = (index: number, field: keyof Party, value: string) => {
    const updated = [...parties];
    updated[index][field] = value;
    setParties(updated);
  };

  const handleCreate = async () => {
    if (!accessToken) return;
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (parties.some((p) => !p.name.trim())) {
      setError('All parties must have a name');
      return;
    }

    try {
      setSaving(true);
      const res = await api.post<{ id: string }>(
        '/contracts',
        { title, parties },
        accessToken,
      );
      router.push(`/dashboard/contracts/${res.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create contract');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/contracts')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <h1 className="font-headline-lg text-headline-lg font-semibold">New Contract</h1>

      {error && (
        <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">
          {error}
        </div>
      )}

      <Card className="border border-outline-variant/60 bg-surface-high/20">
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="text-label-caps text-on-surface-variant">Contract Title</label>
            <Input
              className="mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Master Services Agreement"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-label-caps text-on-surface-variant">Parties</label>
              <Button type="button" size="sm" variant="outline" onClick={handleAddParty}>
                <Plus className="h-4 w-4" /> Add Party
              </Button>
            </div>

            {parties.map((party, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end rounded-lg border border-outline-variant p-3">
                <div className="col-span-4">
                  <label className="text-xs text-on-surface-variant">Name</label>
                  <Input
                    value={party.name}
                    onChange={(e) => handlePartyChange(index, 'name', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-on-surface-variant">Email</label>
                  <Input
                    value={party.email}
                    onChange={(e) => handlePartyChange(index, 'email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-on-surface-variant">Role</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-outline bg-surface px-3 py-2 text-body-sm text-on-surface"
                    value={party.role}
                    onChange={(e) => handlePartyChange(index, 'role', e.target.value)}
                  >
                    <option value="PROVIDER">Provider</option>
                    <option value="CLIENT">Client</option>
                    <option value="SIGNER">Signer</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveParty(index)}
                    disabled={parties.length <= 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create Contract'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
