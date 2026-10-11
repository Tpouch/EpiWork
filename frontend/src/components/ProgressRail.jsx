import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import { LockOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupBySection, hasSections } from '@/lib/sections';

const STATUS_STYLES = {
  done: { className: 'bg-brutal-green text-brutal-dark', label: 'done with step' },
  pending_review: { className: 'bg-brutal-cyan text-brutal-dark', label: 'awaiting review' },
  available: { className: 'bg-brutal-ink text-brutal-bg', label: 'in progress' },
  locked: { className: 'bg-neutral-300 text-brutal-ink', label: 'not started' },
};
const HELP_STYLE = { className: 'bg-brutal-orange text-brutal-dark', label: 'needs help' };
const QCM_STYLE = { className: 'bg-brutal-red text-brutal-dark', label: 'failed a QCM twice' };
const LEGEND = [STATUS_STYLES.available, STATUS_STYLES.pending_review, HELP_STYLE, QCM_STYLE, STATUS_STYLES.done];

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
  if (row.failedAttempts >= 2) return QCM_STYLE;
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

const COLUMN_REM = 3.5;

function SectionRow({ steps }) {
  return (
    <div className="flex min-w-full border-b-2 border-brutal-line">
      {groupBySection(steps).map((group) => (
        <div
          key={group.key ?? 'unsorted'}
          title={group.title ?? ''}
          style={{ flexGrow: group.items.length, minWidth: `${group.items.length * COLUMN_REM}rem` }}
          className="truncate border-r-2 border-brutal-line px-2 py-1 font-heading text-xs last:border-r-0"
        >
          {group.title}
        </div>
      ))}
    </div>
  );
}

function StepNumber({ step, number, onUnlockForAll }) {
  const base = 'border-t-2 border-brutal-line py-1 text-center text-xs';
  if (!step.hasSolution || !onUnlockForAll) {
    return <span className={cn(base, 'opacity-70')} title={step.title}>{number}</span>;
  }
  function confirmUnlock() {
    if (globalThis.confirm(`Unlock the solution of "${step.title}" for everyone in this session?`)) onUnlockForAll(step);
  }
  return (
    <button
      type="button"
      onClick={confirmUnlock}
      title={`${step.title}: unlock the solution for everyone`}
      className={cn(base, 'flex items-center justify-center gap-1 cursor-pointer opacity-70 hover:bg-brutal-accent hover:text-brutal-dark hover:opacity-100')}
    >
      <LockOpen className="size-3" aria-hidden="true" />
      {number}
    </button>
  );
}

export default function ProgressRail({ workshop, studentsProgress, onUnlockForAll }) {
  const columns = workshop.steps.map(() => []);
  for (const { student, progress } of studentsProgress) {
    const { stepIndex, row } = currentPosition(progress);
    if (row) columns[stepIndex]?.push({ student, stepIndex, row });
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3">
        <div className="overflow-x-auto border-3 border-brutal-line bg-brutal-surface">
          {hasSections(workshop.steps) && <SectionRow steps={workshop.steps} />}
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
                <StepNumber step={step} number={index + 1} onUnlockForAll={onUnlockForAll} />
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
