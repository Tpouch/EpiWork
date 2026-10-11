import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import StepView from '../../components/StepView';
import StepIndex from '../../components/StepIndex';
import WorkshopHeader from '../../components/WorkshopHeader';
import FinishModal from '../../components/FinishModal';
import WorkshopFinished from '../../components/WorkshopFinished';
import HelpButton from '../../components/HelpButton';
import WorkshopLayout from '../../components/WorkshopLayout';
import DocsPanel, { DocsButton } from '../../components/DocsPanel';
import { positionLabel } from '@/lib/sections';
import { api } from '../../api';

const POLL_MS = 4000;

// Reads the backend statuses: every step done, or only the last checkpoint awaiting review.
function isFinished(rows) {
  const last = rows.at(-1);
  const restDone = rows.slice(0, -1).every((row) => row.status === 'done');
  return restDone && (last.status === 'done' || last.status === 'pending_review');
}

function isActionable(row) {
  return row.status === 'available' || row.status === 'pending_review';
}

function currentRow(rows) {
  return rows.find(isActionable) ?? rows.at(-1);
}

// The admin reviews answers and resolves help from another page, so nothing else tells this one.
function isWaitingOnAdmin(rows) {
  if (!rows?.length || isFinished(rows)) return false;
  const current = currentRow(rows);
  return current.status === 'pending_review' || current.helpRequested;
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
  const [feedback, setFeedback] = useState(null);
  const [docs, setDocs] = useState([]);
  const [docsOpen, setDocsOpen] = useState(false);

  async function load() {
    const [data, nextRating] = await Promise.all([api.myWorkshopProgress(id), api.myFeedback(id)]);
    setRows(data);
    setRating(nextRating);
  }

  useEffect(() => {
    Promise.all([api.myWorkshopRecap(id).then(setWorkshop), api.workshopDocs(id).then(setDocs), load()]).catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const waitingOnAdmin = isWaitingOnAdmin(rows);
  useEffect(() => {
    if (!waitingOnAdmin) return undefined;
    const timer = setInterval(() => load().catch((err) => setError(err.message)), POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, waitingOnAdmin]);

  const errorAlert = error && <p role="alert" className="text-brutal-red">{error}</p>;
  if (!rows || !rating || !workshop) return errorAlert || <p>Loading...</p>;
  if (rows.length === 0) return <p className="opacity-70">This workshop has no steps yet.</p>;

  // Help always targets the step the student is on, even while re-reading a finished one.
  const current = currentRow(rows);
  const viewed = rows.find((row) => row.stepId === viewedStepId) ?? current;
  const viewedIndex = rows.indexOf(viewed);
  const isLastStep = viewed === rows.at(-1);

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const result = await api.submitStep(viewed.stepId, answer);
      if (result.correct === false) {
        setFeedback({ stepId: viewed.stepId, message: result.message });
        return;
      }
      setFeedback(null);
      setAnswer('');
      await load();
      setViewedStepId(null);
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

  const steps = rows.map((row) => row.step);
  const helpButton = <HelpButton requested={current.helpRequested} disabled={submitting} onClick={requestHelp} />;
  const doneCount = rows.filter((row) => row.status === 'done').length;
  return (
    <div className="flex flex-col gap-6">
      <Link to="/my-workshops" className="self-start text-sm underline underline-offset-2">← My workshops</Link>
      <WorkshopHeader
        workshop={workshop}
        meta={`${doneCount} of ${rows.length} steps done`}
        action={
          <div className="flex flex-wrap gap-2">
            {docs.length > 0 && <DocsButton open={docsOpen} onToggle={() => setDocsOpen(!docsOpen)} />}
            {helpButton}
          </div>
        }
      />
      {errorAlert}
      <WorkshopLayout
        sidebar={
          <StepIndex
            steps={steps}
            statuses={rows.map((row) => row.status)}
            current={viewedIndex}
            onSelect={(index) => setViewedStepId(rows[index].stepId)}
          />
        }
        main={
          <StepView
            step={viewed.step}
            label={positionLabel(steps, viewedIndex)}
            lockedAction={viewed === current ? helpButton : null}
            status={viewed.status}
            answer={answer}
            onAnswerChange={setAnswer}
            onSubmit={submit}
            isLastStep={isLastStep}
            readOnly={submitting}
            feedback={feedback?.stepId === viewed.stepId ? feedback.message : null}
          />
        }
        docsOpen={docsOpen}
        onCloseDocs={() => setDocsOpen(false)}
        renderDocs={(inModal) => (
          <DocsPanel
            key={viewed.step.section?.title ?? 'none'}
            pages={docs}
            sectionTitle={viewed.step.section?.title}
            onClose={inModal ? undefined : () => setDocsOpen(false)}
          />
        )}
      />
      {finishModal}
    </div>
  );
}
