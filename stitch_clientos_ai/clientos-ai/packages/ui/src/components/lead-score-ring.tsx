import * as React from 'react';
import { cn } from '../lib/utils';

interface LeadScoreRingProps {
  score: number;
  size?: number;
  className?: string;
}

export function LeadScoreRing({ score, size = 40, className }: LeadScoreRingProps) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorClass =
    score >= 80
      ? 'stroke-secondary text-secondary'
      : score >= 60
        ? 'stroke-primary text-primary'
        : score >= 40
          ? 'stroke-tertiary text-tertiary'
          : 'stroke-error text-error';

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle
          className="fill-none stroke-outline-variant"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={2.5}
        />
        <circle
          className={cn('fill-none transition-all duration-500', colorClass)}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <span
        className={cn(
          'font-lead-score text-lead-score font-bold',
          colorClass,
        )}
      >
        {score}
      </span>
    </div>
  );
}
