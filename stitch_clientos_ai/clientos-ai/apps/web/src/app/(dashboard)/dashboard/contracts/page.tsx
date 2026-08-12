'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@clientos/ui';
import { Plus, FileText, Clock, CheckCircle, PenLine, Search, MoreHorizontal } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

interface Contract {
  id: string;
  title: string;
  status: string;
  value: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  opportunity: { id: string; title: string } | null;
  parties: { id: string; name: string; role: string }[];
  _count: { signatures: number };
}

export default function ContractsPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      try {
        const res = await api.get<{ data: Contract[]; total: number }>(
          `/contracts?search=${encodeURIComponent(search)}`,
          accessToken,
        );
        setContracts(res.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load contracts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken, search]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <Badge className="bg-secondary/10 text-secondary"><CheckCircle className="mr-1 h-3 w-3" /> Signed</Badge>;
      case 'PENDING_SIGNATURE':
        return <Badge className="bg-warning/10 text-warning"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
      default:
        return <Badge className="bg-surface-highest text-on-surface-variant"><PenLine className="mr-1 h-3 w-3" /> Draft</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-semibold">Contracts</h1>
          <p className="text-body-sm text-on-surface-variant">Manage and track client agreements and e-signatures.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/contracts/new')}>
          <Plus className="mr-2 h-4 w-4" /> New Contract
        </Button>
      </div>

      <Card className="border border-outline-variant/60 bg-surface-high/20">
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-outline bg-surface py-2 pl-10 pr-4 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-lg bg-surface-highest" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="rounded-lg border border-outline-variant/60 bg-surface-high/20 px-4 py-12 text-center text-on-surface-variant">
          <FileText className="mx-auto h-10 w-10 mb-3 text-on-surface-variant" />
          <p>No contracts found. Create a new contract to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => (
            <Card
              key={contract.id}
              className="border border-outline-variant/60 bg-surface-high/20 cursor-pointer transition-colors hover:bg-surface-high/30"
              onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-on-surface truncate">{contract.title}</h3>
                    <p className="text-body-sm text-on-surface-variant">
                      {contract.opportunity?.title ?? 'No linked opportunity'} • {contract.parties.length} parties • {contract._count.signatures} signed
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant/60">
                      Updated {new Date(contract.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(contract.status)}
                    <MoreHorizontal className="h-5 w-5 text-on-surface-variant" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
