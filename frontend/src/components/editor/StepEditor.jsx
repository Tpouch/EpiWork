import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import MarkdownField from './MarkdownField';
import CheckpointSummary from './CheckpointSummary';
import SaveStatus from './SaveStatus';
import { Button } from '../ui/button';
import { useAutosave } from '@/lib/useAutosave';
import { cn } from '@/lib/utils';
import { api } from '../../api';

const FIELDS = [
  { id: 'content', label: 'Instructions', placeholder: 'What the participant does in this sub step.' },
  { id: 'hint', label: 'Hint', placeholder: 'Optional. Always visible to participants.' },
  { id: 'solution', label: 'Solution', placeholder: 'Optional. Locked until you unlock it during the session.' },
];

// Keyed by step id in the parent: a new sub step gets a fresh draft and flushes the previous one.
export default function StepEditor({ step, label, onSaved, onDelete }) {
  const [draft, setDraft] = useState({
    title: step.title,
    content: step.content,
    hint: step.hint ?? '',
    solution: step.solution ?? '',
  });
  const [fieldId, setFieldId] = useState('content');
  const autosave = useAutosave(async (patch) => onSaved(await api.updateStep(step.id, patch)));
  const field = FIELDS.find((f) => f.id === fieldId);

  function edit(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key === 'title' && !value.trim()) return;
    autosave.schedule({ [key]: value });
  }

  async function saveCheck(check) {
    onSaved(await api.updateStep(step.id, check));
  }

  return (
    <article className="flex min-w-0 flex-col gap-3 border-2 border-brutal-line bg-brutal-surface p-5 shadow-brutal">
      <p className="text-xs font-semibold opacity-60">{label}</p>
      <label htmlFor="step-title" className="sr-only">Sub step title</label>
      <input
        id="step-title"
        value={draft.title}
        onChange={(e) => edit('title', e.target.value)}
        className="border-2 border-dashed border-brutal-line bg-brutal-field px-2 py-1 font-heading text-2xl"
      />
      <fieldset aria-label="Sub step content" className="flex flex-wrap">
        {FIELDS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={fieldId === option.id}
            onClick={() => setFieldId(option.id)}
            className={cn(
              '-mb-0.5 -mr-0.5 border-2 border-brutal-line px-3 py-1.5 font-heading text-sm cursor-pointer',
              fieldId === option.id ? 'bg-brutal-accent text-brutal-dark' : 'bg-brutal-surface',
            )}
          >
            {option.label}
            {option.id !== 'content' && draft[option.id].trim() && <span aria-label="(filled)"> •</span>}
          </button>
        ))}
      </fieldset>
      <div className="border-2 border-brutal-line p-3">
        <MarkdownField
          key={field.id}
          id={`step-${field.id}`}
          label={field.label}
          value={draft[field.id]}
          placeholder={field.placeholder}
          onChange={(value) => edit(field.id, value)}
        />
      </div>
      <CheckpointSummary step={step} onSave={saveCheck} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-brutal-line pt-3">
        <Button variant="neutral" size="xs" className="border-brutal-red text-brutal-red" onClick={onDelete}>
          <Trash2 aria-hidden="true" />
          Delete this sub step
        </Button>
        <SaveStatus status={autosave.status} savedAt={autosave.savedAt} error={autosave.error} onRetry={autosave.flush} />
      </div>
    </article>
  );
}
