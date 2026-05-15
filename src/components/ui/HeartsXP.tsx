import { Heart } from 'lucide-react';

export function HeartsDisplay({ hearts, max = 5 }: { hearts: number; max?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${hearts} of ${max} hearts`}>
      {Array.from({ length: max }).map((_, i) => (
        <Heart
          key={i}
          size={16}
          fill={i < hearts ? 'currentColor' : 'none'}
          className={i < hearts ? 'text-danger' : 'text-border'}
          strokeWidth={2}
        />
      ))}
    </div>
  );
}
