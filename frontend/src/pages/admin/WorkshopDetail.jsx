import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Info, Pencil } from 'lucide-react';
import { Button, buttonVariants } from '../../components/ui/button';
import WorkshopBrowser from '../../components/WorkshopBrowser';
import WorkshopInfoModal from '../../components/WorkshopInfoModal';
import { withSections } from '@/lib/sections';
import { api } from '../../api';

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

export default function WorkshopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [error, setError] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);

  const load = useCallback(() => api.getWorkshop(id).then(setWorkshop), [id]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  async function saveInfo(data) {
    await api.updateWorkshop(id, data);
    await load();
    setInfoOpen(false);
  }

  async function deleteWorkshop() {
    await api.deleteWorkshop(id);
    navigate('/workshops');
  }

  if (error) {
    return (
      <p role="alert" className="text-brutal-red">
        {error} <Link to="/workshops" className="underline">Back to workshops</Link>
      </p>
    );
  }
  if (!workshop) return <p>Loading...</p>;

  const { steps } = withSections(workshop);
  const meta = `${plural(workshop.sections.length, 'step')}, ${plural(steps.length, 'sub step')}, ${plural(workshop.docPages.length, 'doc page')}`;
  return (
    <div className="flex flex-col gap-6">
      <Link to="/workshops" className="self-start text-sm underline underline-offset-2">← Workshops</Link>
      <WorkshopBrowser
        workshop={workshop}
        steps={steps}
        docs={workshop.docPages}
        meta={meta}
        actions={
          <>
            <Link to={`/workshops/${id}/review`} className={buttonVariants({ variant: 'neutral' })}>Review answers</Link>
            <Button variant="neutral" onClick={() => setInfoOpen(true)}>
              <Info aria-hidden="true" />
              Info
            </Button>
            <Button onClick={() => navigate(`/workshops/${id}/edit`)}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
          </>
        }
      />
      {infoOpen && (
        <WorkshopInfoModal workshop={workshop} onClose={() => setInfoOpen(false)} onSave={saveInfo} onDelete={deleteWorkshop} />
      )}
    </div>
  );
}
