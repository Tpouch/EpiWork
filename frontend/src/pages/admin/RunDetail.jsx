import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader';
import RunStudentsTable from '../../components/RunStudentsTable';
import FeedbackList from '../../components/FeedbackList';
import { formatRunWindow } from '@/lib/formatTime';
import { api } from '../../api';

function StatTile({ label, value }) {
  return (
    <div className="border-2 border-brutal-line bg-brutal-surface p-3 shadow-brutal">
      <p className="font-heading text-3xl">{value}</p>
      <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}

export default function RunDetail() {
  const { runId } = useParams();
  const [run, setRun] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getRun(runId).then(setRun).catch((err) => setError(err.message));
  }, [runId]);

  const back = <Link to="/history" className="text-sm font-semibold underline">← History</Link>;
  if (error) {
    return (
      <div className="flex flex-col gap-3">
        {back}
        <p role="alert" className="text-brutal-red">{error}</p>
      </div>
    );
  }
  if (!run) return <p>Loading...</p>;

  return (
    <div className="flex flex-col gap-5">
      {back}
      <div>
        <h2 className="text-3xl font-heading">{run.workshop.icon} {run.workshop.title}</h2>
        <p className="text-sm opacity-70">{formatRunWindow(run)} · {run.stepCount} steps</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Students" value={run.students.length} />
        <StatTile label="Finished" value={run.finishedCount} />
        <StatTile label={`Avg rating · ${run.ratingCount}`} value={run.averageRating ?? 'n/a'} />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[6fr_5fr]">
        <section aria-label="Students" className="flex flex-col gap-3">
          <SectionHeader>Students</SectionHeader>
          <RunStudentsTable students={run.students} />
        </section>
        <section aria-label="Feedback" className="flex flex-col gap-3">
          <SectionHeader>Feedback</SectionHeader>
          <FeedbackList feedback={run.feedback} />
        </section>
      </div>
    </div>
  );
}
