import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHECK_LABELS = { checkpoint: 'Check', question: 'Question', qcm: 'QCM' };
const ADD_BUTTON = 'flex w-full items-center justify-center gap-1.5 border-2 border-dashed border-brutal-line py-1.5 text-sm font-semibold cursor-pointer hover:bg-brutal-accent hover:text-brutal-dark';

function SectionTitle({ section, onRename, onDelete }) {
  const [title, setTitle] = useState(section.title);

  function commit() {
    const next = title.trim();
    if (!next) setTitle(section.title);
    else if (next !== section.title) onRename(section.id, next);
  }

  return (
    <div className="mt-3 flex items-center gap-1 border-2 border-brutal-line bg-brutal-surface px-2 py-1">
      <label htmlFor={`section-${section.id}`} className="sr-only">Step title</label>
      <input
        id={`section-${section.id}`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commit}
        className="min-w-0 flex-1 bg-transparent font-heading text-sm outline-none focus-visible:outline-2 focus-visible:outline-brutal-cyan"
      />
      <button type="button" aria-label={`Delete the step ${section.title}`} onClick={() => onDelete(section)} className="cursor-pointer p-1 opacity-60 hover:opacity-100">
        <Trash2 className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function SubSteps({ steps, selectedStepId, onSelect }) {
  return (
    <ol className="mt-1 flex flex-col gap-1">
      {steps.map((step, index) => (
        <li key={step.id}>
          <button
            type="button"
            onClick={() => onSelect(step.id)}
            aria-current={step.id === selectedStepId ? 'step' : undefined}
            className={cn(
              'flex w-full items-center gap-2 border-2 px-3 py-1.5 text-left text-sm font-semibold cursor-pointer',
              step.id === selectedStepId
                ? 'border-brutal-line bg-brutal-accent text-brutal-dark shadow-brutal-sm'
                : 'border-transparent hover:border-brutal-line',
            )}
          >
            <span className="font-heading">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate">{step.title}</span>
            {step.questionType && (
              <span className="border-2 border-brutal-line bg-brutal-cyan px-1 text-[10px] font-bold text-brutal-dark">
                {CHECK_LABELS[step.questionType]}
              </span>
            )}
          </button>
        </li>
      ))}
    </ol>
  );
}

export default function EditorSidebar({
  sections,
  steps,
  selectedStepId,
  onSelect,
  onAddSubStep,
  onAddStep,
  onRenameSection,
  onDeleteSection,
}) {
  const unsorted = steps.filter((step) => !step.sectionId);
  return (
    <nav aria-label="Steps" className="flex flex-col">
      {unsorted.length > 0 && <SubSteps steps={unsorted} selectedStepId={selectedStepId} onSelect={onSelect} />}
      {sections.map((section) => (
        <div key={section.id}>
          <SectionTitle section={section} onRename={onRenameSection} onDelete={onDeleteSection} />
          <div className="pl-3">
            <SubSteps steps={steps.filter((step) => step.sectionId === section.id)} selectedStepId={selectedStepId} onSelect={onSelect} />
            <button type="button" onClick={() => onAddSubStep(section.id)} className={cn(ADD_BUTTON, 'mt-1')}>
              <Plus className="size-3.5" aria-hidden="true" />
              Add a sub step
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={onAddStep} className={cn(ADD_BUTTON, 'mt-4')}>
        <Plus className="size-4" aria-hidden="true" />
        Add a step
      </button>
    </nav>
  );
}
