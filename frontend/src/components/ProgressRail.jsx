import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  done: { className: 'bg-brutal-green text-brutal-dark', label: 'done with step' },
  pending_review: { className: 'bg-brutal-cyan text-brutal-dark', label: 'awaiting review' },
  available: { className: 'bg-brutal-ink text-brutal-bg', label: 'in progress' },
  locked: { className: 'bg-neutral-300 text-brutal-ink', label: 'not started' },
};
const HELP_STYLE = { className: 'bg-brutal-orange text-brutal-dark', label: 'needs help' };
const LEGEND = [STATUS_STYLES.available, STATUS_STYLES.pending_review, HELP_STYLE, STATUS_STYLES.done];

function initials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function currentPosition(progress) {
  const index = progress.findIndex((row) => row.status !== 'done');
  const stepIndex = index === -1 ? progress.length - 1 : index;
  return { stepIndex, row: progress[stepIndex] };
}

function styleFor(row) {
  return row.helpRequested ? HELP_STYLE : STATUS_STYLES[row.status] ?? STATUS_STYLES.locked;
}

function StudentDot({ student, stepIndex, row }) {
  const style = styleFor(row);
  const description = `${student.name} — step ${stepIndex + 1}, ${style.label}`;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={description}
            className={cn('size-10 shrink-0 rounded-full border-3 border-brutal-line text-xs font-bold', style.className)}
          >
            {initials(student.name)}
          </button>
        }
      />
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  );
}

export default function ProgressRail({ workshop, studentsProgress }) {
  const columns = workshop.steps.map(() => []);
  for (const { student, progress } of studentsProgress) {
    const { stepIndex, row } = currentPosition(progress);
    if (row) columns[stepIndex]?.push({ student, stepIndex, row });
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3">
        <div className="overflow-x-auto border-3 border-brutal-line bg-brutal-surface">
          <div className="flex min-w-full">
            {workshop.steps.map((step, index) => (
              <div
                key={step.id}
                className="flex min-w-14 flex-1 flex-col border-r-2 border-dashed border-brutal-line/20 last:border-r-0"
              >
                <div className="flex min-h-20 flex-1 flex-wrap content-center items-center justify-center gap-1.5 p-2">
                  {columns[index].map((dot) => (
                    <StudentDot key={dot.student.id} {...dot} />
                  ))}
                </div>
                <span className="border-t-2 border-brutal-line py-1 text-center text-xs opacity-70" title={step.title}>
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
        <ul aria-label="Legend" className="flex flex-wrap gap-4 text-xs">
          {LEGEND.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span className={cn('size-3 rounded-full border-2 border-brutal-line', item.className)} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </TooltipProvider>
  );
}
