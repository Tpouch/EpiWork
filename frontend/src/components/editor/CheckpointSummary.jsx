import { useState } from 'react';
import { ListChecks } from 'lucide-react';
import CheckpointModal from './CheckpointModal';
import { Button } from '../ui/button';

const TYPE_LABELS = { checkpoint: 'Checkpoint', question: 'Question', qcm: 'QCM' };

function describe(step) {
  if (step.questionType === 'checkpoint' && !step.questionPrompt) {
    return 'The participant clicks "Submit for review" and waits for your approval.';
  }
  return step.questionPrompt;
}

export default function CheckpointSummary({ step, onSave }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    setError('');
    try {
      await onSave({ questionType: null });
    } catch (err) {
      setError(err.message);
    }
  }

  async function save(check) {
    await onSave(check);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2">
      {step.questionType ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-2 border-l-6 border-brutal-line border-l-brutal-cyan bg-brutal-surface p-3">
          <div className="min-w-0">
            <span className="border-2 border-brutal-line bg-brutal-cyan px-1.5 font-heading text-sm text-brutal-dark">
              {TYPE_LABELS[step.questionType]}
            </span>
            <p className="mt-1 text-sm">{describe(step)}</p>
            {step.questionType === 'qcm' && (
              <p className="text-xs opacity-70">
                {JSON.parse(step.questionOptions).length} choices, right answer: {step.questionAnswer}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="xs" variant="neutral" onClick={() => setOpen(true)}>Edit</Button>
            <Button size="xs" variant="neutral" className="border-brutal-red text-brutal-red" onClick={remove}>Remove</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-brutal-line p-3 font-semibold cursor-pointer hover:bg-brutal-accent hover:text-brutal-dark"
        >
          <ListChecks className="size-4" aria-hidden="true" />
          Add a checkpoint
        </button>
      )}
      {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
      {open && <CheckpointModal step={step} onClose={() => setOpen(false)} onSave={save} />}
    </div>
  );
}
