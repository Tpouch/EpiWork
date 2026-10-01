import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import StepReader from '../../components/StepReader';
import { formatShortDate } from '@/lib/formatTime';
import { cn } from '@/lib/utils';
import { api } from '../../api';

function RecapHeader({ recap }) {
  const count = recap.steps.length;
  return (
    <div className="flex items-center gap-4">
      <span
        aria-hidden="true"
        className="grid size-16 shrink-0 place-items-center border-2 border-brutal-line bg-brutal-accent text-4xl shadow-brutal"
      >
        {recap.icon}
      </span>
      <div>
        <h2 className="text-3xl font-heading">{recap.title}</h2>
        {recap.description && <p className="text-sm opacity-75">{recap.description}</p>}
        <p className="text-xs opacity-60">
          Joined {formatShortDate(recap.joinedAt)} · {count} step{count === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  );
}

function StepIndex({ steps, current, onSelect }) {
  return (
    <ol aria-label="Steps" className="flex flex-col gap-1.5">
      {steps.map((step, index) => (
        <li key={step.id}>
          <button
            type="button"
            onClick={() => onSelect(index)}
            aria-current={index === current ? 'step' : undefined}
            className={cn(
              'flex w-full items-center gap-2 border-2 px-3 py-2 text-left text-sm font-semibold cursor-pointer',
              index === current
                ? 'border-brutal-line bg-brutal-accent text-brutal-dark shadow-brutal-sm'
                : 'border-transparent hover:border-brutal-line',
            )}
          >
            <span className="font-heading">{String(index + 1).padStart(2, '0')}</span>
            {step.title}
          </button>
        </li>
      ))}
    </ol>
  );
}

export default function WorkshopRecap() {
  const { id } = useParams();
  const [recap, setRecap] = useState(null);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    api.myWorkshopRecap(id).then(setRecap).catch((err) => setError(err.message));
  }, [id]);

  const backLink = (
    <Link to="/my-workshops" className="self-start text-sm underline underline-offset-2">← My workshops</Link>
  );
  if (error) {
    return (
      <div className="flex flex-col gap-3">
        {backLink}
        <p role="alert" className="text-brutal-red">{error}</p>
      </div>
    );
  }
  if (!recap) return <p>Loading...</p>;

  const { steps } = recap;
  return (
    <div className="flex flex-col gap-6">
      {backLink}
      <RecapHeader recap={recap} />
      {steps.length === 0 ? (
        <p className="opacity-70">This workshop has no steps yet.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-[240px_1fr] md:items-start">
          <StepIndex steps={steps} current={current} onSelect={setCurrent} />
          <StepReader
            step={steps[current]}
            index={current}
            total={steps.length}
            onPrevious={() => setCurrent(current - 1)}
            onNext={() => setCurrent(current + 1)}
          />
        </div>
      )}
    </div>
  );
}
