import { useState } from 'react';
import { CircleDot, ListChecks, MessageSquare, Plus, X } from 'lucide-react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { cn } from '@/lib/utils';

const TYPES = [
  { id: 'checkpoint', label: 'Checkpoint', Icon: ListChecks, help: 'You approve before they move on.' },
  { id: 'question', label: 'Question', Icon: MessageSquare, help: 'Free answer, they move on.' },
  { id: 'qcm', label: 'QCM', Icon: CircleDot, help: 'Graded automatically.' },
];

// Stable keys so React keeps each choice's input (focus, cursor) when another one is removed.
let lastChoiceKey = 0;
function newChoice(text = '') {
  lastChoiceKey += 1;
  return { key: lastChoiceKey, text };
}

function savedChoices(step) {
  const saved = step.questionType === 'qcm' && step.questionOptions ? JSON.parse(step.questionOptions) : [];
  return (saved.length >= 2 ? saved : ['', '']).map(newChoice);
}

function payloadFor(type, { prompt, choices, rightIndex, feedback }) {
  const cleared = { questionOptions: null, questionAnswer: null, questionFeedback: null };
  if (type === 'checkpoint') return { questionType: type, questionPrompt: prompt.trim() || null, ...cleared };
  if (type === 'question') return { questionType: type, questionPrompt: prompt.trim(), ...cleared };
  return {
    questionType: type,
    questionPrompt: prompt.trim(),
    questionOptions: choices.map((choice) => choice.text.trim()).filter(Boolean),
    questionAnswer: choices[rightIndex]?.text.trim() || null,
    questionFeedback: feedback.trim() || null,
  };
}

export default function CheckpointModal({ step, onClose, onSave }) {
  const [type, setType] = useState(step.questionType ?? 'checkpoint');
  const [prompt, setPrompt] = useState(step.questionPrompt ?? '');
  const [choices, setChoices] = useState(() => savedChoices(step));
  const [rightIndex, setRightIndex] = useState(() => savedChoices(step).findIndex((choice) => choice.text === step.questionAnswer));
  const [feedback, setFeedback] = useState(step.questionFeedback ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setChoice(index, value) {
    setChoices(choices.map((choice, i) => (i === index ? { ...choice, text: value } : choice)));
  }

  function removeChoice(index) {
    setChoices(choices.filter((_, i) => i !== index));
    if (rightIndex === index) setRightIndex(-1);
    else if (rightIndex > index) setRightIndex(rightIndex - 1);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(payloadFor(type, { prompt, choices, rightIndex, feedback }));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={step.questionType ? 'Edit the checkpoint' : 'Add a checkpoint'} size="wide">
      <form onSubmit={save} className="flex flex-col gap-4">
        <div role="radiogroup" aria-label="Check type" className="grid gap-2 sm:grid-cols-3">
          {TYPES.map(({ id, label, Icon, help }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={type === id}
              onClick={() => setType(id)}
              className={cn(
                'flex flex-col items-start gap-1 border-2 border-brutal-line p-3 text-left cursor-pointer',
                type === id ? 'translate-x-0.5 translate-y-0.5 bg-brutal-accent text-brutal-dark' : 'bg-brutal-surface shadow-brutal-sm',
              )}
            >
              <span className="flex items-center gap-1.5 font-heading">
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </span>
              <span className="text-xs">{help}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="check-prompt">
            {type === 'checkpoint' ? 'What should the participant send you? (optional)' : 'Question'}
          </Label>
          <Input id="check-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          {type === 'checkpoint' && <p className="text-xs opacity-70">Leave it empty for a simple "I'm done" button.</p>}
        </div>
        {type === 'qcm' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">Choices (select the right answer)</legend>
            <RadioGroup value={String(rightIndex)} onValueChange={(value) => setRightIndex(Number(value))} className="flex flex-col gap-2">
              {choices.map((choice, index) => (
                <div key={choice.key} className="flex items-center gap-2">
                  <RadioGroupItem value={String(index)} aria-label={`Choice ${index + 1} is the right answer`} className="rounded-none" />
                  <Input
                    aria-label={`Choice ${index + 1}`}
                    value={choice.text}
                    onChange={(e) => setChoice(index, e.target.value)}
                    className={cn(rightIndex === index && 'bg-brutal-green text-brutal-dark')}
                  />
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="neutral"
                    aria-label={`Remove choice ${index + 1}`}
                    disabled={choices.length <= 2}
                    onClick={() => removeChoice(index)}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </RadioGroup>
            <Button type="button" size="xs" variant="neutral" className="self-start" onClick={() => setChoices([...choices, newChoice()])}>
              <Plus aria-hidden="true" />
              Add a choice
            </Button>
            <Label htmlFor="check-feedback" className="mt-2">Message after a wrong answer (optional)</Label>
            <Input id="check-feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </fieldset>
        )}
        {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
        <div className="flex justify-end gap-2 border-t-2 border-brutal-line pt-3">
          <Button type="button" variant="neutral" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save checkpoint'}</Button>
        </div>
      </form>
    </Modal>
  );
}
