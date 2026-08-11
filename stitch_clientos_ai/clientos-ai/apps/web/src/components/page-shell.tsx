'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@clientos/ui';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-headline-lg text-headline-lg font-semibold">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-body-sm text-on-surface-variant">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">
      {message}
    </div>
  );
}

export function StateCard({
  title,
  loading,
  isEmpty,
  emptyMessage,
  skeletonRows = 5,
  children,
}: {
  title: string;
  loading: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  skeletonRows?: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(skeletonRows)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-surface-highest" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="py-12 text-center text-on-surface-variant">{emptyMessage}</div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`pb-3 font-label-caps text-label-caps text-on-surface-variant ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      className={`border-b border-outline-variant last:border-0 hover:bg-surface-high ${className ?? ''}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function formatCurrency(value: number | null, currency = 'USD') {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
