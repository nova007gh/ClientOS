'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@clientos/ui';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { ArrowLeft, Sparkles, CheckCircle, Clock, AlertTriangle, Users, Calendar, MoreHorizontal, Plus, GripVertical, LayoutGrid, List, CalendarDays } from 'lucide-react';

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  budget: number | null;
  currency: string;
  createdAt: string;
  members: { userId: string; projectRole: string }[];
  tasks: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignedTo: string | null;
    dueDate: string | null;
    milestoneId: string | null;
  }[];
  milestones: { id: string; name: string; description: string; dueDate: string | null; status: string }[];
}

const statusColumns = ['To Do', 'In Progress', 'Review', 'Done'];

function initial(name: string | null): string {
  return name ? name[0].toUpperCase() : '?';
}

function statusColor(status: string): 'good' | 'warning' | 'bad' {
  if (status === 'On Track') return 'good';
  if (status === 'At Risk') return 'warning';
  return 'good';
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const id = params.id as string;

  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      try {
        const data = await api.get<ProjectDetail>(`/projects/${id}`, accessToken);
        setProject(data);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, accessToken]);

  const columns = useMemo(() => {
    if (!project) return [];
    const map: Record<string, ProjectDetail['tasks']> = {
      'To Do': project.tasks.filter((t) => t.status === 'TODO'),
      'In Progress': project.tasks.filter((t) => t.status === 'IN_PROGRESS'),
      'Review': project.tasks.filter((t) => t.status === 'REVIEW' || (t.status !== 'TODO' && t.status !== 'IN_PROGRESS' && t.status !== 'DONE')),
      'Done': project.tasks.filter((t) => t.status === 'DONE'),
    };
    return statusColumns.map((col) => ({ name: col, tasks: map[col] ?? [] }));
  }, [project]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-highest" />
        <div className="h-64 animate-pulse rounded-lg bg-surface-highest" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
      </div>
    );
  }

  if (!project) return null;

  const completed = project.tasks.filter((t) => t.status === 'DONE').length;
  const blockers = project.tasks.filter((t) => t.status === 'BLOCKED').length;
  const totalBudget = project.budget ?? 65000;
  const spent = Math.round(totalBudget * 0.22);
  const week = 2;
  const totalWeeks = 8;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/projects')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="font-headline-lg text-headline-lg font-semibold">{project.name}</h1>
          <Badge className="bg-secondary/10 text-secondary">On Track</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-outline-variant/60 bg-surface-high/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-on-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">AI Project Planner Active</p>
                <h2 className="mt-1 font-headline-md text-headline-md font-semibold">Contract parsed. {project.tasks.length} tasks generated.</h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  ClientOS AI has automatically broken down the &apos;{project.description || 'Enterprise SaaS Migration'}&apos; contract into phases, assigned team members based on capacity, and estimated timelines.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Button size="sm" className="bg-primary text-on-primary">Review Plan</Button>
                  <Button size="sm" variant="outline">Regenerate</Button>
                  <div className="ml-auto flex -space-x-2">
                    {project.members.slice(0, 3).map((m, i) => (
                      <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-semibold ring-2 ring-surface">
                        {initial(m.userId)}
                      </div>
                    ))}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-on-primary text-xs font-semibold ring-2 ring-surface">
                      +{project.members.length - 3}
                    </div>
                  </div>
                  <span className="text-body-sm text-on-surface-variant">Team Assigned</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-outline-variant/60 bg-surface-high/20">
          <CardContent className="p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Project Health</p>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-on-surface-variant">Timeline</span>
                  <span className="text-secondary">Week {week} of {totalWeeks}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-highest">
                  <div className="h-full w-1/4 rounded-full bg-secondary" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-on-surface-variant">Budget Burn</span>
                  <span className="text-on-surface">22% (${(spent / 1000).toFixed(0)}k/${(totalBudget / 1000).toFixed(0)}k)</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-highest">
                  <div className="h-full w-[22%] rounded-full bg-primary" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-high/30 p-3">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider">Tasks Done</p>
                <p className="mt-1 text-2xl font-semibold text-on-surface">{completed} / {project.tasks.length}</p>
              </div>
              <div className="rounded-lg bg-surface-high/30 p-3">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider">Blockers</p>
                <p className="mt-1 text-2xl font-semibold text-on-surface">{blockers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md font-semibold">Active Sprint Tasks</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="bg-surface-high/30">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" /> Generate Tasks
            </Button>
            <Button size="sm" variant="outline" className="p-2"><LayoutGrid className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" className="p-2"><List className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" className="p-2"><CalendarDays className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.name} className="rounded-xl border border-outline-variant/50 bg-surface-container-low/50 p-3">
              <div className="mb-3 flex items-center gap-2 px-1 text-body-sm font-medium text-on-surface">
                <span className={`h-2 w-2 rounded-full ${
                  col.name === 'To Do' ? 'bg-on-surface-variant' :
                  col.name === 'In Progress' ? 'bg-primary' :
                  col.name === 'Review' ? 'bg-warning' : 'bg-secondary'
                }`} />
                {col.name}
                <span className="rounded bg-surface-container px-1.5 py-0.5 text-[10px] text-on-surface-variant">{col.tasks.length}</span>
                <button className="ml-auto text-on-surface-variant transition-colors hover:text-primary">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {col.tasks.slice(0, 6).map((task) => (
                  <div key={task.id} className="group cursor-pointer rounded-lg border border-outline-variant bg-surface p-3 transition-all hover:border-outline hover:shadow-lg">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        task.priority === 'High' ? 'bg-error/10 text-error' :
                        task.priority === 'Medium' ? 'bg-warning/10 text-warning' :
                        'bg-surface-highest text-on-surface-variant'
                      }`}>
                        {task.priority}
                      </span>
                      <MoreHorizontal className="h-4 w-4 text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    {task.milestoneId && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded bg-tertiary/10 px-1.5 py-0.5 text-[10px] text-tertiary">
                        <Sparkles className="h-2.5 w-2.5" /> Phase {task.milestoneId.slice(-1)}
                      </span>
                    )}
                    <p className="mt-2 text-body-sm font-medium text-on-surface">{task.title}</p>
                    {task.description && (
                      <p className="mt-1 text-xs text-on-surface-variant line-clamp-2">{task.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary text-[10px] font-semibold">
                        {initial(task.assignedTo)}
                      </div>
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {col.tasks.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-xs text-on-surface-variant/50">No tasks</span>
                  </div>
                )}
                <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-outline-variant py-2 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary">
                  <Plus className="h-3.5 w-3.5" /> Add Task
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
