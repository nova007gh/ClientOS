'use client';

import { useState } from 'react';
import { Badge, Button, Input, Label } from '@clientos/ui';
import { Plus, CheckSquare, Flag, CalendarClock, X } from 'lucide-react';
import { useResource } from '@/lib/use-resource';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import {
  ErrorBanner,
  StateCard,
  Th,
  Tr,
  formatCurrency,
  formatDate,
} from '@/components/page-shell';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  budget: number | null;
  currency: string;
  _count?: { tasks: number; milestones: number };
}

const statusVariants: Record<string, 'default' | 'secondary' | 'warning' | 'error' | 'neutral'> = {
  PLANNING: 'neutral',
  ACTIVE: 'secondary',
  ON_HOLD: 'warning',
  COMPLETED: 'default',
  CANCELLED: 'error',
};

export default function ProjectsPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { data: projects, loading, error } = useResource<Project>('/projects');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', budget: '', startDate: '', dueDate: '' });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = await api.post<Project>('/projects', {
        name: form.name,
        description: form.description,
        budget: form.budget ? parseFloat(form.budget) : null,
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
      }, accessToken);
      setShowModal(false);
      router.push(`/dashboard/projects/${data.id}`);
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Failed to create project');
    } finally {
      setSaving(false);
    }
  }

  const activeCount = projects.filter((p) => p.status === 'ACTIVE').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-semibold">Projects</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {projects.length} projects — {activeCount} active, {formatCurrency(totalBudget)} total budget
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      <ErrorBanner message={error} />

      <StateCard
        title="All Projects"
        loading={loading}
        isEmpty={projects.length === 0}
        emptyMessage="No projects yet. Create one to track deliverables, milestones, and tasks."
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Start</Th>
                <Th>Due</Th>
                <Th align="right">Milestones</Th>
                <Th align="right">Tasks</Th>
                <Th align="right">Budget</Th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <Tr key={project.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                  <td className="py-3">
                    <div>
                      <span className="font-medium text-on-surface">{project.name}</span>
                      {project.description && (
                        <p className="max-w-sm truncate text-body-sm text-on-surface-variant">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge variant={statusVariants[project.status] ?? 'neutral'}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 text-body-sm text-on-surface-variant">
                    {formatDate(project.startDate)}
                  </td>
                  <td className="py-3 text-body-sm text-on-surface-variant">
                    {project.dueDate ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {formatDate(project.dueDate)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 text-right text-body-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <Flag className="h-3 w-3" />
                      {project._count?.milestones ?? 0}
                    </span>
                  </td>
                  <td className="py-3 text-right text-body-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <CheckSquare className="h-3 w-3" />
                      {project._count?.tasks ?? 0}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium text-on-surface">
                    {formatCurrency(project.budget, project.currency)}
                  </td>
                </Tr>
              ))}
            </tbody>
          </table>
        </div>
      </StateCard>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md font-semibold">New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <X className="h-5 w-5" />
              </button>
            </div>
            {formError && (
              <div className="mt-4 rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <Label>Project name *</Label>
                <Input
                  required
                  className="mt-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Acme Corp — Website Redesign"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  className="mt-1"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Complete redesign with CMS migration..."
                />
              </div>
              <div>
                <Label>Budget</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="10000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start date</Label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Due date</Label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !form.name}>
                  {saving ? 'Creating...' : 'Create project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
