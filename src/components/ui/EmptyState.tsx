import type { ReactNode } from 'react';

export function EmptyState({
  emoji = '🦊',
  title,
  description,
  action
}: {
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="text-5xl mb-3" aria-hidden="true">
        {emoji}
      </div>
      <h2 className="font-extrabold text-base mb-1">{title}</h2>
      {description && <p className="text-sm text-ink-light mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
