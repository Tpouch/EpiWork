import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import StepReader from '../../components/StepReader';
import StepIndex from '../../components/StepIndex';
import WorkshopHeader from '../../components/WorkshopHeader';
import { formatShortDate } from '@/lib/formatTime';
import { api } from '../../api';

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
      <WorkshopHeader
        workshop={recap}
        meta={`Joined ${formatShortDate(recap.joinedAt)} · ${steps.length} step${steps.length === 1 ? '' : 's'}`}
      />
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
