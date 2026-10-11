import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import WorkshopBrowser from '../../components/WorkshopBrowser';
import { formatShortDate } from '@/lib/formatTime';
import { api } from '../../api';

export default function WorkshopRecap() {
  const { id } = useParams();
  const [recap, setRecap] = useState(null);
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.myWorkshopRecap(id), api.workshopDocs(id)])
      .then(([nextRecap, nextDocs]) => {
        setRecap(nextRecap);
        setDocs(nextDocs);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const backLink = (
    <Link to="/my-workshops" className="self-start text-sm underline underline-offset-2">← My workshops</Link>
  );
  if (error) {
    return (
      <div className="flex flex-col gap-3">
        {backLink}
        <p role="alert" className="text-brutal-red">{error}</p>
      </div>
    );
  }
  if (!recap) return <p>Loading...</p>;

  const { steps } = recap;
  return (
    <div className="flex flex-col gap-6">
      {backLink}
      <WorkshopBrowser
        workshop={recap}
        steps={steps}
        docs={docs}
        meta={`Joined ${formatShortDate(recap.joinedAt)} · ${steps.length} step${steps.length === 1 ? '' : 's'}`}
      />
    </div>
  );
}
