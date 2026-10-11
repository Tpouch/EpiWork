import { useState } from 'react';
import StepIndex from './StepIndex';
import StepReader from './StepReader';
import WorkshopHeader from './WorkshopHeader';
import WorkshopLayout from './WorkshopLayout';
import DocsPanel, { DocsButton } from './DocsPanel';

export default function WorkshopBrowser({ workshop, steps, docs, meta, actions = null }) {
  const [current, setCurrent] = useState(0);
  const [docsOpen, setDocsOpen] = useState(false);
  const sectionTitle = steps[current]?.section?.title;

  return (
    <div className="flex flex-col gap-6">
      <WorkshopHeader
        workshop={workshop}
        meta={meta}
        action={
          <div className="flex flex-wrap gap-2">
            {docs.length > 0 && <DocsButton open={docsOpen} onToggle={() => setDocsOpen(!docsOpen)} />}
            {actions}
          </div>
        }
      />
      {steps.length === 0 ? (
        <p className="opacity-70">This workshop has no steps yet.</p>
      ) : (
        <WorkshopLayout
          sidebar={<StepIndex steps={steps} current={current} onSelect={setCurrent} />}
          main={<StepReader steps={steps} index={current} onPrevious={() => setCurrent(current - 1)} onNext={() => setCurrent(current + 1)} />}
          docsOpen={docsOpen}
          onCloseDocs={() => setDocsOpen(false)}
          renderDocs={(inModal) => (
            <DocsPanel key={sectionTitle ?? 'none'} pages={docs} sectionTitle={sectionTitle} onClose={inModal ? undefined : () => setDocsOpen(false)} />
          )}
        />
      )}
    </div>
  );
}
