import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import Markdown from '../Markdown';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import { api } from '../../api';

const MODES = [
  { id: 'write', label: 'Write' },
  { id: 'preview', label: 'Preview' },
];

export default function MarkdownField({ id, label, value, onChange, placeholder }) {
  const [mode, setMode] = useState('write');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const textarea = useRef(null);
  const fileInput = useRef(null);

  async function addImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await api.uploadImage(file);
      const start = textarea.current?.selectionStart ?? value.length;
      const end = textarea.current?.selectionEnd ?? value.length;
      const alt = file.name.replace(/\.[^.]+$/, '');
      onChange(`${value.slice(0, start)}![${alt}](${url})${value.slice(end)}`);
      setMode('write');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex flex-wrap items-center gap-2">
          <fieldset aria-label={`${label} view`} className="flex">
            {MODES.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={mode === option.id}
                onClick={() => setMode(option.id)}
                className={cn(
                  '-mr-0.5 border-2 border-brutal-line px-2.5 py-0.5 text-xs font-bold cursor-pointer',
                  mode === option.id ? 'bg-brutal-ink text-brutal-bg' : 'bg-brutal-surface',
                )}
              >
                {option.label}
              </button>
            ))}
          </fieldset>
          <Button type="button" size="xs" variant="neutral" disabled={uploading} onClick={() => fileInput.current?.click()}>
            <ImagePlus aria-hidden="true" />
            {uploading ? 'Uploading…' : 'Add an image'}
          </Button>
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={addImage} />
        </div>
      </div>
      {mode === 'write' ? (
        <Textarea
          id={id}
          ref={textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={12}
          className="font-mono text-[13px]"
        />
      ) : (
        <div className="min-h-40 border-2 border-brutal-line bg-brutal-surface p-3">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="opacity-60">Nothing to preview yet.</p>}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
      <p className="text-xs opacity-70">Markdown: **bold**, `code`, ``` code blocks ```, lists, tables, images.</p>
    </div>
  );
}
