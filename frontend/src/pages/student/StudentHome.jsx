import { useEffect, useState } from 'react';
import JoinCodeCard from '../../components/JoinCodeCard';
import StatTile from '../../components/StatTile';
import { api, currentUser } from '../../api';

function today() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function StudentStats({ workshops }) {
  const finished = workshops.filter((workshop) => workshop.finished).length;
  const stepsDone = workshops.reduce((sum, workshop) => sum + workshop.doneCount, 0);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatTile value={workshops.length} label="Workshops joined" className="bg-brutal-accent" />
      <StatTile value={finished} label="Finished" className="bg-brutal-green" />
      <StatTile value={stepsDone} label="Steps completed" className="bg-brutal-cyan" />
    </div>
  );
}

export default function StudentHome() {
  const [workshops, setWorkshops] = useState(null);
  const [error, setError] = useState('');
  const firstName = currentUser()?.name.split(' ')[0];

  useEffect(() => {
    api.myWorkshops().then(setWorkshops).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-heading">Welcome back, {firstName}</h2>
        <p className="text-sm opacity-70">{today()}</p>
      </div>
      {error && <p role="alert" className="text-brutal-red">{error}</p>}
      {!workshops && !error && <p>Loading...</p>}
      {workshops && <StudentStats workshops={workshops} />}
      <JoinCodeCard />
    </div>
  );
}
