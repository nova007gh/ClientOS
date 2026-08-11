'use client';

import { useState } from 'react';
import { Card, CardContent, Button, Badge, LeadScoreRing } from '@clientos/ui';
import { Edit, Plus, Sparkles, Bold, Italic, List, Link, ChevronDown, CheckCircle, AlertTriangle, Send, History, Type, Braces } from 'lucide-react';

const templates = [
  { id: '1', name: 'Cold Intro v4.2', category: 'SaaS Executives', open: '68% open', active: true },
  { id: '2', name: 'Follow-up: No Reply', category: 'General', open: '—', active: false },
  { id: '3', name: 'Case Study Drop', category: 'Late Stage Funnel', open: '—', active: false },
];

export default function TemplatesPage() {
  const [selected, setSelected] = useState(templates[0]);
  const [tone, setTone] = useState('Direct');
  const [subject, setSubject] = useState("Quick question regarding {{company_name}}'s data infrastructure");
  const [body, setBody] = useState(`Hi {{prospect_name}},

I noticed {{company_name}} recently {{recent_achievement}}. Congrats on that milestone.

As you scale, maintaining data integrity often becomes a bottleneck. We help teams like {{competitor_name}} automate their pipeline monitoring, saving them ~15 hours a week.

Are you open to a brief chat next week to see if we can do the same for your team?

Best,
Jane`);

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-0 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-high/20 lg:grid-cols-4">
      <div className="col-span-1 border-r border-outline-variant p-4">
        <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          <span>Library</span>
          <Plus className="h-4 w-4" />
        </div>
        <div className="space-y-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selected.id === t.id
                  ? 'border-primary bg-surface-high/50'
                  : 'border-outline-variant/60 bg-surface-high/20 hover:bg-surface-high/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-semibold text-on-surface">{t.name}</span>
                {t.active && <Sparkles className="h-3.5 w-3.5 text-primary" />}
              </div>
              <p className="text-xs text-on-surface-variant">{t.category}</p>
              <Badge className="mt-2 bg-secondary/10 text-secondary text-xs">{t.open}</Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-1 flex flex-col border-r border-outline-variant lg:col-span-2">
        <div className="flex items-center justify-between border-b border-outline-variant p-4">
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-body-lg font-semibold text-on-surface">{selected.name}</span>
            <Badge className="bg-surface-highest text-on-surface-variant text-[10px]">
              <Edit className="mr-1 h-3 w-3" /> Auto-saved
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <History className="mr-1.5 h-3.5 w-3.5" /> Versions
            </Button>
            <Button size="sm">
              <Send className="mr-1.5 h-3.5 w-3.5" /> Deploy Template
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Subject Line</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline bg-surface p-3 text-body-sm text-on-surface"
            />
          </div>

          <div className="flex items-center gap-2 border-b border-outline-variant bg-surface-container-lowest px-4 py-2">
          <select className="rounded border border-outline-variant bg-surface px-2 py-1 text-body-sm text-on-surface focus:border-primary focus:outline-none">
            <option>Inter</option>
            <option>Sans Serif</option>
          </select>
          <div className="w-px h-6 bg-outline-variant mx-1" />
          <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-surface-high text-on-surface-variant hover:text-on-surface"><Bold className="h-4 w-4" /></button>
          <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-surface-high text-on-surface-variant hover:text-on-surface"><Italic className="h-4 w-4" /></button>
          <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-surface-high text-on-surface-variant hover:text-on-surface"><List className="h-4 w-4" /></button>
          <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-surface-high text-on-surface-variant hover:text-on-surface"><Link className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-outline-variant mx-1" />
          <button className="inline-flex items-center gap-1 rounded bg-tertiary/20 px-3 py-1 text-[10px] text-tertiary border border-tertiary/30 hover:bg-tertiary/30">
            <Type className="h-3.5 w-3.5" /> Tone: {tone}
          </button>
          <button className="ml-auto inline-flex items-center gap-1 rounded border border-outline-variant px-3 py-1 text-[10px] text-on-surface-variant hover:border-primary hover:text-primary">
            <Braces className="h-3.5 w-3.5" /> Insert Variable
          </button>
        </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 h-[28rem] w-full resize-none rounded-lg border border-outline bg-surface p-4 font-mono text-body-sm leading-relaxed text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="col-span-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center gap-2 border-b border-outline-variant bg-surface px-4 py-3 -mx-4 -mt-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-body-lg text-body-lg font-semibold text-primary">AI Copilot</span>
        </div>

        <div className="rounded-xl border border-outline-variant/60 bg-surface p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Predicted Conversion</span>
            <Badge className="bg-secondary/10 text-secondary text-[10px]">High</Badge>
          </div>
          <div className="flex items-center gap-4">
            <LeadScoreRing score={82} />
            <div className="flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-highest mb-2">
                <div className="h-full w-[82%] rounded-full bg-secondary" />
              </div>
              <p className="font-label-caps text-label-caps text-on-surface-variant">Reading Grade: 8th</p>
              <p className="font-label-caps text-label-caps text-on-surface-variant">Word Count: Optimal</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="font-label-caps text-label-caps text-on-surface-variant">Actionable Insights</p>
          <div className="mt-2 space-y-3">
            <div className="flex items-start gap-2 rounded-lg bg-surface p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              <div>
                <p className="text-body-sm text-on-surface">Subject line is strong, but personalizing it further increases open rates by 14%.</p>
                <Button size="sm" variant="outline" className="mt-2 text-[10px]">Apply Suggested Subject</Button>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-error/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
              <p className="text-body-sm text-on-surface">The third paragraph is slightly passive. Consider using active voice for a stronger hook.</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="font-label-caps text-label-caps text-on-surface-variant">Tone Shift Quick Actions</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="text-[10px]">More Casual</Button>
            <Button size="sm" variant="outline" className="text-[10px]">More Urgent</Button>
            <Button size="sm" variant="outline" className="col-span-2 text-[10px]">Shorten & Punch Up</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
