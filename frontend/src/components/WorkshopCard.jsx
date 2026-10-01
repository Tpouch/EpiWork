export default function WorkshopCard({ workshop, meta, onOpen, children }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative flex flex-col gap-1.5 border-2 border-brutal-line bg-brutal-surface p-4 text-left shadow-brutal transition-all cursor-pointer hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
    >
      {workshop.isActive && (
        <span className="absolute right-3 top-3 flex items-center gap-1 border-2 border-brutal-line bg-brutal-green px-1.5 text-[10px] text-brutal-dark font-bold uppercase">
          <span className="size-1.5 rounded-full bg-brutal-dark" aria-hidden="true" />
          Live
        </span>
      )}
      <span className="text-3xl" aria-hidden="true">{workshop.icon}</span>
      <span className="font-semibold">{workshop.title}</span>
      {workshop.description && <span className="text-sm opacity-70 line-clamp-2">{workshop.description}</span>}
      <span className="text-xs opacity-60">{meta}</span>
      {children}
    </button>
  );
}
