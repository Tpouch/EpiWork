import { useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import Markdown from './Markdown';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';

export function DocsButton({ open, onToggle }) {
  return (
    <Button variant="neutral" onClick={onToggle} aria-pressed={open} className={cn(open && 'bg-brutal-ink text-brutal-bg')}>
      <BookOpen aria-hidden="true" />
      Docs
    </Button>
  );
}

// Opens on the page named like the current section; parents key it by section title to re-pick on change.
export default function DocsPanel({ pages, sectionTitle, onClose }) {
  const [pageId, setPageId] = useState(() => String((pages.find((p) => p.title === sectionTitle) ?? pages[0]).id));
  const page = pages.find((p) => String(p.id) === pageId) ?? pages[0];
  const items = Object.fromEntries(pages.map((p) => [String(p.id), p.title]));

  return (
    <aside aria-label="Docs" className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col border-2 border-brutal-line bg-brutal-surface shadow-brutal">
      <div className="flex items-center gap-2 border-b-2 border-brutal-line bg-brutal-cyan px-3 py-2 text-brutal-dark">
        <Select items={items} value={pageId} onValueChange={setPageId}>
          <SelectTrigger aria-label="Doc page" className="min-w-0 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pages.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close the docs" className="cursor-pointer p-1">
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <h3 className="mb-3 text-xl font-heading">{page.title}</h3>
        <Markdown>{page.content}</Markdown>
      </div>
    </aside>
  );
}
