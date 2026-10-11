import { useRef } from 'react';
import Modal from './Modal';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useResizable } from '@/lib/useResizable';

// Sidebar + main, plus the docs: a resizable sticky column on wide screens, a full-screen modal otherwise.
export default function WorkshopLayout({ sidebar, main, docsOpen, onCloseDocs, renderDocs }) {
  const containerRef = useRef(null);
  const wide = useMediaQuery('(min-width: 1024px)');
  const { width, handleProps } = useResizable({ containerRef, storageKey: 'epiwork_docs_width' });

  return (
    <>
      <div ref={containerRef} className="flex flex-col gap-5 md:flex-row md:items-start">
        <div className="md:w-60 md:shrink-0">{sidebar}</div>
        <div className="min-w-0 flex-1">{main}</div>
        {docsOpen && wide && (
          <div className="sticky top-4 flex shrink-0" style={{ width }}>
            <div {...handleProps} className="group mr-1 flex w-4 shrink-0 cursor-col-resize touch-none justify-center outline-none">
              <span className="w-2.5 border-2 border-brutal-line bg-brutal-surface group-hover:bg-brutal-accent group-focus-visible:bg-brutal-accent group-focus-visible:outline-3 group-focus-visible:outline-offset-2 group-focus-visible:outline-brutal-cyan" />
            </div>
            <div className="min-w-0 flex-1">{renderDocs(false)}</div>
          </div>
        )}
      </div>
      <Modal open={docsOpen && !wide} onClose={onCloseDocs} title="Docs" size="full">
        {docsOpen && !wide && renderDocs(true)}
      </Modal>
    </>
  );
}
