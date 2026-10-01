import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import StepView from '../../components/StepView';
import StepIndex from '../../components/StepIndex';
import WorkshopHeader from '../../components/WorkshopHeader';
import FinishModal from '../../components/FinishModal';
import WorkshopFinished from '../../components/WorkshopFinished';
import { Button } from '../../components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '../../api';

// Reads the backend statuses: every step done, or only the last checkpoint awaiting review.
function isFinished(rows) {
  const last = rows.at(-1);
  const restDone = rows.slice(0, -1).every((row) => row.status === 'done');
  return restDone && (last.status === 'done' || last.status === 'pending_review');
}

function isActionable(row) {
  return row.status === 'available' || row.status === 'pending_review';
}

function HelpButton({ requested, disabled, onClick }) {
  return (
    <Button
      variant="neutral"
      onClick={onClick}
      disabled={disabled || requested}
      className={cn(
        'border-brutal-orange text-brutal-ink',
        requested && 'border-brutal-line bg-brutal-orange text-brutal-dark disabled:opacity-100 data-disabled:opacity-100',
      )}
    >
      <LifeBuoy aria-hidden="true" />
      {requested ? 'Help requested' : 'I need help'}
    </Button>
  );
}

export default function StepPage() {
  const { id } = useParams();
  const [workshop, setWorkshop] = useState(null);
  const [rows, setRows] = useState(null);
  const [viewedStepId, setViewedStepId] = useState(null);
  const [answer, setAnswer] = useState('');
  const [rating, setRating] = useState(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const [data, nextRating] = await Promise.all([api.myWorkshopProgress(id), api.myFeedback(id)]);
    setRows(data);
    setRating(nextRating);
    setViewedStepId(null);
  }

  useEffect(() => {
    Promise.all([api.myWorkshopRecap(id).then(setWorkshop), load()]).catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const errorAlert = error && <p role="alert" className="text-brutal-red">{error}</p>;
  if (!rows || !rating || !workshop) return errorAlert || <p>Loading...</p>;
  if (rows.length === 0) return <p className="opacity-70">This workshop has no steps yet.</p>;

  // Help always targets the step the student is on, even while re-reading a finished one.
  const current = rows.find(isActionable) ?? rows.at(-1);
  const viewed = rows.find((row) => row.stepId === viewedStepId) ?? current;
  const viewedIndex = rows.indexOf(viewed);
  const isLastStep = viewed === rows.at(-1);

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      await api.submitStep(viewed.stepId, answer);
      setAnswer('');
      await load();
      if (isLastStep) setFinishOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function requestHelp() {
    await api.requestHelp(current.stepId);
    load();
  }

  async function sendFeedback(data) {
    const saved = await api.sendFeedback(id, data);
    setRating((previous) => ({ ...previous, feedback: saved, canRate: false }));
    return saved;
  }

  const finishModal = (
    <FinishModal
      open={finishOpen}
      workshopTitle={rating.workshopTitle}
      awaitingReview={rows.at(-1).status === 'pending_review'}
      canRate={rating.canRate}
      onSend={sendFeedback}
      onClose={() => setFinishOpen(false)}
    />
  );

  if (isFinished(rows)) {
    return (
      <>
        <WorkshopFinished
          workshopTitle={rating.workshopTitle}
          feedback={rating.feedback}
          canRate={rating.canRate}
          onRate={() => setFinishOpen(true)}
        />
        {finishModal}
      </>
    );
  }

  const doneCount = rows.filter((row) => row.status === 'done').length;
  return (
    <div className="flex flex-col gap-6">
      <Link to="/my-workshops" className="self-start text-sm underline underline-offset-2">← My workshops</Link>
      <WorkshopHeader
        workshop={workshop}
        meta={`${doneCount} of ${rows.length} steps done`}
        action={<HelpButton requested={current.helpRequested} disabled={submitting} onClick={requestHelp} />}
      />
      {errorAlert}
      <div className="grid gap-5 md:grid-cols-[240px_1fr] md:items-start">
        <StepIndex
          steps={rows.map((row) => row.step)}
          statuses={rows.map((row) => row.status)}
          current={viewedIndex}
          onSelect={(index) => setViewedStepId(rows[index].stepId)}
        />
        <StepView
          step={viewed.step}
          index={viewedIndex}
          total={rows.length}
          status={viewed.status}
          answer={answer}
          onAnswerChange={setAnswer}
          onSubmit={submit}
          isLastStep={isLastStep}
          readOnly={submitting}
        />
      </div>
      {finishModal}
    </div>
  );
}
