import { StarDisplay } from './StarRating';
import { formatTime } from '@/lib/formatTime';

export default function FeedbackList({ feedback }) {
  if (feedback.length === 0) return <p className="text-sm opacity-70">No feedback yet.</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {feedback.map((item) => (
        <li
          key={item.id}
          className="border-2 border-l-6 border-brutal-line bg-brutal-surface p-3 shadow-brutal-sm"
          style={{ borderLeftColor: 'var(--color-brutal-green)' }}
        >
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold">{item.student.name}</span>
            <StarDisplay value={item.rating} />
            <time dateTime={new Date(item.createdAt).toISOString()} className="text-xs opacity-70">
              {formatTime(item.createdAt)}
            </time>
          </p>
          {item.comment ? (
            <p className="mt-1.5 text-sm break-words">{item.comment}</p>
          ) : (
            <p className="mt-1 text-xs opacity-70">No comment</p>
          )}
        </li>
      ))}
    </ul>
  );
}
