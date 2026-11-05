import { useEffect, useState } from 'react';
import { Check, Terminal } from 'lucide-react';
import Modal from './Modal';
import CopyButton from './CopyButton';
import { Button } from './ui/button';
import { api } from '../api';

const POLL_MS = 4000;
const DEFAULT_API_URL = 'https://epiwork.devgoblin.fr/api';

function CommandLine({ command }) {
  return (
    <div className="flex items-center justify-between gap-2 border-2 border-brutal-line bg-brutal-field px-3 py-2">
      <code className="min-w-0 break-all font-mono text-sm">{command}</code>
      <CopyButton text={command} />
    </div>
  );
}

function SetupModal({ setup, onClose }) {
  const urlPrefix = setup.apiUrl && setup.apiUrl !== DEFAULT_API_URL ? `EPIWORK_URL=${setup.apiUrl} ` : '';
  return (
    <Modal open onClose={onClose} title="Set up your checker" size="wide">
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          Run this once in your terminal, from your repository. It links the <code>./check</code> script to your account, so it can
          give you the flag to paste here.
        </p>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Your identification code</p>
          <CommandLine command={`${urlPrefix}./check --config ${setup.id}`} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Offline? Use your pairing code instead</p>
          <CommandLine command={`./check --pair ${setup.pair}`} />
        </div>
        <p role="status" className="flex items-center gap-2 border-2 border-brutal-line bg-brutal-surface p-3 text-sm font-semibold">
          {setup.configuredAt ? (
            <>
              <Check className="size-4" aria-hidden="true" />
              Your workstation is configured. You can run ./check.
            </>
          ) : (
            'Waiting for ./check --config… this page updates by itself.'
          )}
        </p>
        <p className="text-xs opacity-70">These codes are personal: do not share them.</p>
      </div>
    </Modal>
  );
}

// Renders nothing when the workshop has no checker (the backend answers 404).
export default function CheckerSetup({ workshopId }) {
  const [setup, setSetup] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = () => api.myChecker(workshopId).then(setSetup).catch(() => setSetup(null));
    load();
    if (!open) return undefined;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [workshopId, open]);

  if (!setup) return null;
  return (
    <>
      <Button variant={setup.configuredAt ? 'neutral' : 'default'} onClick={() => setOpen(true)}>
        <Terminal aria-hidden="true" />
        {setup.configuredAt ? 'Checker' : 'Set up your checker'}
      </Button>
      {open && <SetupModal setup={setup} onClose={() => setOpen(false)} />}
    </>
  );
}
