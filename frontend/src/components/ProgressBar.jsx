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
      <progress
        aria-label="Steps completed"
        max={100}
        value={fillPercent(done, total, finished)}
        className={cn(
          'block h-3 w-full appearance-none border-2 border-brutal-line bg-brutal-field [&::-webkit-progress-bar]:bg-brutal-field',
          finished
            ? '[&::-moz-progress-bar]:bg-brutal-green [&::-webkit-progress-value]:bg-brutal-green'
            : '[&::-moz-progress-bar]:bg-brutal-cyan [&::-webkit-progress-value]:bg-brutal-cyan',
        )}
      />
      <span className="text-xs font-semibold opacity-80">
        {done} / {total} steps{finished && ' · Finished'}
      </span>
    </span>
  );
}
