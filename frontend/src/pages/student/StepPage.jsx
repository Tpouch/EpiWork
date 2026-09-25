import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { api } from '../../api';

export default function StepPage() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [activeStepId, setActiveStepId] = useState(null);
  const [answer, setAnswer] = useState('');

  async function load() {
    const data = await api.myWorkshopProgress(id);
    setRows(data);
    const firstActionable = data.find((r) => r.status === 'available' || r.status === 'pending_review');
    setActiveStepId(firstActionable ? firstActionable.stepId : data[data.length - 1]?.stepId);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const active = rows.find((r) => r.stepId === activeStepId);
  if (!active) return <p>Loading...</p>;

  async function submit() {
    await api.submitStep(active.stepId, answer);
    setAnswer('');
    load();
  }

  async function requestHelp() {
    await api.requestHelp(active.stepId);
    load();
  }

  const options = active.step.questionOptions ? JSON.parse(active.step.questionOptions) : [];
  const canSubmit =
    active.step.questionType === 'text' ? answer.trim().length > 0 :
    active.step.questionType === 'multiple_choice' ? !!answer :
    true;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-7">
        <h3 className="text-xl font-heading">{active.step.title}</h3>
        <p className="mt-2">{active.step.content}</p>
      </div>
      <div className="md:col-span-5 flex flex-col gap-4">
        {active.status === 'pending_review' ? (
          <p className="opacity-70">Waiting for the admin to review your answer.</p>
        ) : active.step.isCheckpoint ? (
          <>
            {active.step.questionType === 'multiple_choice' ? (
              <div>
                <p className="mb-2">{active.step.questionPrompt}</p>
                <RadioGroup value={answer} onValueChange={setAnswer} className="flex flex-col gap-2">
                  {options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} />
                      {opt}
                    </label>
                  ))}
                </RadioGroup>
              </div>
            ) : active.step.questionType === 'confirm' ? (
              <p className="opacity-70">{active.step.questionPrompt || 'Confirm you completed this step.'}</p>
            ) : (
              <div className="flex flex-col gap-1">
                <Label htmlFor="step-answer">{active.step.questionPrompt}</Label>
                <Textarea
                  id="step-answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                />
              </div>
            )}
            <Button onClick={submit} disabled={!canSubmit}>Submit answer</Button>
          </>
        ) : (
          <Button onClick={submit}>Mark done, next step</Button>
        )}
        <div>
          <Button
            variant="neutral"
            onClick={requestHelp}
            disabled={active.helpRequested}
            className="border-brutal-orange text-brutal-ink"
          >
            {active.helpRequested ? 'Help requested' : 'I need help'}
          </Button>
        </div>
      </div>
    </div>
  );
}
