import { useEffect, useState } from 'react';
import RunCard from '../../components/RunCard';
import { api } from '../../api';

export default function History() {
  const [runs, setRuns] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listRuns().then(setRuns).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-3xl font-heading">History</h2>
        <p className="text-sm opacity-70">Every time a workshop was launched, newest first.</p>
      </div>
      {error && <p role="alert" className="text-brutal-red">{error}</p>}
      {!runs && !error && <p>Loading...</p>}
      {runs?.length === 0 && <p className="opacity-70">No sessions yet. Launch a workshop from Teach.</p>}
      {runs?.length > 0 && (
        <ul className="flex flex-col gap-3">
          {runs.map((run) => (
            <li key={run.id}>
              <RunCard run={run} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
