'use client';

import { Button } from '@clientos/ui';
import { Check } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: 'mo',
    desc: 'Essential tools for individual professionals getting started.',
    features: ['Up to 100 Active Leads', 'Basic AI Insights', '1 Team Member'],
    cta: 'Get Started Free',
    featured: false,
  },
  {
    name: 'Pro Agency',
    price: '$299',
    period: 'mo',
    desc: 'Advanced intelligence for growing teams and agencies.',
    features: ['Unlimited Active Leads', '20,000 AI Credits', 'Up to 5 Team Members', 'Advanced Integrations'],
    cta: 'Start 14-Day Trial',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Tailored solutions for large-scale operations and robust security needs.',
    features: ['Unlimited AI Credits', 'Unlimited Team Members', 'Dedicated Support Agent', 'Custom Integrations'],
    cta: 'Contact Sales',
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <nav className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
        <Link href="/" className="text-xl font-bold text-on-surface">ClientOS</Link>
        <div className="hidden items-center gap-6 text-body-sm sm:flex">
          <Link href="/" className="text-on-surface-variant hover:text-on-surface">Features</Link>
          <Link href="/" className="text-on-surface-variant hover:text-on-surface">Solutions</Link>
          <Link href="/pricing" className="text-on-surface">Pricing</Link>
          <Link href="/about" className="text-on-surface-variant hover:text-on-surface">About</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-body-sm text-on-surface-variant hover:text-on-surface">Login</Link>
          <Button className="bg-primary text-on-primary">Join Network</Button>
        </div>
      </nav>

      <main className="px-6 py-16 text-center">
        <h1 className="font-headline-xl text-headline-xl font-semibold">Scale with Intelligence</h1>
        <p className="mx-auto mt-4 max-w-2xl text-body-md text-on-surface-variant">
          Transparent pricing for high-velocity sales teams. Choose the tier that fits your growth stage.
        </p>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 text-left ${
                plan.featured
                  ? 'border-primary/30 bg-surface-high/30'
                  : 'border-outline-variant/60 bg-surface-high/20'
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  Most Popular
                </span>
              )}
              <h2 className="font-headline-md text-headline-md font-semibold">{plan.name}</h2>
              <p className="mt-1 flex items-baseline">
                <span className="text-5xl font-bold text-on-surface">{plan.price}</span>
                {plan.period && <span className="text-on-surface-variant">/{plan.period}</span>}
              </p>
              <p className="mt-2 text-body-sm text-on-surface-variant">{plan.desc}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-body-sm text-on-surface">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button className={`mt-8 w-full ${plan.featured ? 'bg-primary text-on-primary' : 'bg-surface-highest text-on-surface'}`}>
                {plan.cta}
              </Button>
            </div>
          ))}
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
              <p>About Us</p>
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
