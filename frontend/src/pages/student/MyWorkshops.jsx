import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WorkshopCard from '../../components/WorkshopCard';
import ProgressBar from '../../components/ProgressBar';
import { formatShortDate } from '@/lib/formatTime';
import { api } from '../../api';

export default function MyWorkshops() {
  const [workshops, setWorkshops] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.myWorkshops().then(setWorkshops).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-3xl font-heading">My workshops</h2>
        <p className="text-sm opacity-70">Every workshop you joined, newest first.</p>
      </div>
      {error && <p role="alert" className="text-brutal-red">{error}</p>}
      {!workshops && !error && <p>Loading...</p>}
      {workshops?.length === 0 && (
        <p className="opacity-70">
          You haven't joined a workshop yet. <Link to="/" className="underline">Join one with a code</Link>.
        </p>
      )}
      {workshops?.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((workshop) => (
            <WorkshopCard
              key={workshop.id}
              workshop={workshop}
              meta={`Joined ${formatShortDate(workshop.joinedAt)}`}
              onOpen={() => navigate(`/my-workshops/${workshop.id}`)}
            >
              <ProgressBar done={workshop.doneCount} total={workshop.stepCount} finished={workshop.finished} />
            </WorkshopCard>
          ))}
        </div>
      )}
    </div>
  );
}
