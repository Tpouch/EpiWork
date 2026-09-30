import Modal from '../Modal';
import { Button } from '../ui/button';
import { api } from '../../api';
import { useAsyncAction } from '../../lib/useAsyncAction';

export default function DeleteAccountModal({ account, onClose }) {
  const { busy, error, run } = useAsyncAction(async () => {
    await api.deleteAccount(account.id);
    onClose(true);
  });

  return (
    <Modal open onClose={() => onClose(false)} title={`Delete ${account.name}?`}>
      <div className="flex flex-col gap-3">
        <p className="text-sm">
          This removes the account, its workshop progress and participations. It can&apos;t be undone.
        </p>
        {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="neutral" onClick={() => onClose(false)}>Cancel</Button>
          <Button type="button" variant="danger" disabled={busy} onClick={() => run()}>
            {busy ? 'Deleting...' : 'Delete account'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
