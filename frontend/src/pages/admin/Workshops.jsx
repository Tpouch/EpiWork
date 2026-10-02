import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import WorkshopCard from '../../components/WorkshopCard';
import { stepsSummary } from '../../lib/workshopMeta';
import { api } from '../../api';

export default function Workshops() {
  const [workshops, setWorkshops] = useState(null);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.listWorkshops().then(setWorkshops).catch((err) => setError(err.message));
  }, []);

  async function createWorkshop(event) {
    event.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const workshop = await api.createWorkshop({ title: newTitle.trim(), description: '' });
      navigate(`/workshops/${workshop.id}/edit`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-heading">Workshops</h2>
        <form onSubmit={createWorkshop} className="flex items-center gap-2">
          <Input
            aria-label="New workshop title"
            placeholder="New workshop title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Button type="submit" disabled={creating || !newTitle.trim()}>
            <Plus aria-hidden="true" />
            New workshop
          </Button>
        </form>
      </div>
      {error && <p role="alert" className="text-brutal-red">{error}</p>}
      {!workshops && !error && <p>Loading...</p>}
      {workshops?.length === 0 && <p className="opacity-70">No workshops yet. Create your first one above.</p>}
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
    </div>
  );
}
