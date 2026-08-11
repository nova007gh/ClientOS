'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Badge, Input, LeadScoreRing } from '@clientos/ui';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { Plus, Globe, EyeOff, ImageIcon, X, Check, Star, Code2, LineChart, Brain, ArrowRight, Verified } from 'lucide-react';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  featuredImage: string | null;
  published: boolean;
  createdAt: string;
}

interface Portfolio {
  id: string;
  username: string;
  headline: string;
  bio: string;
  published: boolean;
  items: PortfolioItem[];
}

const expertise = [
  {
    icon: Code2,
    title: 'Web Development',
    description: 'Scalable, high-performance web applications built on modern tech stacks designed for rapid growth and enterprise reliability.',
  },
  {
    icon: Brain,
    title: 'AI Strategy & Automation',
    description: 'Implementing advanced machine learning models and intelligent workflows to reduce operational friction and accelerate sales velocity.',
  },
  {
    icon: LineChart,
    title: 'Technical SEO & Growth',
    description: 'Data-driven optimization strategies that establish structural dominance in search engines and capture high-intent leads.',
  },
];

const feedback = [
  {
    rating: 5,
    text: '"Sarah didn\'t just build a website; she fundamentally re-engineered how we process inbound leads. Her understanding of AI integration is unparalleled. A true partner."',
    name: 'Marco Vance',
    role: 'CEO, Nexsus',
  },
  {
    rating: 5,
    text: '"Execution was flawless and communication was transparent throughout. The OmniFlow system she deployed saved us roughly 40 hours a week in manual data entry."',
    name: 'Elena Rostova',
    role: 'VP Ops, OmniFlow',
  },
];

