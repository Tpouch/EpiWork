import { Check } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

function canSubmitAnswer(step, answer) {
  if (step.questionType === 'text') return answer.trim().length > 0;
  if (step.questionType === 'multiple_choice') return !!answer;
  return true;
}

function CheckpointQuestion({ step, answer, onAnswerChange, readOnly }) {
  if (step.questionType === 'multiple_choice') {
    const options = step.questionOptions ? JSON.parse(step.questionOptions) : [];
    return (
      <div>
        <p className="mb-2">{step.questionPrompt}</p>
        <RadioGroup value={answer} onValueChange={onAnswerChange} disabled={readOnly} className="flex flex-col gap-2">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} />
              {opt}
            </label>
          ))}
        </RadioGroup>
      </div>
    );
  }
  if (step.questionType === 'confirm') {
    return <p className="opacity-70">{step.questionPrompt || 'Confirm you completed this step.'}</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor="step-answer">{step.questionPrompt}</Label>
      <Textarea
        id="step-answer"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        rows={4}
        disabled={readOnly}
      />
    </div>
  );
}

function StepAction({ step, status, answer, onAnswerChange, onSubmit, isLastStep, readOnly }) {
  if (status === 'done') {
    return (
      <p className="flex items-center gap-2 font-semibold">
        <Check className="size-4" aria-hidden="true" />
        You completed this step.
      </p>
    );
  }
  if (status === 'pending_review') {
    return (
      <p className="border-2 border-brutal-line bg-brutal-cyan p-3 font-semibold text-brutal-dark">
        Waiting for the admin to review your answer.
      </p>
    );
  }
  if (!step.isCheckpoint) {
    return (
      <Button onClick={onSubmit} disabled={readOnly} className="self-end">
        {isLastStep ? 'Finish workshop' : 'Mark done, next step'}
      </Button>
    );
  }
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Checkpoint</p>
      <CheckpointQuestion step={step} answer={answer} onAnswerChange={onAnswerChange} readOnly={readOnly} />
      <Button onClick={onSubmit} disabled={readOnly || !canSubmitAnswer(step, answer)} className="self-end">
        {isLastStep ? 'Submit and finish' : 'Submit answer'}
      </Button>
    </>
  );
}

export default function StepView({ step, index, total, status, ...actionProps }) {
  return (
    <article className="flex min-h-64 min-w-0 flex-col gap-3 border-2 border-brutal-line bg-brutal-surface p-5 shadow-brutal">
      <p className="text-xs font-semibold uppercase tracking-wider opacity-60">
        Step {index + 1} of {total}
      </p>
      <h3 className="text-2xl font-heading">{step.title}</h3>
      <p className="max-w-prose whitespace-pre-wrap break-words leading-relaxed">{step.content}</p>
      <div className="mt-auto flex flex-col gap-3 border-t-2 border-brutal-line pt-4">
        <StepAction step={step} status={status} {...actionProps} />
      </div>
    </article>
  );
}
