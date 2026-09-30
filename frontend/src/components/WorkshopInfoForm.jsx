import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';

const WORKSHOP_ICONS = ['📘', '🐙', '🎨', '🧱', '🌐', '🐧', '🔐', '🐍', '⚙️', '🧪', '🚀', '🧠'];

export default function WorkshopInfoForm({ workshop, onSave }) {
  const [icon, setIcon] = useState(workshop.icon);
  const [title, setTitle] = useState(workshop.title);
  const [description, setDescription] = useState(workshop.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dirty = icon !== workshop.icon || title !== workshop.title || description !== workshop.description;

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ icon, title: title.trim(), description: description.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 border-2 border-brutal-ink bg-white p-4 shadow-brutal">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Icon</legend>
        <div className="flex flex-wrap gap-2">
          {WORKSHOP_ICONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setIcon(option)}
              aria-label={`Use ${option} as icon`}
              aria-pressed={icon === option}
              className={cn(
                'size-11 border-2 text-2xl cursor-pointer',
                icon === option ? 'border-brutal-ink bg-brutal-accent shadow-brutal-sm' : 'border-transparent hover:border-brutal-ink',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1">
        <Label htmlFor="workshop-title">Title</Label>
        <Input id="workshop-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="workshop-description">Description (shown on the workshop card)</Label>
        <Textarea id="workshop-description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!dirty || !title.trim() || saving}>
          {saving ? 'Saving...' : 'Save details'}
        </Button>
        {!dirty && <span className="text-sm opacity-60">All changes saved</span>}
      </div>
    </form>
  );
}
