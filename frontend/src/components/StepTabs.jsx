import { useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import Markdown from './Markdown';
import { cn } from '@/lib/utils';

const SELECTED_STYLES = { instructions: 'bg-brutal-accent', hint: 'bg-brutal-cyan', solution: 'bg-brutal-orange' };

function tabsFor(step) {
  const tabs = [{ id: 'instructions', label: 'Instructions' }];
  if (step.hint) tabs.push({ id: 'hint', label: 'Hint' });
  if (step.hasSolution || step.solution) tabs.push({ id: 'solution', label: 'Solution', locked: !step.solution });
  return tabs;
}

function LockedSolution({ action }) {
  return (
    <div className="flex flex-col items-start gap-3 bg-[repeating-linear-gradient(-45deg,var(--color-brutal-surface)_0_10px,var(--color-brutal-bg)_10px_20px)] p-4">
      <p>
        <strong>The solution is locked.</strong> Try the hint first. Still stuck? Ask for help: the host will come and
        see you, and can unlock the solution for you.
      </p>
      {action}
    </div>
  );
}

function TabBody({ step, tab, lockedAction }) {
  if (tab.id === 'hint') return <Markdown>{step.hint}</Markdown>;
  if (tab.id === 'solution') return tab.locked ? <LockedSolution action={lockedAction} /> : <Markdown>{step.solution}</Markdown>;
  return <Markdown>{step.content}</Markdown>;
}

export default function StepTabs({ step, lockedAction }) {
  const tabs = tabsFor(step);
  const [activeId, setActiveId] = useState('instructions');
  const buttons = useRef({});
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  if (tabs.length === 1) return <Markdown>{step.content}</Markdown>;

  function onKeyDown(event) {
    const offset = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!offset) return;
    event.preventDefault();
    const next = tabs[(tabs.indexOf(active) + offset + tabs.length) % tabs.length];
    setActiveId(next.id);
    buttons.current[next.id]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Step content" className="flex flex-wrap">
        {tabs.map((tab) => {
          const selected = tab.id === active.id;
          return (
            <button
              key={tab.id}
              ref={(element) => { buttons.current[tab.id] = element; }}
              type="button"
              role="tab"
              id={`tab-${step.id}-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${step.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={onKeyDown}
              className={cn(
                '-mb-0.5 -mr-0.5 flex items-center gap-1.5 border-2 border-brutal-line px-3 py-1.5 font-heading text-sm cursor-pointer',
                selected ? cn(SELECTED_STYLES[tab.id], 'text-brutal-dark') : 'bg-brutal-surface',
              )}
            >
              {tab.locked && <Lock className="size-3.5" aria-hidden="true" />}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`panel-${step.id}`}
        aria-labelledby={`tab-${step.id}-${active.id}`}
        className="border-2 border-brutal-line bg-brutal-surface p-4"
      >
        <TabBody step={step} tab={active} lockedAction={lockedAction} />
      </div>
    </div>
  );
}
