'use client';

import { useState, useEffect } from 'react';
import { Button } from '@clientos/ui';
import { Play, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

type PlatformStats = {
  totalLeads: number;
  auditsRun: number;
  replyRate: number;
};

export default function HomePage() {
  const [stats, setStats] = useState<PlatformStats>({
    totalLeads: 0,
    auditsRun: 0,
    replyRate: 0,
  });

  useEffect(() => {
    api.get<{ totalLeads: number; auditsRun: number; replyRate: number }>('/dashboard/public-stats')
      .then((data) => {
        setStats({
          totalLeads: data.totalLeads,
          auditsRun: data.auditsRun,
          replyRate: data.replyRate,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <nav className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
        <Link href="/" className="text-xl font-bold text-on-surface">ClientOS</Link>
        <div className="hidden items-center gap-6 text-body-sm sm:flex">
          <Link href="/" className="text-on-surface-variant hover:text-on-surface">Features</Link>
          <Link href="/" className="text-on-surface-variant hover:text-on-surface">Solutions</Link>
          <Link href="/pricing" className="text-on-surface-variant hover:text-on-surface">Pricing</Link>
          <Link href="/about" className="text-on-surface-variant hover:text-on-surface">About</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-body-sm text-on-surface-variant hover:text-on-surface">Login</Link>
          <Link href="/register"><Button className="bg-primary text-on-primary">Join Network</Button></Link>
        </div>
      </nav>

      <main className="px-6 py-16 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-high/20 px-4 py-1.5 text-xs text-on-surface-variant">
          <span className="h-2 w-2 rounded-full bg-secondary" /> ClientOS v2.0 is Live
        </div>

        <h1 className="mx-auto mt-6 max-w-3xl font-headline-xl text-headline-xl font-semibold">
          The Operating System for High-Velocity Agencies
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-body-md text-on-surface-variant">
          Automate your entire sales pipeline. Deploy AI-driven lead audits, orchestrate multi-channel outreach, and close deals with unprecedented speed and intelligence.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register"><Button className="bg-primary text-on-primary">Start Free Trial</Button></Link>
          <Link href="/login"><Button variant="outline"><Play className="mr-2 h-4 w-4" /> Watch Demo</Button></Link>
        </div>

        <div className="mx-auto mt-16 max-w-4xl rounded-xl border border-outline-variant/60 bg-surface-high/20 p-3">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-surface-highest">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-3xl space-y-3 p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
                  <span className="h-2 w-2 rounded-full bg-secondary" /> Live
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-surface p-3 text-left">
                    <p className="text-2xl font-bold text-on-surface">{stats.totalLeads.toLocaleString()}</p>
                    <p className="text-xs text-on-surface-variant">Total Leads</p>
                  </div>
                  <div className="rounded-lg bg-surface p-3 text-left">
                    <p className="text-2xl font-bold text-on-surface">{stats.auditsRun.toLocaleString()}</p>
                    <p className="text-xs text-on-surface-variant">Audits Run</p>
                  </div>
                  <div className="rounded-lg bg-surface p-3 text-left">
                    <p className="text-2xl font-bold text-on-surface">{stats.replyRate}%</p>
                    <p className="text-xs text-on-surface-variant">Reply Rate</p>
                  </div>
                </div>
                <div className="h-32 rounded-lg bg-surface p-3">
                  <div className="flex h-full items-end justify-between gap-1">
                    {[40,55,45,70,60,80,75,65,90,85,70,95].map((h,i) => (
                      <div key={i} className="w-full rounded-t bg-primary/30" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-outline-variant bg-surface-container-low px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-4">
          <div>
            <p className="font-semibold text-on-surface">ClientOS</p>
            <p className="mt-2 text-body-sm text-on-surface-variant">Empowering agencies with AI-driven intelligence and automation.</p>
            <p className="mt-4 text-xs text-on-surface-variant">© 2024 ClientOS AI. All rights reserved.</p>
          </div>
          <div>
            <p className="font-semibold text-on-surface">Product</p>
            <div className="mt-2 space-y-1 text-body-sm text-on-surface-variant">
              <p>Resources</p>
              <p>Case Studies</p>
              <p>API Docs</p>
            </div>
          </div>
          <div>
            <p className="font-semibold text-on-surface">Company</p>
            <div className="mt-2 space-y-1 text-body-sm text-on-surface-variant">
              <Link href="/about" className="text-on-surface-variant hover:text-secondary transition-colors">About Us</Link>
              <p>Careers</p>
              <p>Contact</p>
            </div>
          </div>
          <div>
            <p className="font-semibold text-on-surface">Legal</p>
            <div className="mt-2 space-y-1 text-body-sm text-on-surface-variant">
              <p>Privacy Policy</p>
              <p>Terms of Service</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
