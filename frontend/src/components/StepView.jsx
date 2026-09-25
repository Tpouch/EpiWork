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

export default function StepView({
  step,
  status,
  helpRequested,
  answer,
  onAnswerChange,
  onSubmit,
  onRequestHelp,
  readOnly = false,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-7">
        <h3 className="text-xl font-heading">{step.title}</h3>
        <p className="mt-2">{step.content}</p>
      </div>
      <div className="md:col-span-5 flex flex-col gap-4">
        {status === 'pending_review' ? (
          <p className="opacity-70">Waiting for the admin to review your answer.</p>
        ) : step.isCheckpoint ? (
          <>
            <CheckpointQuestion step={step} answer={answer} onAnswerChange={onAnswerChange} readOnly={readOnly} />
            <Button onClick={onSubmit} disabled={readOnly || !canSubmitAnswer(step, answer)}>Submit answer</Button>
          </>
        ) : (
          <Button onClick={onSubmit} disabled={readOnly}>Mark done, next step</Button>
        )}
        <div>
          <Button
            variant="neutral"
            onClick={onRequestHelp}
            disabled={readOnly || helpRequested}
            className="border-brutal-orange text-brutal-ink"
          >
            {helpRequested ? 'Help requested' : 'I need help'}
          </Button>
        </div>
      </div>
    </div>
  );
}
