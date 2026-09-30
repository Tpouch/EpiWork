import { Check, LogIn, Play } from 'lucide-react';
import SectionHeader from './SectionHeader';
import FinishedBox from './FinishedBox';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatTime';

const EMPTY_TEXT = 'Nothing yet. Events show up as students work.';

function describe(event) {
  const name = event.student.name;
  if (event.type === 'joined') return { Icon: LogIn, label: `${name} joined` };
  return { Icon: Check, label: `${name} finished step ${event.step.number}`, detail: event.step.title };
}

function TimelineRow({ time, Icon, label, detail, milestone }) {
  return (
    <li className="grid grid-cols-[3rem_1.75rem_1fr] items-start gap-2">
      <time dateTime={new Date(time).toISOString()} className="pt-1 text-right text-xs tabular-nums opacity-70">
        {formatTime(time)}
      </time>
      <span
        aria-hidden="true"
        className={cn(
          'relative z-10 grid size-7 place-items-center border-2 border-brutal-line',
          milestone ? 'bg-brutal-accent text-brutal-dark' : 'bg-brutal-surface text-brutal-ink',
        )}
      >
        <Icon className="size-4" />
      </span>
      <p className={cn('pt-1 text-sm', milestone && 'font-bold')}>
        {label}
        {detail && <span className="block text-xs font-normal opacity-70">{detail}</span>}
      </p>
    </li>
  );
}

export default function SessionTimeline({ activity }) {
  const rows = activity.events.filter((event) => event.type === 'joined' || event.type === 'step_done');
  const feedbackByStudent = new Map(activity.feedback.map((item) => [item.studentId, item]));
  const joinedAtByStudent = new Map(
    rows.filter((event) => event.type === 'joined').map((event) => [event.student.id, event.createdAt]),
  );
  const isFinish = (event) => event.type === 'step_done' && event.step.id === activity.lastStepId;
  return (
    <section aria-label="Session timeline" className="flex flex-col gap-3">
      <SectionHeader>Timeline</SectionHeader>
      <div className="max-h-[28rem] overflow-y-auto border-2 border-brutal-line bg-brutal-surface shadow-brutal">
        {/* The vertical line runs behind the icon column: 1rem padding + 3rem time + 0.5rem gap + half an icon. */}
        <ol className="relative flex flex-col gap-3.5 p-4 before:absolute before:top-6 before:bottom-6 before:left-[85px] before:w-0.5 before:bg-brutal-line/35">
          {rows.map((event) =>
            isFinish(event) ? (
              <FinishedBox
                key={event.id}
                event={event}
                joinedAt={joinedAtByStudent.get(event.student.id)}
                feedback={feedbackByStudent.get(event.student.id)}
              />
            ) : (
              <TimelineRow key={event.id} time={event.createdAt} {...describe(event)} />
            ),
          )}
          <TimelineRow time={activity.launchedAt} Icon={Play} label="Session launched" milestone />
        </ol>
        {rows.length === 0 && <p className="px-4 pb-4 text-sm opacity-70">{EMPTY_TEXT}</p>}
      </div>
    </section>
  );
}
