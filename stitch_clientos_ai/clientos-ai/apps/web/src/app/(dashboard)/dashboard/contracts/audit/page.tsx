'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Badge } from '@clientos/ui';
import { FileText, Pen, Clock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api-client';

interface AuditEvent {
  id: string;
  type: 'SIGNATURE' | 'VERSION';
  contractId: string;
  contractTitle: string;
  timestamp: string;
  partyName?: string;
  partyRole?: string;
  signatureData?: string;
  audit?: { userAgent?: string; ip?: string } | null;
  version?: number;
  createdBy?: string;
}

export default function ContractAuditPage() {
  const { accessToken } = useAuthStore();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      try {
        const res = await api.get<{ data: AuditEvent[] }>('/contracts/audit', accessToken);
        setEvents(res.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load audit log');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="space-y-4 p-6">
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
      <h1 className="font-headline-lg text-headline-lg font-semibold">Contract Audit Log</h1>

      {events.length === 0 ? (
        <p className="text-on-surface-variant">No contract events yet.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id} className="border border-outline-variant/60 bg-surface-high/20">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {event.type === 'SIGNATURE' ? (
                        <CheckCircle className="h-4 w-4 text-secondary" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-semibold text-on-surface">
                        {event.type === 'SIGNATURE' ? 'Signed' : 'Version created'}
                      </span>
                      <Badge
                        className={
                          event.type === 'SIGNATURE'
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-primary/10 text-primary'
                        }
                      >
                        {event.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      <span className="font-medium text-on-surface">{event.contractTitle}</span>
                      {event.type === 'SIGNATURE' && event.partyName && (
                        <span> · {event.partyName} ({event.partyRole})</span>
                      )}
                      {event.type === 'VERSION' && (
                        <span> · Version {event.version} by {event.createdBy || 'Unknown'}</span>
                      )}
                    </p>
                    {event.type === 'SIGNATURE' && event.signatureData && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-on-surface">
                        <Pen className="h-3.5 w-3.5 text-on-surface-variant" />
                        Signature: {event.signatureData}
                      </p>
                    )}
                    {event.type === 'SIGNATURE' && event.audit?.userAgent && (
                      <p className="mt-1 text-xs text-on-surface-variant/70">
                        User agent: {event.audit.userAgent}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(event.timestamp).toLocaleString()}
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
