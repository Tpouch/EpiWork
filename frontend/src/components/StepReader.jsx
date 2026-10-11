import StepTabs from './StepTabs';
import { Button } from './ui/button';
import { positionLabel } from '@/lib/sections';

export default function StepReader({ steps, index, onPrevious, onNext }) {
  const step = steps[index];
  return (
    <article className="flex min-h-64 min-w-0 flex-col gap-3 border-2 border-brutal-line bg-brutal-surface p-5 shadow-brutal">
      <p className="text-xs font-semibold opacity-60">{positionLabel(steps, index)}</p>
      <h3 className="text-2xl font-heading">{step.title}</h3>
      <StepTabs key={step.id} step={step} />
      <div className="mt-auto flex justify-between gap-3 pt-4">
        <Button variant="neutral" onClick={onPrevious} disabled={index === 0}>← Previous</Button>
        <Button variant="neutral" onClick={onNext} disabled={index === steps.length - 1}>Next →</Button>
      </div>
    </article>
  );
}
