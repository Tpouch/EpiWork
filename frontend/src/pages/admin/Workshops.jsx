import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import WorkshopCard from '../../components/WorkshopCard';
import WorkshopInfoModal from '../../components/WorkshopInfoModal';
import { stepsSummary } from '../../lib/workshopMeta';
import { api } from '../../api';

export default function Workshops() {
  const [workshops, setWorkshops] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.listWorkshops().then(setWorkshops).catch((err) => setError(err.message));
  }, []);

  async function createWorkshop(data) {
    const workshop = await api.createWorkshop(data);
    navigate(`/workshops/${workshop.id}/edit`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-heading">Workshops</h2>
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden="true" />
          New workshop
        </Button>
      </div>
      {error && <p role="alert" className="text-brutal-red">{error}</p>}
      {!workshops && !error && <p>Loading...</p>}
      {workshops?.length === 0 && <p className="opacity-70">No workshops yet. Use "New workshop" to create the first one.</p>}
      {workshops?.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((workshop) => (
            <WorkshopCard
              key={workshop.id}
              workshop={workshop}
              meta={stepsSummary(workshop)}
              onOpen={() => navigate(`/workshops/${workshop.id}`)}
            />
          ))}
        </div>
      )}
      {creating && <WorkshopInfoModal workshop={null} onClose={() => setCreating(false)} onSave={createWorkshop} />}
    </div>
  );
}
