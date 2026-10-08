import { cn } from '@/lib/utils';

export default function StatTile({ value, label, className }) {
  return (
    <div className={cn('flex flex-col gap-1 border-2 border-brutal-line p-4 text-brutal-dark shadow-brutal', className)}>
      <span className="font-heading text-5xl leading-none">{value}</span>
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
    </div>
  );
}
