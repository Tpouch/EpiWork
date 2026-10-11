import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Button, buttonVariants } from '../../components/ui/button';
import EditorSidebar from '../../components/editor/EditorSidebar';
import StepEditor from '../../components/editor/StepEditor';
import { positionLabel, withSections } from '@/lib/sections';
import { api } from '../../api';

export default function WorkshopEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const data = await api.getWorkshop(id);
    setWorkshop(data);
    return data;
  }, [id]);

  useEffect(() => {
    load()
      .then((data) => setSelectedStepId(data.steps[0]?.id ?? null))
      .catch((err) => setError(err.message));
  }, [load]);

  // Every structural change reloads the workshop, so order and numbering always come from the server.
  async function change(action, pickStep) {
    setError('');
    try {
      const result = await action();
      const data = await load();
      setSelectedStepId(pickStep(result, data));
    } catch (err) {
      setError(err.message);
    }
  }

  const firstStep = (_, data) => data.steps[0]?.id ?? null;

  function replaceStep(updated) {
    setWorkshop((current) => ({ ...current, steps: current.steps.map((s) => (s.id === updated.id ? updated : s)) }));
  }

  function deleteStep(step) {
    if (!globalThis.confirm(`Delete the sub step "${step.title}"?`)) return;
    change(() => api.deleteStep(step.id), firstStep);
  }

  function deleteSection(section) {
    if (!globalThis.confirm(`Delete the step "${section.title}" and all its sub steps?`)) return;
    change(() => api.deleteSection(section.id), firstStep);
  }

  if (!workshop) return error ? <p role="alert" className="text-brutal-red">{error}</p> : <p>Loading...</p>;

  const { steps } = withSections(workshop);
  const selectedIndex = steps.findIndex((step) => step.id === selectedStepId);
  const selected = steps[selectedIndex];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-14 place-items-center border-2 border-brutal-line bg-brutal-accent text-3xl shadow-brutal">
            {workshop.icon}
          </span>
          <div>
            <h2 className="text-3xl font-heading">
              {workshop.title}{' '}
              <span className="border-2 border-brutal-line bg-brutal-pink px-1.5 align-middle font-sans text-xs font-bold normal-case text-brutal-dark">
                Editing
              </span>
            </h2>
            <p className="text-xs opacity-60">{workshop.sections.length} steps, {workshop.steps.length} sub steps</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/workshops/${id}/docs/edit`} className={buttonVariants({ variant: 'neutral' })}>
            <BookOpen aria-hidden="true" />
            Edit the docs
          </Link>
          <Button onClick={() => navigate(`/workshops/${id}`)}>Done</Button>
        </div>
      </div>
      {error && <p role="alert" className="text-brutal-red">{error}</p>}
      <div className="grid gap-5 md:grid-cols-[260px_1fr] md:items-start">
        <EditorSidebar
          sections={workshop.sections}
          steps={workshop.steps}
          selectedStepId={selectedStepId}
          onSelect={setSelectedStepId}
          onAddSubStep={(sectionId) => change(() => api.createStepInSection(sectionId), (step) => step.id)}
          onAddStep={() => change(() => api.createSection(id, 'New step'), (section) => section.steps[0].id)}
          onRenameSection={(sectionId, title) => change(() => api.updateSection(sectionId, { title }), () => selectedStepId)}
          onDeleteSection={deleteSection}
        />
        {selected ? (
          <StepEditor
            key={selected.id}
            step={selected}
            label={positionLabel(steps, selectedIndex)}
            onSaved={replaceStep}
            onDelete={() => deleteStep(selected)}
          />
        ) : (
          <p className="border-2 border-dashed border-brutal-line p-6 opacity-70">
            No sub steps yet. Use "Add a step" to create the first one.
          </p>
        )}
      </div>
    </div>
  );
}
