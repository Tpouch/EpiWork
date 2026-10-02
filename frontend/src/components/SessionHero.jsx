import { Play } from 'lucide-react';
import { Button } from './ui/button';

function studentsLabel(count) {
  return `${count} student${count === 1 ? '' : 's'}`;
}

function formatDay(date) {
  return new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

export default function SessionHero({ session, onLaunch, onJump }) {
  const { active, last } = session;

  if (active) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-brutal-ink bg-brutal-accent p-5 shadow-brutal">
        <div>
          <p className="flex items-center gap-2 font-heading text-xl uppercase">
            <span className="size-2.5 rounded-full bg-brutal-ink" aria-hidden="true" />
            {active.icon} {active.title} is live
          </p>
          <p className="text-sm opacity-80">{studentsLabel(active.participantCount)} · code {active.joinCode}</p>
        </div>
        <Button variant="neutral" onClick={onJump}>Jump to live session →</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-brutal-ink bg-white p-5 shadow-brutal">
      <div>
        <p className="font-heading text-xl uppercase">No session running</p>
        <p className="text-sm opacity-70">
          {last
            ? `Last session: ${last.title}, ${formatDay(last.launchedAt)} · ${studentsLabel(last.participantCount)}`
            : 'You haven’t run a session yet.'}
        </p>
      </div>
      <Button onClick={onLaunch}>
        <Play aria-hidden="true" />
        Launch a workshop
      </Button>
    </div>
  );
}
