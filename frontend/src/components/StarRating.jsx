import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const VALUES = [1, 2, 3, 4, 5];

export function StarDisplay({ value }) {
  return (
    <span role="img" aria-label={`${value} out of 5`} className="inline-flex gap-0.5 align-middle">
      {VALUES.map((n) => (
        <Star key={n} aria-hidden="true" className={cn('size-4', n <= value && 'fill-current')} />
      ))}
    </span>
  );
}

// Real radio inputs, so keyboard (Tab, arrows) and screen readers work without extra code.
export default function StarRating({ value, onChange, labelledBy, name = 'rating' }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex gap-1.5">
      {VALUES.map((n) => {
        const lit = n <= (value ?? 0);
        return (
          <label
            key={n}
            className={cn(
              'grid size-11 cursor-pointer place-items-center border-2 border-brutal-line has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brutal-ink has-[:focus-visible]:ring-offset-2',
              lit ? 'bg-brutal-accent text-brutal-dark' : 'bg-brutal-surface text-brutal-ink',
            )}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className="sr-only"
            />
            <Star aria-hidden="true" className={cn('size-6', lit && 'fill-current')} />
          </label>
        );
      })}
    </div>
  );
}
