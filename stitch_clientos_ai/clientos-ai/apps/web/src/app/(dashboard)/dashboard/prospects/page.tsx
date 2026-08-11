'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Badge, LeadScoreRing, Input, Button } from '@clientos/ui';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { Search, Plus, Star, Globe, MapPin, X } from 'lucide-react';

interface Prospect {
  id: string;
  companyName: string;
  website: string | null;
  city: string | null;
  country: string | null;
  rating: number | null;
  reviewCount: number | null;
  status: string;
  leadScore: number | null;
  websiteStatus: string;
  industry?: { name: string } | null;
}

const statusColors: Record<string, 'default' | 'secondary' | 'warning' | 'error' | 'outline' | 'neutral'> = {
  NEW: 'neutral',
  CONTACTED: 'default',
  REPLIED: 'secondary',
  QUALIFIED: 'secondary',
  AUDITED: 'default',
  WON: 'secondary',
  LOST: 'error',
};

export default function ProspectsPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    website: '',
    phone: '',
    email: '',
    city: '',
    country: '',
    description: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<{ data: Prospect[] }>('/prospects', accessToken);
        setProspects(data.data);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setFormError('');
    try {
      const data = await api.post<Prospect>('/prospects', {
        companyName: form.companyName,
        website: form.website || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        description: form.description || undefined,
      }, accessToken);
      setProspects((prev) => [data, ...prev]);
      setShowAddModal(false);
      setForm({ companyName: '', website: '', phone: '', email: '', city: '', country: '', description: '' });
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Failed to add prospect');
    } finally {
      setAdding(false);
    }
  }

  const filtered = prospects.filter((p) =>
    p.companyName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-semibold">Prospects</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {prospects.length} total prospects in your pipeline
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add prospect
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
        <Input
          placeholder="Search prospects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && (
        <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Prospects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-surface-highest" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              No prospects found. Add your first prospect to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant text-left">
                    <th className="pb-3 font-label-caps text-label-caps text-on-surface-variant">Company</th>
                    <th className="pb-3 font-label-caps text-label-caps text-on-surface-variant">Industry</th>
                    <th className="pb-3 font-label-caps text-label-caps text-on-surface-variant">Location</th>
                    <th className="pb-3 font-label-caps text-label-caps text-on-surface-variant">Rating</th>
                    <th className="pb-3 font-label-caps text-label-caps text-on-surface-variant">Status</th>
                    <th className="pb-3 font-label-caps text-label-caps text-on-surface-variant text-right">Lead Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((prospect) => (
                    <tr
                      key={prospect.id}
                      className="cursor-pointer border-b border-outline-variant last:border-0 hover:bg-surface-high"
                      onClick={() => router.push(`/dashboard/prospects/${prospect.id}`)}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {prospect.website && <Globe className="h-3.5 w-3.5 text-on-surface-variant" />}
                          <span className="font-medium text-on-surface">{prospect.companyName}</span>
                        </div>
                      </td>
                      <td className="py-3 text-body-sm text-on-surface-variant">
                        {prospect.industry?.name ?? '—'}
                      </td>
                      <td className="py-3 text-body-sm text-on-surface-variant">
                        {prospect.city ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {prospect.city}, {prospect.country}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 text-body-sm text-on-surface-variant">
                        {prospect.rating ? (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-secondary text-secondary" />
                            {prospect.rating} ({prospect.reviewCount})
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3">
                        <Badge variant={statusColors[prospect.status] ?? 'neutral'}>
                          {prospect.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        {prospect.leadScore != null ? (
                          <LeadScoreRing score={prospect.leadScore} />
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md font-semibold">Add Prospect</h2>
              <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">
                {formError}
              </div>
            )}

            <form onSubmit={handleAdd} className="mt-4 space-y-4">
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant">Company name *</label>
                <Input
                  required
                  className="mt-1"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant">Website</label>
                  <Input
                    className="mt-1"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://acme.com"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant">Phone</label>
                  <Input
                    className="mt-1"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 555 0000"
                  />
                </div>
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant">Email</label>
                <Input
                  className="mt-1"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="info@acme.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant">City</label>
                  <Input
                    className="mt-1"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Accra"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant">Country</label>
                  <Input
                    className="mt-1"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder="Ghana"
                  />
                </div>
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant">Description</label>
                <Input
                  className="mt-1"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the business..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={adding || !form.companyName}>
                  {adding ? 'Adding...' : 'Add prospect'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
