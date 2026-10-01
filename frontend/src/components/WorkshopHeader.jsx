export default function WorkshopHeader({ workshop, meta, action }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span
        aria-hidden="true"
        className="grid size-16 shrink-0 place-items-center border-2 border-brutal-line bg-brutal-accent text-4xl shadow-brutal"
      >
        {workshop.icon}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-3xl font-heading">{workshop.title}</h2>
        {workshop.description && <p className="text-sm opacity-75">{workshop.description}</p>}
        <p className="text-xs opacity-60">{meta}</p>
      </div>
      {action}
    </div>
  );
}
