import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-label-caps text-label-caps transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        secondary: 'bg-secondary/10 text-secondary border border-secondary/20',
        error: 'bg-error/10 text-error border border-error/20',
        warning: 'bg-tertiary/10 text-tertiary border border-tertiary/20',
        outline: 'border border-outline-variant text-on-surface-variant',
        neutral: 'bg-surface-bright text-on-surface border border-outline-variant',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
