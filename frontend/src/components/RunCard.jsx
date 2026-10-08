import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { formatRunWindow } from '@/lib/formatTime';

const TONES = {
  plain: 'bg-brutal-field',
  green: 'bg-brutal-green text-brutal-dark',
  accent: 'bg-brutal-accent text-brutal-dark',
  live: 'bg-brutal-orange text-brutal-dark',
};

function Stat({ tone = 'plain', children }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap border-2 border-brutal-line px-2 text-xs font-bold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

export default function RunCard({ run }) {
  return (
    <Link
      to={`/history/${run.id}`}
      className="grid grid-cols-[2.75rem_1fr] items-center gap-3 border-2 border-brutal-line bg-brutal-surface p-3 shadow-brutal transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brutal-ink sm:grid-cols-[2.75rem_1fr_auto]"
    >
      <span aria-hidden="true" className="grid size-11 place-items-center border-2 border-brutal-line bg-brutal-field text-2xl">
        {run.workshop.icon}
      </span>
      <div className="min-w-0">
        <p className="truncate font-bold">{run.workshop.title}</p>
        <p className="text-sm opacity-70">{formatRunWindow(run)}</p>
      </div>
      <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:justify-end">
        {!run.endedAt && <Stat tone="live">Live</Stat>}
        <Stat>{plural(run.studentCount, 'student')}</Stat>
        <Stat tone="green">{run.finishedCount} finished</Stat>
        {run.ratingCount > 0 && (
          <Stat tone="accent">
            <Star aria-hidden="true" className="size-3 fill-current" />
            {run.averageRating} · {plural(run.ratingCount, 'rating')}
          </Stat>
        )}
      </div>
    </Link>
  );
}
