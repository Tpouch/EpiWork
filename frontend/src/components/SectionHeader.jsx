import { signalColors } from '../theme';

export default function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1 h-4" style={{ background: signalColors.sectionBar }} />
      <h3 className="text-xl font-heading">{children}</h3>
    </div>
  );
}
