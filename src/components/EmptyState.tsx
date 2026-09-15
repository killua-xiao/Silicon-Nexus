import type { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[10rem] flex-col items-center justify-center gap-2 px-6 text-center text-foundry-500',
        className
      )}
    >
      <Icon className="h-8 w-8 opacity-40" />
      <p className="text-sm font-medium text-foundry-300">{title}</p>
      {hint ? <p className="max-w-xs text-xs leading-relaxed">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded bg-foundry-700/60', className)}
      aria-hidden
    />
  );
}
