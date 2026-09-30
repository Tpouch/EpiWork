import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Button, buttonVariants } from '../../components/ui/button';
import LaunchWorkshopModal from '../../components/LaunchWorkshopModal';
import JoinInfo from '../../components/JoinInfo';
import ProgressRail from '../../components/ProgressRail';
import SessionTimeline from '../../components/SessionTimeline';
import ActivityFeed from '../../components/ActivityFeed';
import { api } from '../../api';

const REFRESH_MS = 4000;
const END_CONFIRMATION = 'End this session? Students will no longer be able to join with this code.';

function LiveSession({ session, progress, activity, error, onShowCode, onEnd, onEventAction }) {
  const count = session.participantCount;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading">{session.icon} {session.title}</h2>
          <p className="text-sm opacity-70">{count} student{count === 1 ? '' : 's'} · code {session.joinCode}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="neutral" onClick={onShowCode}>Show join code</Button>
          <Link to={`/workshops/${session.workshopId}/review`} className={buttonVariants({ variant: 'neutral' })}>
            Review answers
          </Link>
          <Button variant="neutral" onClick={onEnd} className="border-brutal-red text-brutal-red">End session</Button>
        </div>
      </div>
      {error && <p role="alert" className="text-brutal-red">{error}</p>}
      {!progress && <p>Loading...</p>}
      {progress?.students.length === 0 && (
        <p className="opacity-70">No students have joined yet. Share the code {session.joinCode}.</p>
      )}
      {progress?.students.length > 0 && (
        <ProgressRail workshop={progress.workshop} studentsProgress={progress.students} />
      )}
      {activity && (
        <div className="grid items-start gap-6 lg:grid-cols-[5fr_7fr]">
          <SessionTimeline activity={activity} />
          <ActivityFeed events={activity.events} onAction={onEventAction} />
        </div>
      )}
    </div>
  );
}

export default function Teach() {
  const location = useLocation();
  const [session, setSession] = useState(undefined);
  const [progress, setProgress] = useState(null);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState(location.state?.justLaunched ? 'join' : 'live');
  const [picking, setPicking] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const overview = await api.session();
      setSession(overview.active);
      if (overview.active) {
        const [nextProgress, nextActivity] = await Promise.all([api.sessionProgress(), api.sessionEvents()]);
        setProgress(nextProgress);
        setActivity(nextActivity);
      } else {
        setProgress(null);
        setActivity(null);
      }
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  function handleLaunched(launched) {
    setPicking(false);
    setSession(launched);
    setView('join');
    refresh();
  }

  async function endSession() {
    if (!globalThis.confirm(END_CONFIRMATION)) return;
    try {
      await api.endWorkshop(session.workshopId);
      setView('live');
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  // Errors propagate to the card, which shows the backend message.
  async function handleEventAction(event) {
    const action = event.type === 'help_requested' ? api.resolveHelp : api.unlockStep;
    await action(event.step.id, event.student.id);
    await refresh();
  }

  if (session === undefined) {
    return error ? <p role="alert" className="text-brutal-red">{error}</p> : <p>Loading...</p>;
  }

  if (!session) {
    return (
      <>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <Play className="size-12 opacity-30" aria-hidden="true" />
          <h2 className="text-2xl font-heading">No workshop is live</h2>
          <p className="max-w-xs opacity-70">Launch a workshop to open it up for students and get a join code to share.</p>
          <Button size="lg" onClick={() => setPicking(true)}>
            <Play aria-hidden="true" />
            Launch a workshop
          </Button>
          {error && <p role="alert" className="text-brutal-red">{error}</p>}
        </div>
        <LaunchWorkshopModal open={picking} onClose={() => setPicking(false)} onLaunched={handleLaunched} />
      </>
    );
  }

  if (view === 'join') {
    return <JoinInfo session={session} onOpenLive={() => setView('live')} onEnd={endSession} />;
  }

  return (
    <LiveSession
      session={session}
      progress={progress}
      activity={activity}
      error={error}
      onShowCode={() => setView('join')}
      onEnd={endSession}
      onEventAction={handleEventAction}
    />
  );
}
