import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import MarkdownField from '../../components/editor/MarkdownField';
import SaveStatus from '../../components/editor/SaveStatus';
import { Button } from '../../components/ui/button';
import { useAutosave } from '@/lib/useAutosave';
import { cn } from '@/lib/utils';
import { api } from '../../api';

function PageEditor({ page, onSaved, onDelete }) {
  const [draft, setDraft] = useState({ title: page.title, content: page.content });
  const autosave = useAutosave(async (patch) => onSaved(await api.updateDocPage(page.id, patch)));

  function edit(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key === 'title' && !value.trim()) return;
    autosave.schedule({ [key]: value });
  }

  return (
    <article className="flex min-w-0 flex-col gap-3 border-2 border-brutal-line bg-brutal-surface p-5 shadow-brutal">
      <label htmlFor="doc-title" className="text-xs font-semibold opacity-60">
        Page title. A page named exactly like a step opens by default next to that step.
      </label>
      <input
        id="doc-title"
        value={draft.title}
        onChange={(e) => edit('title', e.target.value)}
        className="border-2 border-dashed border-brutal-line bg-brutal-field px-2 py-1 font-heading text-2xl"
      />
      <MarkdownField id="doc-content" label="Content" value={draft.content} onChange={(value) => edit('content', value)} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-brutal-line pt-3">
        <Button variant="neutral" size="xs" className="border-brutal-red text-brutal-red" onClick={onDelete}>
          <Trash2 aria-hidden="true" />
          Delete this page
        </Button>
        <SaveStatus status={autosave.status} savedAt={autosave.savedAt} error={autosave.error} onRetry={autosave.flush} />
      </div>
    </article>
  );
}

export default function DocsEditor() {
  const { id } = useParams();
  const [workshop, setWorkshop] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getWorkshop(id), api.workshopDocs(id)])
      .then(([nextWorkshop, docs]) => {
        setWorkshop(nextWorkshop);
        setPages(docs);
        setSelectedId(docs[0]?.id ?? null);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  async function addPage() {
    setError('');
    try {
      const page = await api.createDocPage(id, { title: 'New page', content: '' });
      setPages((current) => [...current, page]);
      setSelectedId(page.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deletePage(page) {
    if (!globalThis.confirm(`Delete the page "${page.title}"?`)) return;
    setError('');
    try {
      await api.deleteDocPage(page.id);
      const docs = await api.workshopDocs(id);
      setPages(docs);
      setSelectedId(docs[0]?.id ?? null);
    } catch (err) {
      setError(err.message);
    }
  }

  function replacePage(updated) {
    setPages((current) => current.map((page) => (page.id === updated.id ? updated : page)));
  }

  if (!workshop) return error ? <p role="alert" className="text-brutal-red">{error}</p> : <p>Loading...</p>;

  const selected = pages.find((page) => page.id === selectedId);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-heading">Docs: {workshop.title}</h2>
        <Link to={`/workshops/${id}/edit`} className="text-sm underline underline-offset-2">← Back to the editor</Link>
      </div>
      {error && <p role="alert" className="text-brutal-red">{error}</p>}
      <div className="grid gap-5 md:grid-cols-[260px_1fr] md:items-start">
        <nav aria-label="Doc pages" className="flex flex-col gap-1">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setSelectedId(page.id)}
              aria-current={page.id === selectedId ? 'page' : undefined}
              className={cn(
                'border-2 px-3 py-1.5 text-left text-sm font-semibold cursor-pointer',
                page.id === selectedId ? 'border-brutal-line bg-brutal-cyan text-brutal-dark shadow-brutal-sm' : 'border-transparent hover:border-brutal-line',
              )}
            >
              {page.title}
            </button>
          ))}
          <button
            type="button"
            onClick={addPage}
            className="mt-2 flex items-center justify-center gap-1.5 border-2 border-dashed border-brutal-line py-1.5 text-sm font-semibold cursor-pointer hover:bg-brutal-accent hover:text-brutal-dark"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add a page
          </button>
        </nav>
        {selected ? (
          <PageEditor key={selected.id} page={selected} onSaved={replacePage} onDelete={() => deletePage(selected)} />
        ) : (
          <p className="border-2 border-dashed border-brutal-line p-6 opacity-70">No doc pages yet. Use "Add a page" to write the first one.</p>
        )}
      </div>
    </div>
  );
}
