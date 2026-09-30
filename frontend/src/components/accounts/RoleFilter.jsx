import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'admin', label: 'Admins' },
  { value: 'student', label: 'Students' },
];

export default function RoleFilter({ value, onChange }) {
  return (
    <div role="group" aria-label="Filter by role" className="flex">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            '-ml-0.5 h-10 cursor-pointer border-2 border-brutal-ink px-3 text-xs font-semibold uppercase first:ml-0',
            value === option.value ? 'bg-brutal-ink text-brutal-bg' : 'bg-brutal-bg',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
