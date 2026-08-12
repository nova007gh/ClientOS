'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@clientos/ui';
import { ArrowLeft, Edit, Send, Lock, FileCheck, CheckCircle2, Circle, Clock, MoreHorizontal, Pen, CheckCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

interface ContractParty {
  id: string;
  name: string;
  email: string;
  role: string;
  signatures: { signedAt: string; signatureData: string }[];
}

interface ContractVersion {
  id: string;
  version: number;
  content: string;
  createdBy: string;
  createdAt: string;
}

interface Contract {
  id: string;
  title: string;
  status: string;
  value: number | null;
  currency: string;
  opportunity: { id: string; title: string } | null;
  versions: ContractVersion[];
  parties: ContractParty[];
  createdAt: string;
  updatedAt: string;
}

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { accessToken, user } = useAuthStore();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState('');

  useEffect(() => {
    if (!accessToken || !id) return;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get<Contract>(`/contracts/${id}`, accessToken);
        setContract(res);
        setDraftContent(res.versions[0]?.content ?? '');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load contract');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken, id]);

  const handleSend = async () => {
    if (!contract || !accessToken) return;
    try {
      setSaving(true);
      await api.patch(`/contracts/${contract.id}`, { status: 'PENDING_SIGNATURE' }, accessToken);
      const updated = await api.get<Contract>(`/contracts/${contract.id}`, accessToken);
      setContract(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send contract');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!contract || !accessToken) return;
    try {
      setSaving(true);
      const updated = await api.post<Contract>(
        `/contracts/${contract.id}/content`,
        { content: draftContent },
        accessToken,
      );
      setContract(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save contract');
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async (partyId: string) => {
    if (!contract || !accessToken || !user) return;
    try {
      setSaving(true);
      const signatureData = `Signed by ${user.firstName} ${user.lastName} (${user.email})`;
      const updated = await api.post<Contract>(
        `/contracts/${contract.id}/sign/${partyId}`,
        { signatureData },
        accessToken,
      );
      setContract(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to sign contract');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/3 animate-pulse rounded bg-surface-highest" />
        <div className="h-96 w-full animate-pulse rounded-lg bg-surface-highest" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">
        {error || 'Contract not found'}
      </div>
    );
  }

  const currentContent = contract.versions[0]?.content ?? '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/contracts')}>
          <ArrowLeft className="h-4 w-4" /> Back to Contracts
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-semibold">{contract.title}</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Ref: {contract.id.slice(0, 12).toUpperCase()} • Last edited {new Date(contract.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={contract.status === 'SIGNED' ? 'bg-secondary/10 text-secondary' : 'bg-warning/10 text-warning'}>
            {contract.status === 'SIGNED' ? 'Signed' : 'Pending Signature'}
          </Badge>
          {editing ? (
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Draft
            </Button>
          )}
          {editing ? (
            <Button onClick={handleSaveEdit} disabled={saving}>
              <CheckCircle className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={saving || contract.status === 'SIGNED'}>
              <Send className="mr-2 h-4 w-4" /> {saving ? 'Sending...' : 'Send for Signature'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-0">
              {editing && (
                <div className="flex items-center gap-3 border-b border-outline-variant p-3">
                  <button className="rounded p-1.5 hover:bg-surface-high font-bold text-on-surface">B</button>
                  <button className="rounded p-1.5 italic text-on-surface hover:bg-surface-high">I</button>
                  <span className="ml-auto text-xs text-on-surface-variant">Auto-saved 1m ago</span>
                </div>
              )}

              <div className="space-y-6 p-4 sm:p-8 text-on-surface">
                {editing ? (
                  <textarea
                    className="w-full min-h-[400px] rounded-lg border border-outline bg-surface p-4 text-body-sm text-on-surface"
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                  />
                ) : (
                  <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentContent }}
                  />
                )}

                {!editing && (
                  <div className="rounded-lg border border-outline-variant bg-surface-high/30 p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><FileCheck className="h-4 w-4 text-primary" /> Signatures Required</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {contract.parties.map((party) => (
                        <div key={party.id} className="space-y-2">
                          <p className="text-xs uppercase tracking-wider text-on-surface-variant">{party.role}</p>
                          <div className={`rounded border border-dashed p-4 text-center ${party.signatures.length ? 'border-outline-variant bg-surface' : 'border-warning bg-warning/5'}`}>
                            {party.signatures.length ? (
                              <>
                                <p className="text-sm text-secondary flex items-center justify-center gap-1"><CheckCircle className="h-4 w-4" /> Signed</p>
                                <p className="mt-2 text-sm font-semibold text-on-surface">{party.name}</p>
                                <p className="text-xs text-on-surface-variant">{new Date(party.signatures[0].signedAt).toLocaleDateString()}</p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-warning flex items-center justify-center gap-1"><Clock className="h-4 w-4" /> Awaiting signature</p>
                                <p className="mt-2 text-sm font-semibold text-on-surface">{party.name}</p>
                                <p className="text-xs text-on-surface-variant mb-3">{party.email}</p>
                                <Button size="sm" onClick={() => handleSign(party.id)} disabled={saving}>
                                  <Pen className="mr-1 h-3.5 w-3.5" /> Sign
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-headline-md text-headline-md font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5 text-on-surface-variant" /> Contract Intelligence
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-body-sm text-on-surface">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-secondary" />
                  <span>Standard terms detected. Matches company playbook 98%.</span>
                </div>
                <div className="flex items-start gap-2 text-body-sm text-on-surface">
                  <Circle className="mt-0.5 h-4 w-4 text-warning" />
                  <span>Non-standard payment terms. Net 30 negotiated from Net 45.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-headline-md text-headline-md font-semibold">Parties Involved</h2>
              <div className="space-y-3">
                {contract.parties.map((party) => (
                  <div key={party.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-surface-highest flex items-center justify-center text-on-surface font-semibold">
                      {party.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">{party.name}</p>
                      <p className="text-xs text-on-surface-variant">{party.email}</p>
                    </div>
                    <Badge className={`ml-auto ${party.signatures.length ? 'bg-secondary/10 text-secondary' : 'bg-warning/10 text-warning'}`}>
                      {party.signatures.length ? 'Signed' : party.role === 'PROVIDER' ? 'Drafting' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md font-semibold">History</h2>
                <MoreHorizontal className="h-4 w-4 text-on-surface-variant" />
              </div>
              <div className="space-y-4">
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-secondary" />
                  <p className="text-body-sm font-medium text-on-surface">Ready for Signature</p>
                  <p className="text-xs text-on-surface-variant">Contract finalized and marked ready.</p>
                  <p className="text-xs text-on-surface-variant/60">{new Date(contract.updatedAt).toLocaleString()}</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-on-surface-variant" />
                  <p className="text-body-sm font-medium text-on-surface">Variables Updated</p>
                  <p className="text-xs text-on-surface-variant">Payment terms updated to Net 30.</p>
                  <p className="text-xs text-on-surface-variant/60">{new Date(contract.createdAt).toLocaleString()}</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-on-surface-variant" />
                  <p className="text-body-sm font-medium text-on-surface">Draft Created</p>
                  <p className="text-xs text-on-surface-variant">Generated from template &quot;Standard MSA v2.1&quot;.</p>
                  <p className="text-xs text-on-surface-variant/60">Yesterday</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
