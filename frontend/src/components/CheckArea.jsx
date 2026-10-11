import { Check } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

function choicesOf(step) {
  return step.questionOptions ? JSON.parse(step.questionOptions) : [];
}

function canSubmit(step, answer) {
  if (step.questionType === 'qcm') return Boolean(answer);
  if (step.questionType === 'question') return answer.trim().length > 0;
  if (step.questionType === 'checkpoint' && step.questionPrompt) return answer.trim().length > 0;
  return true;
}

function submitLabel(step, isLastStep) {
  if (step.questionType === 'qcm') return 'Check my answer';
  if (step.questionType === 'checkpoint') return isLastStep ? 'Submit and finish' : 'Submit for review';
  if (isLastStep) return 'Finish workshop';
  return step.questionType === 'question' ? 'Send and continue' : 'Mark done, next step';
}

function Question({ step, answer, onAnswerChange, readOnly }) {
  if (step.questionType === 'qcm') {
    return (
      <fieldset>
        <legend className="mb-2 font-semibold">{step.questionPrompt}</legend>
        <RadioGroup value={answer} onValueChange={onAnswerChange} disabled={readOnly} className="flex flex-col gap-2">
          {choicesOf(step).map((choice) => (
            <label key={choice} className="flex items-center gap-2 border-2 border-brutal-line bg-brutal-surface px-3 py-2 font-semibold cursor-pointer">
              <RadioGroupItem value={choice} className="rounded-none" />
              {choice}
            </label>
          ))}
        </RadioGroup>
      </fieldset>
    );
  }
  if (!step.questionPrompt) return null;
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor="step-answer">{step.questionPrompt}</Label>
      <Textarea id="step-answer" value={answer} onChange={(e) => onAnswerChange(e.target.value)} rows={4} disabled={readOnly} />
    </div>
  );
}

export default function CheckArea({ step, status, answer, onAnswerChange, onSubmit, isLastStep, readOnly, feedback }) {
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
        Waiting for the host to review your answer.
      </p>
    );
  }
  return (
    <>
      <Question step={step} answer={answer} onAnswerChange={onAnswerChange} readOnly={readOnly} />
      {feedback && (
        <p role="alert" className="border-2 border-brutal-line bg-brutal-orange p-3 font-semibold text-brutal-dark">
          {feedback} Try again.
        </p>
      )}
      <Button onClick={onSubmit} disabled={readOnly || !canSubmit(step, answer)} className="self-end">
        {submitLabel(step, isLastStep)}
      </Button>
    </>
  );
}
