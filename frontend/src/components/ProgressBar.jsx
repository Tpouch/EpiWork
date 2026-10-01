import { cn } from '@/lib/utils';

// A last checkpoint awaiting review counts as finished but not done, so a finished bar is always full.
function fillPercent(done, total, finished) {
  if (finished) return 100;
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export default function ProgressBar({ done, total, finished }) {
  return (
    <span className="mt-1 flex flex-col gap-1">
      <span
        role="progressbar"
        aria-label="Steps completed"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="block h-3 border-2 border-brutal-line bg-brutal-field"
      >
        <span
          className={cn('block h-full', finished ? 'bg-brutal-green' : 'bg-brutal-cyan')}
          style={{ width: `${fillPercent(done, total, finished)}%` }}
        />
      </span>
      <span className="text-xs font-semibold opacity-80">
        {done} / {total} steps{finished && ' · Finished'}
      </span>
    </span>
  );
}
