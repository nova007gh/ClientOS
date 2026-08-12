'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@clientos/ui';
import { FileText, Plus, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api-client';

interface ContractTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  active: boolean;
  updatedAt: string;
}

export default function ContractTemplatesPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ContractTemplate | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      try {
        const res = await api.get<{ data: ContractTemplate[] }>('/templates?type=CONTRACT', accessToken);
        setTemplates(res.data);
        if (res.data.length > 0) setSelected(res.data[0]);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-1/3 animate-pulse rounded bg-surface-highest" />
        <div className="h-64 w-full animate-pulse rounded-lg bg-surface-highest" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-error">{error}</div>;
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline-lg text-headline-lg font-semibold">Contract Templates</h1>
        <Button size="sm" onClick={() => { /* placeholder for create flow */ }}>
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </div>

      <div className="grid h-[calc(100vh-10rem)] grid-cols-1 gap-4 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-high/20 lg:grid-cols-3">
        <div className="col-span-1 overflow-y-auto border-r border-outline-variant p-3">
          {templates.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No contract templates yet.</p>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selected?.id === t.id
                      ? 'border-primary bg-surface-high/50'
                      : 'border-outline-variant/60 bg-surface-high/20 hover:bg-surface-high/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-on-surface">{t.name}</span>
                    {t.active && <Badge className="bg-primary/10 text-primary text-xs">Active</Badge>}
                  </div>
                  <p className="text-xs text-on-surface-variant">{t.category}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-1 flex flex-col p-4 lg:col-span-2">
          {selected ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-headline-md text-headline-md font-semibold">{selected.name}</h2>
                  <p className="text-body-sm text-on-surface-variant">
                    Updated {new Date(selected.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" onClick={() => router.push(`/dashboard/contracts/new?template=${selected.id}`)}>
                  Use Template <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <Card className="flex-1 overflow-y-auto border border-outline-variant/60 bg-surface-high/20">
                <CardContent className="p-6">
                  <div
                    className="prose prose-invert max-w-none text-on-surface"
                    dangerouslySetInnerHTML={{ __html: selected.content }}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-on-surface-variant">
              <FileText className="mr-2 h-5 w-5" /> Select a template to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
