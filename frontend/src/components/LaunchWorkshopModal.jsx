import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import Modal from './Modal';
import { stepsSummary } from '../lib/workshopMeta';
import { api } from '../api';
import { cn } from '@/lib/utils';

function launchLabel(launching, selected) {
  if (launching) return 'Launching...';
  return selected ? `Launch ${selected.title}` : 'Pick a workshop';
}

function WorkshopPicker({ onLaunched }) {
  const [workshops, setWorkshops] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    api.listWorkshops().then(setWorkshops).catch((err) => setError(err.message));
  }, []);

  const selected = workshops?.find((w) => w.id === selectedId);

  async function launch() {
    setLaunching(true);
    setError('');
    try {
      onLaunched(await api.launchWorkshop(selectedId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {!workshops && !error && <p>Loading...</p>}
      {workshops?.length === 0 && <p className="opacity-70">No workshops yet. Create one in Workshops first.</p>}
      {workshops?.map((workshop) => {
        const empty = workshop.steps.length === 0;
        return (
          <button
            key={workshop.id}
            type="button"
            disabled={empty}
            onClick={() => setSelectedId(workshop.id)}
            aria-pressed={selectedId === workshop.id}
            className={cn(
              'flex items-center gap-3 border-2 border-brutal-line bg-brutal-surface p-3 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
              selectedId === workshop.id && 'outline-3 outline-offset-1 outline-brutal-blue',
            )}
          >
            <span className="text-2xl" aria-hidden="true">{workshop.icon}</span>
            <span>
              <span className="block font-semibold">{workshop.title}</span>
              <span className="block text-xs opacity-60">{empty ? 'No steps yet' : stepsSummary(workshop)}</span>
            </span>
          </button>
        );
      })}
      {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
      <Button onClick={launch} disabled={!selected || launching} className="mt-2 w-full">
        {launchLabel(launching, selected)}
      </Button>
    </div>
  );
}

export default function LaunchWorkshopModal({ open, onClose, onLaunched }) {
  return (
    <Modal open={open} onClose={onClose} title="Launch a workshop">
      {open && <WorkshopPicker onLaunched={onLaunched} />}
    </Modal>
  );
}
