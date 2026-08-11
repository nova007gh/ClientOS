'use client';

import { Button } from '@clientos/ui';
import { Eye, RefreshCw, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const values = [
  {
    icon: Eye,
    title: 'Transparency',
    desc: 'Absolute clarity in data processing. We believe in providing complete visibility into how intelligence is gathered and applied, ensuring trust at every layer.',
  },
  {
    icon: RefreshCw,
    title: 'Automation',
    desc: 'Relentless efficiency. We automate the friction out of high-velocity sales, allowing agencies to focus on strategy and relationship building rather than manual tasks.',
  },
  {
    icon: TrendingUp,
    title: 'Growth',
    desc: 'Scalable architecture designed for expansion. Our tools are built to support and accelerate your agency\'s trajectory, adapting to increasing complexity.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <nav className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
        <Link href="/" className="text-xl font-bold text-on-surface">ClientOS</Link>
        <div className="hidden items-center gap-6 text-body-sm sm:flex">
          <Link href="/" className="text-on-surface-variant hover:text-on-surface">Features</Link>
          <Link href="/" className="text-on-surface-variant hover:text-on-surface">Solutions</Link>
          <Link href="/pricing" className="text-on-surface-variant hover:text-on-surface">Pricing</Link>
          <Link href="/about" className="text-on-surface">About</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-body-sm text-on-surface-variant hover:text-on-surface">Login</Link>
          <Button className="bg-primary text-on-primary">Join Network</Button>
        </div>
      </nav>

      <main>
        <section className="px-6 py-16 text-center">
          <h1 className="font-headline-xl text-headline-xl font-semibold">Building the Future of Agency Intelligence</h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-md text-on-surface-variant">
            Our mission is to empower high-velocity agencies through applied AI. We build tools that process complex lead data with absolute clarity, transforming raw information into actionable intelligence.
          </p>

          <div className="mx-auto mt-12 max-w-5xl">
            <div className="relative aspect-[21/9] overflow-hidden rounded-xl bg-surface-highest">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="h-px w-12 bg-outline-variant" /> Core Values <span className="h-px w-12 bg-outline-variant" />
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="rounded-2xl border border-outline-variant/60 bg-surface-high/20 p-6 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-highest text-on-surface-variant">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 font-headline-md text-headline-md font-semibold">{v.title}</h2>
                  <p className="mt-2 text-body-sm text-on-surface-variant">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-t border-outline-variant px-6 py-16">
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 rounded-2xl bg-surface-high/20 p-8 md:grid-cols-2">
            <div>
              <h2 className="font-headline-lg text-headline-lg font-semibold">The ClientOS Network</h2>
              <p className="mt-2 text-body-md text-on-surface-variant">
                Join a curated ecosystem of top-tier agencies leveraging our intelligence layer. The network provides shared insights, strategic partnerships, and early access to experimental features designed to redefine industry standards.
              </p>
              <Button className="mt-6 bg-surface-highest text-on-surface hover:bg-surface-high border border-outline-variant">Apply for Network Access</Button>
            </div>
            <div className="rounded-xl bg-surface-highest p-4">
              <div className="aspect-video rounded-lg bg-surface-highest" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-surface-container-low px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-4">
          <div>
            <p className="font-semibold text-on-surface">ClientOS</p>
            <p className="mt-2 text-body-sm text-on-surface-variant">© 2024 ClientOS AI. All rights reserved.</p>
          </div>
          <div>
            <p className="font-semibold text-on-surface">Resources</p>
            <div className="mt-2 space-y-1 text-body-sm text-on-surface-variant">
              <p>Case Studies</p>
              <p>API Docs</p>
            </div>
          </div>
          <div>
            <p className="font-semibold text-on-surface">Privacy Policy</p>
            <div className="mt-2 space-y-1 text-body-sm text-on-surface-variant">
              <p>Terms of Service</p>
            </div>
          </div>
          <div>
            <p className="font-semibold text-on-surface">Careers</p>
            <div className="mt-2 space-y-1 text-body-sm text-on-surface-variant">
              <p>Contact</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
