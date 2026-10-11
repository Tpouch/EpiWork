import { useState } from 'react';
import Modal from './Modal';
import HoldToDeleteButton from './HoldToDeleteButton';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';

const WORKSHOP_ICONS = ['🌿', '📘', '🐙', '🎨', '🧱', '🌐', '🐧', '🔐', '🐍', '⚙️', '🧪', '🚀', '🧠', '🐳'];

// `workshop` null means "create". The parent mounts this only while it is open.
export default function WorkshopInfoModal({ workshop, onClose, onSave, onDelete }) {
  const [icon, setIcon] = useState(workshop?.icon ?? WORKSHOP_ICONS[0]);
  const [title, setTitle] = useState(workshop?.title ?? '');
  const [description, setDescription] = useState(workshop?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ icon: icon.trim(), title: title.trim(), description: description.trim() });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function remove() {
    setError('');
    try {
      await onDelete();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal open onClose={onClose} title={workshop ? 'Workshop info' : 'New workshop'} size="wide">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-[4.5rem_1fr] items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="workshop-icon">Icon</Label>
            <Input id="workshop-icon" value={icon} maxLength={16} onChange={(e) => setIcon(e.target.value)} className="h-16 text-center text-3xl" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="workshop-title">Name</Label>
            <Input id="workshop-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Pick an icon</legend>
          <div className="flex flex-wrap gap-1.5">
            {WORKSHOP_ICONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setIcon(option)}
                aria-label={`Use ${option} as icon`}
                aria-pressed={icon === option}
                className={cn(
                  'size-10 border-2 border-brutal-line text-xl cursor-pointer',
                  icon === option ? 'bg-brutal-accent shadow-brutal-sm' : 'bg-brutal-surface',
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs opacity-70">Or type any emoji in the icon box.</p>
        </fieldset>
        <div className="flex flex-col gap-1">
          <Label htmlFor="workshop-description">Description</Label>
          <Textarea id="workshop-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {workshop && onDelete && (
          <div className="flex flex-col gap-2 border-2 border-dashed border-brutal-red p-3">
            <p className="text-sm">
              <strong>Delete this workshop.</strong> Its steps, docs and the progress of every participant are removed for good.
            </p>
            <HoldToDeleteButton label="Hold for 5 seconds to delete" onConfirm={remove} />
          </div>
        )}
        {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
        <div className="flex justify-end gap-2 border-t-2 border-brutal-line pt-3">
          <Button type="button" variant="neutral" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !title.trim() || !icon.trim()}>
            {workshop ? 'Save' : 'Create and open the editor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
