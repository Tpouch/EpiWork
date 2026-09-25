import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader';
import PriorityFeed from '../../components/PriorityFeed';
import WorkshopCard from '../../components/WorkshopCard';
import SessionHero from '../../components/SessionHero';
import LaunchWorkshopModal from '../../components/LaunchWorkshopModal';
import { stepsSummary, historySummary } from '../../lib/workshopMeta';
import { api, currentUser } from '../../api';

const STRIP_SIZE = 3;

function today() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function AdminHome() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const navigate = useNavigate();
  const firstName = currentUser()?.name.split(' ')[0];

  useEffect(() => {
    Promise.all([api.session(), api.listWorkshops(), api.adminFeed()])
      .then(([session, workshops, feed]) => setData({ session, workshops, feed }))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p role="alert" className="text-brutal-red">{error}</p>;
  if (!data) return <p>Loading...</p>;

  const { session, workshops, feed } = data;
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-heading">Welcome back, {firstName}</h2>
        <p className="text-sm opacity-70">{today()}</p>
      </div>
      <SessionHero session={session} onLaunch={() => setPicking(true)} onJump={() => navigate('/teach')} />
      {feed.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader>Priority_</SectionHeader>
          <PriorityFeed items={feed} />
        </section>
      )}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Your workshops</SectionHeader>
          <Link to="/workshops" className="text-sm underline underline-offset-2">See all →</Link>
        </div>
        {workshops.length === 0 ? (
          <p className="opacity-70">
            No workshops yet. <Link to="/workshops" className="underline">Create your first one</Link>.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {workshops.slice(0, STRIP_SIZE).map((workshop) => (
              <WorkshopCard
                key={workshop.id}
                workshop={workshop}
                meta={`${stepsSummary(workshop)} · ${historySummary(workshop)}`}
                onOpen={() => navigate(`/workshops/${workshop.id}`)}
              />
            ))}
          </div>
        )}
      </section>
      <LaunchWorkshopModal
        open={picking}
        onClose={() => setPicking(false)}
        onLaunched={() => navigate('/teach', { state: { justLaunched: true } })}
      />
    </div>
  );
}
