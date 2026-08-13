'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Badge, LeadScoreRing } from '@clientos/ui';
import { Mail, Phone, MoreVertical, Filter, Sparkles, Send, Bold, Link2, Paperclip, Smile, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api-client';

interface Conversation {
  id: string;
  company: string;
  contact: string;
  title: string;
  time: string;
  tags: string[];
  messages: { id: string; sender: string; body: string; time: string; isMe: boolean }[];
  score: number;
  intent: string;
  friction: string[];
  pitch: string;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [reply, setReply] = useState('Reply...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      try {
        const res = await api.get<{ data: Conversation[] }>('/inbox', accessToken);
        setConversations(res.data);
        if (res.data.length > 0) setSelected(res.data[0]);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load inbox');
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
        <div className="h-96 w-full animate-pulse rounded-lg bg-surface-highest" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-error">{error}</div>;
  }

  if (!selected) {
    return <div className="p-6 text-on-surface-variant">No conversations found.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-headline-lg text-headline-lg font-semibold">Inbox</h1>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
      </div>

      <div className="grid h-[calc(100vh-10rem)] grid-cols-1 gap-4 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-high/20 lg:h-[calc(100vh-12rem)] lg:grid-cols-12">
        {/* Conversation list */}
        <div className={`col-span-1 overflow-y-auto border-r border-outline-variant p-3 lg:col-span-3 ${selected ? 'hidden lg:block' : 'block'}`}>
          <div className="space-y-2">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full rounded-lg p-3 text-left transition-colors ${
                  selected.id === c.id ? 'bg-surface-high/50' : 'hover:bg-surface-high/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-on-surface">{c.company}</span>
                  <span className="text-xs text-on-surface-variant">{c.time}</span>
                </div>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">{c.contact}</p>
                <p className="mt-1 text-xs text-on-surface">{c.title}</p>
                <div className="mt-2 flex gap-1">
                  {c.tags.map((tag) => (
                    <Badge key={tag} className={`text-xs ${
                      tag === 'High Intent' ? 'bg-secondary/10 text-secondary' :
                      tag === 'Meeting Request' ? 'bg-primary/10 text-primary' :
                      tag === 'Interested' ? 'bg-tertiary/10 text-tertiary' :
                      'bg-surface-highest text-on-surface-variant'
                    }`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className={`col-span-1 flex flex-col border-r border-outline-variant lg:col-span-6 ${selected ? 'flex' : 'hidden lg:flex'}`}>
          <div className="border-b border-outline-variant p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button className="lg:hidden rounded-lg p-1 text-on-surface-variant hover:bg-surface-high" onClick={() => setSelected(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <h2 className="font-headline-md text-headline-md font-semibold truncate">{selected.title}</h2>
                  <p className="text-body-sm text-on-surface-variant truncate">{selected.contact} <span className="text-on-surface-variant/50">•</span> {selected.company}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="ghost" className="p-2"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
            {selected.messages.map((m) => (
              <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 sm:p-4 text-body-sm ${
                  m.isMe ? 'rounded-tr-none bg-primary/10 text-on-surface' : 'rounded-tl-none bg-surface-highest text-on-surface'
                }`}>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-2 text-xs ${m.isMe ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {m.isMe ? 'You' : m.sender} • {m.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-outline-variant p-3 sm:p-4 space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <Button size="sm" variant="outline" className="shrink-0 bg-surface-highest text-on-surface">
                <Sparkles className="mr-2 h-3.5 w-3.5" /> Accept meeting & address CRM
              </Button>
              <Button size="sm" variant="outline" className="shrink-0 bg-surface-highest text-on-surface">
                Request call
              </Button>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface p-3">
              <textarea
                className="w-full resize-none border-0 bg-transparent p-0 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-2 text-on-surface-variant">
                  <Bold className="h-4 w-4" />
                  <Link2 className="h-4 w-4" />
                  <Paperclip className="h-4 w-4" />
                  <Smile className="h-4 w-4" />
                </div>
                <Button size="sm" className="bg-primary text-on-primary">
                  Send <Send className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Prospect Intelligence */}
        <div className="col-span-1 overflow-y-auto p-4 lg:col-span-3 hidden lg:block">
          <div className="mb-4 flex items-center gap-2 text-body-sm font-semibold text-on-surface">
            <Sparkles className="h-4 w-4 text-primary" /> Prospect Intelligence
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-surface-highest" />
            <div>
              <p className="font-semibold text-on-surface">{selected.contact}</p>
              <p className="text-body-sm text-on-surface-variant">VP Engineering, {selected.company}</p>
            </div>
          </div>

          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant">Lead Score</span>
                <Badge className="bg-secondary/10 text-secondary">{selected.intent}</Badge>
              </div>
              <div className="flex items-center gap-4">
                <LeadScoreRing score={selected.score} />
                <div className="text-body-sm text-on-surface-variant">
                  <p>Engaged with pricing page 3x this week.</p>
                  <p>Recent expansion funding announced.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 space-y-3">
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">Identified Friction Points</p>
            {selected.friction.map((f) => (
              <div key={f} className="flex items-start gap-2 rounded-lg bg-surface-high/30 p-3">
                <AlertTriangleIcon className="mt-0.5 h-4 w-4 text-tertiary" />
                <p className="text-body-sm text-on-surface">{f}</p>
              </div>
            ))}
          </div>

          <Card className="mt-4 border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">Recommended Pitch Angle</p>
              <p className="text-body-sm text-on-surface italic">&quot;{selected.pitch}&quot;</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Integration Case Study</Button>
                <Button size="sm" variant="outline">API Docs</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AlertTriangleIcon(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
