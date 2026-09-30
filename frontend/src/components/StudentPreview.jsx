import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import StepView from './StepView';

function ignore() {
  // The preview is read-only: student actions do nothing.
}

export default function StudentPreview({ steps, onExit }) {
  const [index, setIndex] = useState(0);
  const step = steps[index];

  return (
    <section aria-label="Student preview" className="border-3 border-dashed border-brutal-blue bg-brutal-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-brutal-blue px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
        <span className="flex items-center gap-2">
          <Eye className="size-4" aria-hidden="true" />
          Previewing as student · step {index + 1} of {steps.length}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous step"
            onClick={() => setIndex(index - 1)}
            disabled={index === 0}
            className="cursor-pointer p-1 disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next step"
            onClick={() => setIndex(index + 1)}
            disabled={index === steps.length - 1}
            className="cursor-pointer p-1 disabled:opacity-40"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={onExit} className="flex items-center gap-1 cursor-pointer underline">
            Exit preview
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="p-6">
        <StepView
          step={step}
          status="available"
          helpRequested={false}
          answer=""
          onAnswerChange={ignore}
          onSubmit={ignore}
          onRequestHelp={ignore}
          readOnly
        />
      </div>
    </section>
  );
}
