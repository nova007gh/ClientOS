'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useSearchStore } from '@/lib/search-store';
import { Avatar, AvatarFallback, Button } from '@clientos/ui';
import {
  Home,
  TrendingUp,
  Mail,
  Users,
  Briefcase,
  Brain,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Plus,
  Search,
  Sparkles,
  Menu,
  X,
  FileText,
  FileSignature,
  LayoutTemplate,
  Globe,
  MapPin,
} from 'lucide-react';

const mobileNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/opportunities', label: 'Sales', icon: TrendingUp },
  { href: '/dashboard/inbox', label: 'Outreach', icon: Mail },
  { href: '/dashboard/prospects', label: 'Clients', icon: Users },
  { href: '/dashboard/lead-map', label: 'Map', icon: MapPin },
  { href: '/dashboard/contracts', label: 'Contracts', icon: FileText },
];

const topNav = [
  { href: '/dashboard', label: 'Home', icon: Home },
];

const mainNav = [
  { href: '/dashboard/opportunities', label: 'Sales', icon: TrendingUp },
  { href: '/dashboard/inbox', label: 'Outreach', icon: Mail },
  { href: '/dashboard/prospects', label: 'Clients', icon: Users },
  { href: '/dashboard/projects', label: 'Work', icon: Briefcase },
  { href: '/dashboard/contracts', label: 'Contracts', icon: FileText },
  { href: '/dashboard/proposals', label: 'Proposals', icon: FileSignature },
  { href: '/dashboard/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/dashboard/portfolio', label: 'Portfolio', icon: Globe },
  { href: '/dashboard/lead-map', label: 'Lead Map', icon: MapPin },
  { href: '/dashboard/audits', label: 'Intelligence', icon: Brain },
];

const bottomNav = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, organization, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!hydrated || !isAuthenticated || !user) {
    return null;
  }

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-outline-variant px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-on-primary font-bold text-sm">
          C
        </div>
        <div>
          <span className="font-headline-md text-headline-md font-bold leading-none">ClientOS AI</span>
          <p className="text-xs text-on-surface-variant">Agency Growth</p>
        </div>
        <button
          className="ml-auto rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-high lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-3">
        <Link
          href="/dashboard/campaigns"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-body-sm font-semibold text-on-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {topNav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <div className="my-2 h-px bg-outline-variant" />
        {mainNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-outline-variant p-3 space-y-1">
        {bottomNav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <Link href="/dashboard" className="sidebar-link">
          <HelpCircle className="h-4 w-4" />
          Support
        </Link>
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="sidebar-link w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-sidebar-width flex-col border-r border-outline-variant bg-surface-container-low transition-transform lg:static lg:translate-x-0 lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b border-outline-variant bg-surface-container-low px-3 lg:hidden">
          <button
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-high"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-on-primary font-bold text-xs">C</div>
            <span className="font-headline-md text-headline-md font-bold leading-none">ClientOS</span>
          </div>
          <button className="relative rounded-full p-2 text-on-surface-variant hover:bg-surface-high">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
          </button>
        </header>

        {/* Desktop Header */}
        <header className="hidden h-16 items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 sm:px-6 lg:flex">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-high lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative flex-1 max-w-md hidden sm:block">
              <SearchContext pathname={pathname} />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              size="sm"
              className="hidden bg-surface-highest text-on-surface hover:bg-surface-high md:flex"
              onClick={() => router.push('/dashboard/copilot')}
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" /> AI Copilot
            </Button>
            <button className="relative rounded-full p-2 text-on-surface-variant hover:bg-surface-high">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
            </button>
            <button className="hidden rounded-full p-2 text-on-surface-variant hover:bg-surface-high sm:block">
              <HelpCircle className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 pl-1 sm:pl-2">
              <Avatar className="h-8 w-8 border border-outline-variant">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-body-sm font-semibold text-on-surface">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-on-surface-variant">{organization?.name}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-container-padding pb-20 lg:pb-container-padding">
          {children}
        </main>
      </div>

      {/* Floating AI Copilot Button — desktop only */}
      <button
        onClick={() => router.push('/dashboard/copilot')}
        className="group fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-110 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 lg:flex"
        aria-label="AI Copilot"
      >
        <Sparkles className="h-6 w-6 transition-transform group-hover:rotate-12" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-secondary" />
        </span>
        <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-surface-high px-3 py-1.5 text-body-sm font-medium text-on-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          Ask AI Copilot
        </span>
      </button>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-outline-variant bg-surface-container-low/95 px-1 py-1.5 backdrop-blur-lg lg:hidden">
        {mobileNavItems.slice(0, 2).map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${
                active ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        {/* Center AI Button */}
        <button
          onClick={() => router.push('/dashboard/copilot')}
          className="relative -mt-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 transition-transform active:scale-95"
          aria-label="AI Copilot"
        >
          <Sparkles className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
          </span>
        </button>
        {mobileNavItems.slice(2).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${
                active ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SearchContext({ pathname }: { pathname: string }) {
  const { query, setQuery } = useSearchStore();
  const placeholder = pathname.includes('/dashboard/campaigns') ? 'Search campaigns...' :
    pathname.includes('/dashboard/prospects') ? 'Search clients...' :
    pathname.includes('/dashboard/projects') ? 'Search tasks...' :
    pathname.includes('/dashboard/proposals') ? 'Search proposals...' :
    pathname.includes('/dashboard/contracts') ? 'Search contracts...' :
    pathname.includes('/dashboard/templates') ? 'Search templates...' :
    pathname.includes('/dashboard/portfolio') ? 'Search portfolio...' :
    pathname.includes('/dashboard/audits') ? 'Search audits...' :
    'Search opportunities...';

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-full border border-outline bg-surface-high py-2 pl-10 pr-4 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
      />
    </div>
  );
}
