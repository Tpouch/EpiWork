import { Button } from './ui/button';

export default function StepReader({ step, index, total, onPrevious, onNext }) {
  return (
    <article className="flex min-h-64 min-w-0 flex-col gap-3 border-2 border-brutal-line bg-brutal-surface p-5 shadow-brutal">
      <p className="text-xs font-semibold uppercase tracking-wider opacity-60">
        Step {index + 1} of {total}
      </p>
      <h3 className="text-2xl font-heading">{step.title}</h3>
      <p className="max-w-prose whitespace-pre-wrap break-words leading-relaxed">{step.content}</p>
      <div className="mt-auto flex justify-between gap-3 pt-4">
        <Button variant="neutral" onClick={onPrevious} disabled={index === 0}>← Previous</Button>
        <Button variant="neutral" onClick={onNext} disabled={index === total - 1}>Next →</Button>
      </div>
    </article>
  );
}
