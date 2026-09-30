import { useState } from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { api } from '../../api';
import { ACCENTS, applyAccent } from '../../lib/accent';
import { useAsyncAction } from '../../lib/useAsyncAction';

export default function AppearanceCard({ user, onSaved }) {
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAsyncAction(async (name) => {
    setSaved(false);
    applyAccent(name);
    try {
      onSaved(await api.updateAppearance(name));
      setSaved(true);
    } catch (err) {
      applyAccent(user.accentColor);
      throw err;
    }
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <h3 className="text-xl">Appearance</h3>
        <p id="accent-help" className="text-xs opacity-70">Accent color (buttons, active menu, highlights)</p>
        <div role="group" aria-labelledby="accent-help" className="flex flex-wrap gap-3">
          {ACCENTS.map((accent) => {
            const selected = (user.accentColor ?? 'lime') === accent.name;
            return (
              <div key={accent.name} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={accent.label}
                  disabled={busy}
                  onClick={() => run(accent.name)}
                  style={{ backgroundColor: accent.hex }}
                  className={`flex size-11 cursor-pointer items-center justify-center border-2 border-brutal-ink disabled:cursor-wait ${
                    selected ? 'ring-2 ring-brutal-ink ring-offset-2' : ''
                  }`}
                >
                  {selected && <Check className="size-5" aria-hidden="true" />}
                </button>
                <span className="text-[10px] font-semibold uppercase">{accent.label}</span>
              </div>
            );
          })}
        </div>
        {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
        {saved && (
          <span role="status" className="flex w-fit items-center gap-1 border-2 border-brutal-ink bg-brutal-green px-2 py-1 text-xs font-semibold">
            <Check className="size-3" aria-hidden="true" />
            Saved
          </span>
        )}
      </CardContent>
    </Card>
  );
}
