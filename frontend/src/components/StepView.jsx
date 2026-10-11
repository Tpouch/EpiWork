import StepTabs from './StepTabs';
import CheckArea from './CheckArea';

export default function StepView({ step, label, lockedAction, ...checkProps }) {
  return (
    <article className="flex min-h-64 min-w-0 flex-col gap-3 border-2 border-brutal-line bg-brutal-surface p-5 shadow-brutal">
      <p className="text-xs font-semibold opacity-60">{label}</p>
      <h3 className="text-2xl font-heading">{step.title}</h3>
      <StepTabs key={step.id} step={step} lockedAction={lockedAction} />
      <div className="mt-auto flex flex-col gap-3 border-t-2 border-brutal-line pt-4">
        <CheckArea step={step} {...checkProps} />
      </div>
    </article>
  );
}
