import { useState } from 'react';

// Busy + error state shared by every form that calls the API.
export function useAsyncAction(action) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(...args) {
    setBusy(true);
    setError('');
    try {
      return await action(...args);
    } catch (err) {
      setError(err.message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, run };
}