export default function PortfolioPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [createForm, setCreateForm] = useState({ username: '', headline: '', bio: '' });
  const [editForm, setEditForm] = useState({ headline: '', bio: '', published: false });
  const [itemForm, setItemForm] = useState({ title: '', description: '', featuredImage: '', published: false });

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get<Portfolio | null>('/portfolio', accessToken);
        if (!cancelled) setPortfolio(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load portfolio');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [accessToken]);

  async function handleCreatePortfolio(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = await api.post<Portfolio>('/portfolio', {
        username: createForm.username,
        headline: createForm.headline,
        bio: createForm.bio,
        published: false,
      }, accessToken);
      setPortfolio(data);
      setShowCreateModal(false);
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Failed to create portfolio');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditPortfolio(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = await api.patch<Portfolio>('/portfolio', {
        headline: editForm.headline,
        bio: editForm.bio,
        published: editForm.published,
      }, accessToken);
      setPortfolio({ ...portfolio, ...data, items: portfolio?.items ?? [] } as Portfolio);
      setShowEditModal(false);
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Failed to update portfolio');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    if (!portfolio) return;
    try {
      const data = await api.patch<Portfolio>('/portfolio', { published: !portfolio.published }, accessToken);
      setPortfolio({ ...portfolio, ...data });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = await api.post<PortfolioItem>('/portfolio/items', {
        title: itemForm.title,
        description: itemForm.description,
        featuredImage: itemForm.featuredImage || null,
        published: itemForm.published,
      }, accessToken);
      setPortfolio({
        ...portfolio!,
        items: [data, ...portfolio!.items],
      });
      setShowAddItemModal(false);
      setItemForm({ title: '', description: '', featuredImage: '', published: false });
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Failed to add case study');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    try {
      await api.delete(`/portfolio/items/${itemId}`, accessToken);
      setPortfolio({ ...portfolio!, items: portfolio!.items.filter((i) => i.id !== itemId) });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  async function handleToggleItemPublish(item: PortfolioItem) {
    try {
      const data = await api.patch<PortfolioItem>(`/portfolio/items/${item.id}`, { published: !item.published }, accessToken);
      setPortfolio({ ...portfolio!, items: portfolio!.items.map((i) => (i.id === item.id ? data : i)) });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  function openEditModal() {
    if (!portfolio) return;
    setEditForm({ headline: portfolio.headline, bio: portfolio.bio, published: portfolio.published });
    setFormError('');
    setShowEditModal(true);
  }

  const items = portfolio?.items ?? [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-highest" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-surface-highest" />
          ))}
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="space-y-6">
        <h1 className="font-headline-lg text-headline-lg font-semibold">Portfolio</h1>
        <Card className="border border-outline-variant/60 bg-surface-high/20">
          <CardContent className="py-12 text-center">
            <p className="text-on-surface-variant">No portfolio yet. Create one to publish your case studies.</p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" /> Create portfolio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-secondary/10 text-secondary">ClientOS Verified Expert</Badge>
          </div>
          <h1 className="mt-2 font-headline-xl text-headline-xl font-semibold">{portfolio.headline || 'Building high-performance SaaS & AI Automations'}</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">{portfolio.bio || 'Sarah Jenkins | Agency Growth'}</p>
          <Button className="mt-4 w-full sm:w-auto" onClick={() => window.open(`/p/${portfolio.username}`, '_blank')}>
            Book a Discovery Call <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="sm:shrink-0">
          <Card className="border border-outline-variant/60 bg-surface-high/20 overflow-hidden">
            <div className="h-32 w-full bg-surface-highest sm:w-64" />
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold text-on-surface">24</p>
                  <p className="text-xs text-on-surface-variant">Verified Projects</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-on-surface">4.9★</p>
                  <p className="text-xs text-on-surface-variant">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="font-headline-md text-headline-md font-semibold">Core Expertise</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {expertise.map((exp) => {
            const Icon = exp.icon;
            return (
              <Card key={exp.title} className="border border-outline-variant/60 bg-surface-high/20">
                <CardContent className="p-5 space-y-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="font-headline-sm text-headline-sm font-semibold">{exp.title}</h3>
                  <p className="text-body-sm text-on-surface-variant">{exp.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="font-headline-md text-headline-md font-semibold">Verified Projects</h2>
        <p className="text-body-sm text-on-surface-variant">via ClientOS Escrow</p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.length === 0 ? (
            <p className="text-on-surface-variant col-span-full">No case studies yet. Add your first project.</p>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="border border-outline-variant/60 bg-surface-high/20 overflow-hidden">
                <div className="relative h-40 bg-surface-highest">
                  {item.featuredImage ? (
                    <img src={item.featuredImage} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-on-surface-variant" />
                  )}
                  {!item.published && <EyeOff className="absolute right-2 top-2 h-4 w-4 text-on-surface-variant" />}
                  <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded bg-surface-high/80 px-2 py-1 text-xs text-on-surface">
                    <Verified className="h-3 w-3 text-secondary" /> Verified Delivered
                  </div>
                </div>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-on-surface">{item.title}</h3>
                  <p className="line-clamp-2 text-body-sm text-on-surface-variant">{item.description || 'Project details...'}</p>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleToggleItemPublish(item)}>
                      {item.published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteItem(item.id)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <Button className="mt-4" onClick={() => setShowAddItemModal(true)}>
          <Plus className="h-4 w-4" /> Add case study
        </Button>
      </div>

      <div>
        <h2 className="font-headline-md text-headline-md font-semibold">Client Feedback</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {feedback.map((f, i) => (
            <Card key={i} className="border border-outline-variant/60 bg-surface-high/20">
              <CardContent className="p-5 space-y-3">
                <div className="flex gap-1">
                  {[...Array(f.rating)].map((_, r) => (
                    <Star key={r} className="h-4 w-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-body-sm text-on-surface italic">{f.text}</p>
                <div className="h-px bg-outline-variant" />
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary text-sm font-semibold">
                    {f.name[0]}
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-on-surface">{f.name}</p>
                    <p className="text-xs text-on-surface-variant">{f.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border border-outline-variant/60 bg-surface-high/20">
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-on-surface">Portfolio URL</h2>
            <p className="text-body-sm text-on-surface-variant">clientos.ai/{portfolio.username}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={openEditModal}>Edit</Button>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleTogglePublish}>
              <Globe className="mr-2 h-4 w-4" /> {portfolio.published ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md font-semibold">Create Portfolio</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-on-surface-variant hover:text-on-surface"><X className="h-5 w-5" /></button>
            </div>
            {formError && <div className="mt-4 rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">{formError}</div>}
            <form onSubmit={handleCreatePortfolio} className="mt-4 space-y-4">
              <div><label className="text-label-caps text-on-surface-variant">Username (URL slug) *</label><Input required className="mt-1" value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} placeholder="digital-boost" /></div>
              <div><label className="text-label-caps text-on-surface-variant">Headline</label><Input className="mt-1" value={createForm.headline} onChange={(e) => setCreateForm({ ...createForm, headline: e.target.value })} /></div>
              <div><label className="text-label-caps text-on-surface-variant">Bio</label><Input className="mt-1" value={createForm.bio} onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving || !createForm.username}>{saving ? 'Creating...' : 'Create portfolio'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md font-semibold">Edit Portfolio</h2>
              <button onClick={() => setShowEditModal(false)} className="text-on-surface-variant hover:text-on-surface"><X className="h-5 w-5" /></button>
            </div>
            {formError && <div className="mt-4 rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">{formError}</div>}
            <form onSubmit={handleEditPortfolio} className="mt-4 space-y-4">
              <div><label className="text-label-caps text-on-surface-variant">Headline</label><Input className="mt-1" value={editForm.headline} onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })} /></div>
              <div><label className="text-label-caps text-on-surface-variant">Bio</label><Input className="mt-1" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.published} onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })} className="h-4 w-4 rounded border-outline" /><span className="text-body-sm text-on-surface">Published</span></label>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md font-semibold">Add Case Study</h2>
              <button onClick={() => setShowAddItemModal(false)} className="text-on-surface-variant hover:text-on-surface"><X className="h-5 w-5" /></button>
            </div>
            {formError && <div className="mt-4 rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">{formError}</div>}
            <form onSubmit={handleAddItem} className="mt-4 space-y-4">
              <div><label className="text-label-caps text-on-surface-variant">Title *</label><Input required className="mt-1" value={itemForm.title} onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} /></div>
              <div><label className="text-label-caps text-on-surface-variant">Description</label><Input className="mt-1" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} /></div>
              <div><label className="text-label-caps text-on-surface-variant">Featured image URL</label><Input className="mt-1" value={itemForm.featuredImage} onChange={(e) => setItemForm({ ...itemForm, featuredImage: e.target.value })} /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={itemForm.published} onChange={(e) => setItemForm({ ...itemForm, published: e.target.checked })} className="h-4 w-4 rounded border-outline" /><span className="text-body-sm text-on-surface">Published</span></label>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddItemModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving || !itemForm.title}>{saving ? 'Adding...' : 'Add case study'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
