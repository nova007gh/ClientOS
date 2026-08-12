'use client';

import { useState } from 'react';
import { Button } from '@clientos/ui';
import { Eye, RefreshCw, TrendingUp, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-16">
          <Link href="/" className="text-xl font-bold text-on-surface">ClientOS</Link>
          <div className="hidden md:flex items-center gap-8 text-body-sm">
            <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors">Features</Link>
            <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors">Solutions</Link>
            <Link href="/pricing" className="text-on-surface-variant hover:text-primary transition-colors">Pricing</Link>
            <Link href="/about" className="text-primary font-bold border-b-2 border-primary pb-1">About</Link>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-body-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Login</Link>
            <Link href="/register">
              <Button className="bg-primary text-on-primary">Join Network</Button>
            </Link>
          </div>
          <button className="md:hidden text-on-surface" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-outline-variant bg-surface px-6 py-4 space-y-3">
            <Link href="/" className="block text-on-surface-variant hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="/" className="block text-on-surface-variant hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Solutions</Link>
            <Link href="/pricing" className="block text-on-surface-variant hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/about" className="block text-primary font-medium" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <div className="pt-2 border-t border-outline-variant flex gap-3">
              <Link href="/login" className="text-body-sm font-medium text-on-surface-variant hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="bg-primary text-on-primary">Join Network</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="pt-24 pb-16">
        <section className="py-16 md:py-24 text-center px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-6">Building the Future of Agency Intelligence</h1>
          <p className="mx-auto mb-12 max-w-2xl text-body-lg text-on-surface-variant">
            Our mission is to empower high-velocity agencies through applied AI. We build tools that process complex lead data with absolute clarity, transforming raw information into actionable intelligence.
          </p>

          <div className="mx-auto max-w-5xl w-full h-64 md:h-96 rounded-xl overflow-hidden border border-outline-variant relative">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjAlKOc37WyRZ1c59gyYoHLMIhcHCAh-o9tBEDvk3TaLKP1tINvHFMUvpD1955OfTeKVpsRf7iOJffKAnaE6sE3nAkpQUUjTi1A2NDsK1tubkaebyhwwttoWojSW6rsjoVp3ZhJRTM0MemNT6_GpRsI2KweVQhMiNWS5oUn9GxJHwSf0Dxst-b1CcwF7fyYaOneOZpro8HdBYxEfwoYEEd8-UOFFRkoS6tcpBkLzWspaCub1_iyz9a"
              alt="Modern server room with blue and cyan lighting"
              className="w-full h-full object-cover absolute inset-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          <div className="mt-16 flex items-center justify-center gap-4">
            <div className="h-px bg-outline-variant flex-grow max-w-24" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Core Values</h2>
            <div className="h-px bg-outline-variant flex-grow max-w-24" />
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="rounded-xl border border-outline-variant bg-surface-container p-6 text-left hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-shadow duration-300 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high border border-outline-variant mb-4 group-hover:border-primary transition-colors duration-300">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-headline-md text-headline-md font-semibold">{v.title}</h2>
                  <p className="mt-2 text-body-sm text-on-surface-variant">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-5xl grid max-w-5xl grid-cols-1 items-stretch gap-0 rounded-xl border border-outline-variant bg-surface-container-high overflow-hidden md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h2 className="font-headline-lg text-headline-lg font-semibold mb-4">The ClientOS Network</h2>
              <p className="text-body-lg text-on-surface-variant mb-6">
                Join a curated ecosystem of top-tier agencies leveraging our intelligence layer. The network provides shared insights, strategic partnerships, and early access to experimental features designed to redefine industry standards.
              </p>
              <Link href="/register">
                <Button className="self-start px-6 py-3 border border-outline hover:border-primary text-on-surface font-medium rounded transition-all duration-200">Apply for Network Access</Button>
              </Link>
            </div>
            <div className="relative min-h-[300px]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7YYhUChOqWTWuaruzxMiRJdppGyKkuYs5hb26XRVo69goHXs6sPLhK3PxS_1FAVCxpPDGGXDhMCHvjR1e7EZeEZijGC438WUm5jA0Vu6pcNs8hMhmlTjvcJZKiRYtBJaUx2u-efu9SRM4d7anAUVdR9WRVsjKXUDTDNgFaJ58xG26VW8I2v_ztbBGuJBhVPGZTiMFuKGt4_brKWBYx_PMlHQoc9mPEbMebnhBQM9ns2-FGoe0Wrfo"
                alt="Fiber optic cables glowing with neon light"
                className="w-full h-full object-cover absolute inset-0"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full mt-auto border-t border-outline-variant bg-surface-container-lowest py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto px-6">
          <div className="col-span-2 md:col-span-1">
            <p className="font-bold text-on-surface mb-4">ClientOS</p>
            <p className="text-body-sm text-on-surface-variant">© 2024 ClientOS AI. All rights reserved.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/" className="text-on-surface-variant hover:text-secondary transition-colors text-body-sm">Resources</Link>
            <Link href="/" className="text-on-surface-variant hover:text-secondary transition-colors text-body-sm">Case Studies</Link>
            <Link href="/" className="text-on-surface-variant hover:text-secondary transition-colors text-body-sm">API Docs</Link>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/" className="text-on-surface-variant hover:text-secondary transition-colors text-body-sm">Privacy Policy</Link>
            <Link href="/" className="text-on-surface-variant hover:text-secondary transition-colors text-body-sm">Terms of Service</Link>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/" className="text-on-surface-variant hover:text-secondary transition-colors text-body-sm">Careers</Link>
            <Link href="/" className="text-on-surface-variant hover:text-secondary transition-colors text-body-sm">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
