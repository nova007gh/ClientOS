'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@clientos/ui';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { ArrowRight, Plus, Trash2, Sparkles, User, Building2, Briefcase } from 'lucide-react';

interface ServiceEntry {
  name: string;
  description: string;
  startingPrice: string;
  currency: string;
  deliveryDays: string;
  idealCustomer: string;
  keywords: string;
}

const emptyService: ServiceEntry = {
  name: '',
  description: '',
  startingPrice: '',
  currency: 'USD',
  deliveryDays: '',
  idealCustomer: '',
  keywords: '',
};

const steps = [
  { id: 1, label: 'Profile', icon: User },
  { id: 2, label: 'Organization', icon: Building2 },
  { id: 3, label: 'Services', icon: Briefcase },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    country: '',
    timezone: '',
  });

  const [organization, setOrganization] = useState({
    companyName: '',
    slug: '',
    website: '',
    teamSize: '',
  });

  const [services, setServices] = useState<ServiceEntry[]>([{ ...emptyService }]);

  function addService() {
    setServices([...services, { ...emptyService }]);
  }

  function removeService(idx: number) {
    setServices(services.filter((_, i) => i !== idx));
  }

  function updateService(idx: number, field: keyof ServiceEntry, value: string) {
    setServices(services.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      await api.post('/onboarding', {
        firstName: profile.firstName,
        lastName: profile.lastName,
        companyName: organization.companyName,
        country: profile.country,
        currency: 'USD',
        timezone: profile.timezone,
        services: services
          .filter((s) => s.name.trim())
          .map((s) => ({
            name: s.name,
            description: s.description,
            startingPrice: parseInt(s.startingPrice) || 0,
            currency: s.currency,
            deliveryDays: parseInt(s.deliveryDays) || 30,
            idealCustomer: s.idealCustomer,
            keywords: s.keywords.split(',').map((k) => k.trim()).filter(Boolean),
          })),
      }, accessToken);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  const canContinue =
    step === 1 ? profile.firstName && profile.lastName && profile.country && profile.timezone :
    step === 2 ? organization.companyName && organization.slug :
    services.some((s) => s.name.trim());

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary font-bold">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="font-headline-lg text-headline-lg font-semibold">ClientOS AI</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">Set up your workspace for high-velocity intelligence.</p>
        </div>

        <div className="mb-8">
          <div className="relative flex items-center justify-between">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              const completed = step > s.id;
              return (
                <div key={s.id} className="flex flex-1 flex-col items-center">
                  <div className={`
                    flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold
                    ${active ? 'bg-primary text-on-primary' : completed ? 'bg-secondary/10 text-secondary' : 'bg-surface-highest text-on-surface-variant'}
                  `}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={`mt-2 text-xs font-semibold uppercase tracking-wider ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    {s.label}
                  </p>
                </div>
              );
            })}
            <div className="absolute left-[16%] top-5 -z-10 h-0.5 w-[34%] bg-outline-variant" />
            <div className="absolute right-[16%] top-5 -z-10 h-0.5 w-[34%] bg-outline-variant" />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-outline-variant/60 bg-surface-high/20 p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-headline-md text-headline-md font-semibold">Personal Details</h2>
                <p className="text-body-sm text-on-surface-variant">Tell us a bit about yourself to personalize your experience.</p>
              </div>
              <div>
                <Label className="text-label-caps text-on-surface-variant">Full Name</Label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-outline bg-surface px-3 py-2">
                  <User className="h-4 w-4 text-on-surface-variant" />
                  <input
                    value={`${profile.firstName} ${profile.lastName}`.trim()}
                    onChange={(e) => {
                      const parts = e.target.value.split(' ');
                      setProfile({ ...profile, firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') });
                    }}
                    placeholder="Jane Doe"
                    className="flex-1 border-0 bg-transparent text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-label-caps text-on-surface-variant">Country</Label>
                  <select
                    value={profile.country}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-outline bg-surface px-3 py-2 text-body-sm text-on-surface"
                  >
                    <option value="">Select Country</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Ghana">Ghana</option>
                  </select>
                </div>
                <div>
                  <Label className="text-label-caps text-on-surface-variant">Timezone</Label>
                  <select
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-outline bg-surface px-3 py-2 text-body-sm text-on-surface"
                  >
                    <option value="">Select Timezone</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Africa/Accra">Africa/Accra</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-headline-md text-headline-md font-semibold">Organization</h2>
                <p className="text-body-sm text-on-surface-variant">Tell us about your agency or company.</p>
              </div>
              <div>
                <Label className="text-label-caps text-on-surface-variant">Organization Name</Label>
                <Input
                  value={organization.companyName}
                  onChange={(e) => setOrganization({ ...organization, companyName: e.target.value })}
                  placeholder="Acme Growth Agency"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-label-caps text-on-surface-variant">Workspace Slug</Label>
                <Input
                  value={organization.slug}
                  onChange={(e) => setOrganization({ ...organization, slug: e.target.value })}
                  placeholder="acme-growth"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-label-caps text-on-surface-variant">Website (optional)</Label>
                <Input
                  value={organization.website}
                  onChange={(e) => setOrganization({ ...organization, website: e.target.value })}
                  placeholder="https://acme.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-label-caps text-on-surface-variant">Team Size</Label>
                <select
                  value={organization.teamSize}
                  onChange={(e) => setOrganization({ ...organization, teamSize: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-outline bg-surface px-3 py-2 text-body-sm text-on-surface"
                >
                  <option value="">Select team size</option>
                  <option value="1-5">1-5</option>
                  <option value="6-20">6-20</option>
                  <option value="21-50">21-50</option>
                  <option value="50+">50+</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-headline-md text-headline-md font-semibold">Services You Offer</h2>
                <p className="text-body-sm text-on-surface-variant">What services do you offer to clients?</p>
              </div>
              {services.map((service, idx) => (
                <div key={idx} className="space-y-3 rounded-lg border border-outline-variant/60 bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant">Service {idx + 1}</span>
                    {services.length > 1 && (
                      <button onClick={() => removeService(idx)} className="text-on-surface-variant hover:text-error">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Input placeholder="Website Development" value={service.name} onChange={(e) => updateService(idx, 'name', e.target.value)} />
                  <Input placeholder="Custom responsive websites" value={service.description} onChange={(e) => updateService(idx, 'description', e.target.value)} />
                  <div className="grid grid-cols-3 gap-3">
                    <Input type="number" placeholder="Starting price" value={service.startingPrice} onChange={(e) => updateService(idx, 'startingPrice', e.target.value)} />
                    <Input value={service.currency} onChange={(e) => updateService(idx, 'currency', e.target.value)} />
                    <Input type="number" placeholder="Days" value={service.deliveryDays} onChange={(e) => updateService(idx, 'deliveryDays', e.target.value)} />
                  </div>
                  <Input placeholder="Ideal customer" value={service.idealCustomer} onChange={(e) => updateService(idx, 'idealCustomer', e.target.value)} />
                  <Input placeholder="Keywords, comma-separated" value={service.keywords} onChange={(e) => updateService(idx, 'keywords', e.target.value)} />
                </div>
              ))}
              <Button variant="outline" onClick={addService}>
                <Plus className="h-4 w-4" /> Add another service
              </Button>
            </div>
          )}

          <div className="mt-8 flex items-center justify-end gap-2 border-t border-outline-variant pt-4">
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canContinue}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || !canContinue}>
                {loading ? 'Setting up...' : 'Continue'} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
