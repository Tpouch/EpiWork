import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import StudentPreview from '../../components/StudentPreview';
import { api } from '../../api';

const QUESTION_LABELS = { text: 'Free text', multiple_choice: 'Multiple choice', confirm: 'Confirmation' };

function stepSummary(step) {
  if (!step.isCheckpoint) return 'Read and mark done';
  const label = QUESTION_LABELS[step.questionType] || 'Confirmation';
  return step.questionPrompt ? `${label} — ${step.questionPrompt}` : label;
}

function StepList({ steps }) {
  if (steps.length === 0) return <p className="opacity-70">No steps yet. Use Edit to add the first one.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step, index) => (
        <li key={step.id} className="flex items-center justify-between gap-3 border-2 border-brutal-line bg-brutal-surface px-3 py-2">
          <div>
            <p className="font-semibold">{index + 1}. {step.title}</p>
            <p className="text-sm opacity-60">{stepSummary(step)}</p>
          </div>
          {step.isCheckpoint && <Badge className="bg-brutal-cyan text-brutal-dark">Checkpoint</Badge>}
        </li>
      ))}
    </ol>
  );
}

export default function WorkshopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(undefined);
  const [error, setError] = useState('');
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    api
      .listWorkshops()
      .then((all) => setWorkshop(all.find((w) => String(w.id) === id) ?? null))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p role="alert" className="text-brutal-red">{error}</p>;
  if (workshop === undefined) return <p>Loading...</p>;
  if (workshop === null) {
    return (
      <p>
        Workshop not found. <Link to="/workshops" className="underline">Back to workshops</Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">{workshop.icon}</span>
          <h2 className="text-3xl font-heading">{workshop.title}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="neutral" onClick={() => setPreviewing(true)} disabled={workshop.steps.length === 0}>
            <Eye aria-hidden="true" />
            Preview
          </Button>
          <Button onClick={() => navigate(`/workshops/${workshop.id}/edit`)}>
            <Pencil aria-hidden="true" />
            Edit
          </Button>
        </div>
      </div>
      {workshop.description && (
        <p className="max-w-prose border-l-4 border-brutal-pink pl-3 opacity-80">{workshop.description}</p>
      )}
      <Link to={`/workshops/${workshop.id}/review`} className="self-start text-sm underline underline-offset-2">
        View student progress
      </Link>
      {previewing ? (
        <StudentPreview steps={workshop.steps} onExit={() => setPreviewing(false)} />
      ) : (
        <StepList steps={workshop.steps} />
      )}
    </div>
  );
}
