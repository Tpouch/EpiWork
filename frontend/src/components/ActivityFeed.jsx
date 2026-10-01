import { useState } from 'react';
import ActivityCard from './ActivityCard';
import SectionHeader from './SectionHeader';
import { Button } from './ui/button';

const CARD_TYPES = new Set(['help_requested', 'checkpoint_submitted', 'step_done']);
const FILTERS = {
  All: () => true,
  Help: (event) => event.type === 'help_requested',
  Answers: (event) => event.type === 'checkpoint_submitted' || Boolean(event.answer),
  Done: (event) => event.type === 'step_done',
};

function CardGroup({ label, events, onAction }) {
  if (events.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs uppercase tracking-widest opacity-60">{label}</p>
      {events.map((event) => (
        <ActivityCard key={event.id} event={event} onAction={onAction} />
      ))}
    </div>
  );
}

export default function ActivityFeed({ events, onAction }) {
  const [filter, setFilter] = useState('All');
  const cards = events.filter((event) => CARD_TYPES.has(event.type) && FILTERS[filter](event));
  const openCount = events.filter((event) => event.open).length;
  return (
    <section aria-label="Activity" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SectionHeader>Activity</SectionHeader>
          {openCount > 0 && (
            <span className="border-2 border-brutal-line bg-brutal-orange px-1.5 text-xs font-bold text-brutal-dark">
              {openCount} need{openCount === 1 ? 's' : ''} you
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(FILTERS).map((name) => (
            <Button
              key={name}
              size="xs"
              variant={filter === name ? 'default' : 'neutral'}
              aria-pressed={filter === name}
              onClick={() => setFilter(name)}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto border-2 border-brutal-line bg-brutal-surface p-3 shadow-brutal">
        <CardGroup label="Needs you" events={cards.filter((event) => event.open)} onAction={onAction} />
        <CardGroup label="Earlier" events={cards.filter((event) => !event.open)} onAction={onAction} />
        {cards.length === 0 && (
          <p className="text-sm opacity-70">
            {filter === 'All' ? 'Nothing yet. Events show up as students work.' : 'No events match this filter.'}
          </p>
        )}
      </div>
    </section>
  );
}
