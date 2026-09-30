import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StepView from '../../components/StepView';
import FinishModal from '../../components/FinishModal';
import WorkshopFinished from '../../components/WorkshopFinished';
import { api } from '../../api';

// Reads the backend statuses: every step done, or only the last checkpoint awaiting review.
function isFinished(rows) {
  const last = rows.at(-1);
  const restDone = rows.slice(0, -1).every((row) => row.status === 'done');
  return restDone && (last.status === 'done' || last.status === 'pending_review');
}

export default function StepPage() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [activeStepId, setActiveStepId] = useState(null);
  const [answer, setAnswer] = useState('');
  const [rating, setRating] = useState(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const [data, nextRating] = await Promise.all([api.myWorkshopProgress(id), api.myFeedback(id)]);
    setRows(data);
    setRating(nextRating);
    const firstActionable = data.find((r) => r.status === 'available' || r.status === 'pending_review');
    setActiveStepId(firstActionable ? firstActionable.stepId : data[data.length - 1]?.stepId);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const active = rows.find((r) => r.stepId === activeStepId);
  const errorAlert = error && <p role="alert" className="text-brutal-red">{error}</p>;
  if (!active || !rating) return errorAlert || <p>Loading...</p>;
  const isLastStep = active.stepId === rows.at(-1).stepId;

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      await api.submitStep(active.stepId, answer);
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
    await api.requestHelp(active.stepId);
    load();
  }

  async function sendFeedback(data) {
    const saved = await api.sendFeedback(id, data);
    setRating((current) => ({ ...current, feedback: saved, canRate: false }));
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

  return (
    <>
      {errorAlert}
      <StepView
        step={active.step}
        status={active.status}
        helpRequested={active.helpRequested}
        answer={answer}
        onAnswerChange={setAnswer}
        onSubmit={submit}
        onRequestHelp={requestHelp}
        isLastStep={isLastStep}
        readOnly={submitting}
      />
      {finishModal}
    </>
  );
}
