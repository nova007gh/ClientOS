'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@clientos/ui';
import { FileText, Pen, CheckCircle, Clock } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';

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
  createdAt: string;
}

interface Contract {
  id: string;
  title: string;
  status: string;
  value: number | null;
  currency: string;
  versions: ContractVersion[];
  parties: ContractParty[];
  updatedAt: string;
}

export default function PublicContractPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const res = await api.get<Contract>(`/contracts/public/${token}`);
        setContract(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load contract');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const handleSign = async (party: ContractParty) => {
    if (!contract || !token) return;
    const signatureData = window.prompt(`Type your full name to sign as ${party.name}`);
    if (!signatureData || !signatureData.trim()) return;

    try {
      setSigning(party.id);
      const updated = await api.post<Contract>(
        `/contracts/public/${token}/sign/${party.id}`,
        {
          signatureData: signatureData.trim(),
          audit: { userAgent: navigator.userAgent },
        },
      );
      setContract(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to sign contract');
    } finally {
      setSigning(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6 sm:p-12">
        <div className="mx-auto max-w-3xl">
          <div className="h-8 w-1/3 animate-pulse rounded bg-surface-highest" />
          <div className="mt-6 h-96 w-full animate-pulse rounded-lg bg-surface-highest" />
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-surface p-6 sm:p-12 text-center text-on-surface-variant">
        <FileText className="mx-auto h-12 w-12 mb-4" />
        <p>{error || 'Contract not found'}</p>
      </div>
    );
  }

  const currentContent = contract.versions[0]?.content ?? '';
  const allSigned = contract.parties.every((p) => p.signatures.length > 0);

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-semibold">{contract.title}</h1>
            <p className="text-body-sm text-on-surface-variant">
              Ref: {contract.id.slice(0, 12).toUpperCase()}
            </p>
          </div>
          <Badge className={allSigned ? 'bg-secondary/10 text-secondary' : 'bg-warning/10 text-warning'}>
            {allSigned ? 'Signed' : 'Pending Signature'}
          </Badge>
        </div>

        <Card className="border border-outline-variant/60 bg-surface-high/20">
          <CardContent className="p-6 sm:p-8">
            <div
              className="prose prose-invert max-w-none text-on-surface"
              dangerouslySetInnerHTML={{ __html: currentContent }}
            />
          </CardContent>
        </Card>

        <Card className="border border-outline-variant/60 bg-surface-high/20">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-headline-md text-headline-md font-semibold">Signatures</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {contract.parties.map((party) => (
                <div
                  key={party.id}
                  className={`rounded border p-4 text-center ${
                    party.signatures.length
                      ? 'border-outline-variant bg-surface'
                      : 'border-dashed border-warning bg-warning/5'
                  }`}
                >
                  <p className="text-xs uppercase tracking-wider text-on-surface-variant">{party.role}</p>
                  <p className="mt-1 font-semibold text-on-surface">{party.name}</p>
                  <p className="text-sm text-on-surface-variant">{party.email}</p>

                  {party.signatures.length ? (
                    <p className="mt-3 flex items-center justify-center gap-1 text-sm text-secondary">
                      <CheckCircle className="h-4 w-4" /> Signed on{' '}
                      {new Date(party.signatures[0].signedAt).toLocaleDateString()}
                    </p>
                  ) : (
                    <Button
                      className="mt-3"
                      size="sm"
                      onClick={() => handleSign(party)}
                      disabled={!!signing}
                    >
                      {signing === party.id ? (
                        'Signing...'
                      ) : (
                        <>
                          <Pen className="mr-1 h-3.5 w-3.5" /> Sign as {party.name}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-on-surface-variant/60">
          Powered by ClientOS · All signatures are recorded with an audit trail.
        </p>
      </div>
    </div>
  );
}
