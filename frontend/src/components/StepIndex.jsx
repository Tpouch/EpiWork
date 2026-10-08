import { Check, Hourglass, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_ICONS = {
  done: { Icon: Check, label: 'done' },
  pending_review: { Icon: Hourglass, label: 'awaiting review' },
  locked: { Icon: Lock, label: 'locked' },
};

function StatusIcon({ status }) {
  const icon = STATUS_ICONS[status];
  if (!icon) return null;
  return (
    <span className="ml-auto shrink-0">
      <icon.Icon className="size-4" aria-hidden="true" />
      <span className="sr-only">({icon.label})</span>
    </span>
  );
}

// `statuses` is optional: the recap has none, the live page passes one per step.
export default function StepIndex({ steps, statuses, current, onSelect }) {
  return (
    <ol aria-label="Steps" className="flex flex-col gap-1.5">
      {steps.map((step, index) => (
        <li key={step.id}>
          <button
            type="button"
            onClick={() => onSelect(index)}
            disabled={statuses?.[index] === 'locked'}
            aria-current={index === current ? 'step' : undefined}
            className={cn(
              'flex w-full items-center gap-2 border-2 px-3 py-2 text-left text-sm font-semibold cursor-pointer',
              'disabled:cursor-not-allowed disabled:opacity-40',
              index === current
                ? 'border-brutal-line bg-brutal-accent text-brutal-dark shadow-brutal-sm'
                : 'border-transparent hover:border-brutal-line disabled:hover:border-transparent',
            )}
          >
            <span className="font-heading">{String(index + 1).padStart(2, '0')}</span>
            {step.title}
            <StatusIcon status={statuses?.[index]} />
          </button>
        </li>
      ))}
    </ol>
  );
}
