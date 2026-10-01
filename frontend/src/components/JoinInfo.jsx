import { Button } from './ui/button';

function joinedLabel(count) {
  if (count === 0) return 'Waiting for students to join...';
  return `${count} student${count === 1 ? ' has' : 's have'} joined so far`;
}

export default function JoinInfo({ session, onOpenLive, onEnd }) {
  const joinUrl = `${globalThis.location.origin}/join`;
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <h2 className="text-2xl font-heading">{session.icon} {session.title} is live</h2>
      <div className="flex flex-col gap-4 border-3 border-brutal-ink bg-white px-10 py-6 shadow-brutal-lg">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60">Students join at</p>
          <p className="font-heading text-2xl break-all">{joinUrl}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60">With code</p>
          <p className="font-heading text-5xl tracking-[0.2em]">{session.joinCode}</p>
        </div>
      </div>
      <p className="text-sm opacity-70" aria-live="polite">{joinedLabel(session.participantCount)}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onOpenLive}>Open live view →</Button>
        <Button variant="neutral" onClick={onEnd} className="border-brutal-red text-brutal-red">
          Cancel session
        </Button>
      </div>
    </div>
  );
}
