import { useCallback, useEffect, useRef, useState } from 'react';

// Debounced partial saves. Patches merge until the author pauses, and whatever is still
// pending is sent when the component unmounts (switching sub step, leaving the editor).
export function useAutosave(save, delay = 800) {
  const pending = useRef({});
  const timer = useRef(null);
  const saveRef = useRef(save);
  const [state, setState] = useState({ status: 'idle', savedAt: null, error: '' });

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const patch = pending.current;
    if (Object.keys(patch).length === 0) return;
    pending.current = {};
    setState((current) => ({ ...current, status: 'saving' }));
    try {
      await saveRef.current(patch);
      setState({ status: 'saved', savedAt: new Date(), error: '' });
    } catch (err) {
      pending.current = { ...patch, ...pending.current };
      setState((current) => ({ ...current, status: 'error', error: err.message }));
    }
  }, []);

  const schedule = useCallback(
    (patch) => {
      pending.current = { ...pending.current, ...patch };
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [delay, flush],
  );

  useEffect(() => () => { flush(); }, [flush]);

  return { ...state, schedule, flush };
}
