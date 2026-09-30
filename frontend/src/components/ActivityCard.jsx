import { Check, CircleHelp, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatTime';
import { useAsyncAction } from '@/lib/useAsyncAction';

const KINDS = {
  help: { Icon: CircleHelp, color: 'var(--color-brutal-orange)', action: 'Mark resolved', closedLabel: 'resolved' },
  review: { Icon: MessageSquare, color: 'var(--color-brutal-cyan)', action: 'Approve', closedLabel: 'approved' },
  answer: { Icon: MessageSquare, color: 'var(--color-brutal-pink)' },
  done: { Icon: Check, color: 'var(--color-brutal-green)' },
};

function kindOf(event) {
  if (event.type === 'help_requested') return 'help';
  if (event.type === 'checkpoint_submitted') return 'review';
  return event.answer ? 'answer' : 'done';
}

function titleOf(event, kind) {
  const name = event.student.name;
  if (kind === 'help') return event.open ? `${name} needs help` : `${name} needed help`;
  if (kind === 'review') return `${name} answered a checkpoint`;
  if (kind === 'answer') return `${name} answered a question`;
  return `${name} marked step ${event.step.number} done`;
}

function detailsOf(event, kind) {
  const parts = [`Step ${event.step.number} · ${event.step.title}`];
  if (event.closedAt) parts.push(`${KINDS[kind].closedLabel} at ${formatTime(event.closedAt)}`);
  else if (kind === 'review') parts.push('awaiting your review');
  return parts.join(' · ');
}

export default function ActivityCard({ event, onAction }) {
  const kind = kindOf(event);
  const { Icon, color, action } = KINDS[kind];
  const { busy, error, run } = useAsyncAction(onAction);
  return (
    <article
      className={cn(
        'grid grid-cols-[2rem_1fr_auto] items-start gap-3 border-2 border-l-6 border-brutal-line bg-brutal-surface p-3 shadow-brutal-sm',
        event.closedAt && 'opacity-60',
      )}
      style={{ borderLeftColor: color }}
    >
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center border-2 border-brutal-line text-brutal-dark"
        style={{ background: color }}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold">{titleOf(event, kind)}</p>
        <p className="text-xs opacity-70">{detailsOf(event, kind)}</p>
        {event.answer && (
          <blockquote className="mt-2 border-2 border-brutal-line bg-brutal-field px-2.5 py-1.5 text-sm break-words">
            {event.answer}
          </blockquote>
        )}
        {error && <p role="alert" className="mt-2 text-xs text-brutal-red">{error}</p>}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <time dateTime={new Date(event.createdAt).toISOString()} className="text-xs tabular-nums opacity-70">
          {formatTime(event.createdAt)}
        </time>
        {event.open && (
          <Button size="xs" disabled={busy} onClick={() => run(event)}>
            {action}
          </Button>
        )}
      </div>
    </article>
  );
}
