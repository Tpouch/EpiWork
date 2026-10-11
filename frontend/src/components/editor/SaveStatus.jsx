import { formatTime } from '@/lib/formatTime';

export default function SaveStatus({ status, savedAt, error, onRetry }) {
  if (status === 'error') {
    return (
      <p role="alert" className="text-sm text-brutal-red">
        Not saved: {error}{' '}
        <button type="button" onClick={onRetry} className="font-semibold underline cursor-pointer">Retry</button>
      </p>
    );
  }
  if (status === 'saving') return <p className="text-xs opacity-70">Saving…</p>;
  if (savedAt) return <p className="text-xs opacity-70">Saved {formatTime(savedAt)}</p>;
  return <p className="text-xs opacity-70">Changes are saved automatically.</p>;
}
