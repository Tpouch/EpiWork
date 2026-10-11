import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const HOLD_MS = 5000;
const HOLD_KEYS = new Set([' ', 'Enter']);

// A destructive action that needs a deliberate 5 second press instead of a confirm dialog.
export default function HoldToDeleteButton({ label, onConfirm, disabled = false }) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);
  const startedAt = useRef(0);
  const confirming = useRef(false);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function tick(now) {
    const next = Math.min((now - startedAt.current) / HOLD_MS, 1);
    setProgress(next);
    if (next < 1) {
      frame.current = requestAnimationFrame(tick);
      return;
    }
    confirming.current = true;
    Promise.resolve(onConfirm()).finally(() => {
      confirming.current = false;
      setProgress(0);
    });
  }

  function begin() {
    if (disabled || confirming.current) return;
    startedAt.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  }

  function cancel() {
    if (confirming.current) return;
    cancelAnimationFrame(frame.current);
    setProgress(0);
  }

  const secondsLeft = Math.ceil(((1 - progress) * HOLD_MS) / 1000);
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(event) => {
        if (HOLD_KEYS.has(event.key) && !event.repeat) {
          event.preventDefault();
          begin();
        }
      }}
      onKeyUp={(event) => {
        if (HOLD_KEYS.has(event.key)) cancel();
      }}
      className="relative w-full overflow-hidden border-2 border-brutal-red bg-brutal-surface px-3 py-2 font-semibold text-brutal-red shadow-brutal-sm cursor-pointer select-none touch-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-brutal-red" style={{ width: `${progress * 100}%` }} />
      <span className={cn('relative flex items-center justify-center gap-2', progress > 0 && 'text-brutal-dark')}>
        <Trash2 className="size-4" aria-hidden="true" />
        {progress > 0 ? `Keep holding… ${secondsLeft} s` : label}
      </span>
    </button>
  );
}
