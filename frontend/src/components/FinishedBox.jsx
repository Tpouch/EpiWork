import { Flag } from 'lucide-react';
import { StarDisplay } from './StarRating';
import { formatTime } from '@/lib/formatTime';

function minutesBetween(from, to) {
  return Math.max(1, Math.round((new Date(to) - new Date(from)) / 60000));
}

export default function FinishedBox({ event, joinedAt, feedback }) {
  return (
    <li className="grid grid-cols-[3rem_1.75rem_1fr] items-start gap-2">
      <time dateTime={new Date(event.createdAt).toISOString()} className="pt-1 text-right text-xs tabular-nums opacity-70">
        {formatTime(event.createdAt)}
      </time>
      <span
        aria-hidden="true"
        className="relative z-10 grid size-7 place-items-center border-2 border-brutal-line bg-brutal-green text-brutal-dark"
      >
        <Flag className="size-4" />
      </span>
      <div className="border-2 border-brutal-line bg-brutal-green p-2.5 text-brutal-dark shadow-brutal-sm">
        <p className="text-sm font-bold">{event.student.name} finished the workshop</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
          {feedback ? (
            <>
              <StarDisplay value={feedback.rating} />
              {feedback.rating}/5
            </>
          ) : (
            'No rating yet'
          )}
          {joinedAt && <span>· {minutesBetween(joinedAt, event.createdAt)} min</span>}
        </p>
        {feedback?.comment && (
          <blockquote className="mt-2 border-2 border-brutal-line bg-brutal-surface px-2.5 py-1.5 text-sm break-words text-brutal-ink">
            {feedback.comment}
          </blockquote>
        )}
      </div>
    </li>
  );
}
