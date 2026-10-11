import { useState } from 'react';
import { Check, Hourglass, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupBySection, hasSections } from '@/lib/sections';

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

function StepButton({ step, number, status, isCurrent, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === 'locked'}
      aria-current={isCurrent ? 'step' : undefined}
      className={cn(
        'flex w-full items-center gap-2 border-2 px-3 py-2 text-left text-sm font-semibold cursor-pointer',
        'disabled:cursor-not-allowed disabled:opacity-40',
        isCurrent
          ? 'border-brutal-line bg-brutal-accent text-brutal-dark shadow-brutal-sm'
          : 'border-transparent hover:border-brutal-line disabled:hover:border-transparent',
      )}
    >
      <span className="font-heading">{String(number).padStart(2, '0')}</span>
      {step.title}
      <StatusIcon status={status} />
    </button>
  );
}

function SectionGroup({ group, statuses, current, open, onToggle, onSelect }) {
  const total = group.items.length;
  const done = statuses ? group.items.filter(({ index }) => statuses[index] === 'done').length : null;
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'mt-1.5 flex w-full items-center justify-between gap-2 border-2 border-brutal-line bg-brutal-surface px-2.5 py-1.5 text-left font-heading text-sm cursor-pointer',
          done === total && 'opacity-60',
        )}
      >
        <span className="min-w-0">{group.title}</span>
        <span className="shrink-0 font-sans text-xs font-semibold">{done === null ? total : `${done}/${total}`}</span>
      </button>
      {open && (
        <ol className="mt-1 flex flex-col gap-1 pl-2">
          {group.items.map(({ step, index }, position) => (
            <li key={step.id}>
              <StepButton
                step={step}
                number={position + 1}
                status={statuses?.[index]}
                isCurrent={index === current}
                onClick={() => onSelect(index)}
              />
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

// `statuses` is optional: the recap and the admin preview have none, the live page passes one per step.
export default function StepIndex({ steps, statuses, current, onSelect }) {
  const [opened, setOpened] = useState(() => new Set());

  if (!hasSections(steps)) {
    return (
      <ol aria-label="Steps" className="flex flex-col gap-1.5">
        {steps.map((step, index) => (
          <li key={step.id}>
            <StepButton step={step} number={index + 1} status={statuses?.[index]} isCurrent={index === current} onClick={() => onSelect(index)} />
          </li>
        ))}
      </ol>
    );
  }

  function toggle(key) {
    const next = new Set(opened);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setOpened(next);
  }

  return (
    <ol aria-label="Steps" className="flex flex-col">
      {groupBySection(steps).map((group) => {
        const holdsCurrent = group.items.some(({ index }) => index === current);
        return (
          <SectionGroup
            key={group.key ?? 'unsorted'}
            group={group}
            statuses={statuses}
            current={current}
            open={holdsCurrent || opened.has(group.key)}
            onToggle={() => toggle(group.key)}
            onSelect={onSelect}
          />
        );
      })}
    </ol>
  );
}
