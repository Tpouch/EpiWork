import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { api } from '../../api';
import { useAsyncAction } from '../../lib/useAsyncAction';

export default function ResetPasswordModal({ account, onClose }) {
  const [password, setPassword] = useState('');
  const { busy, error, run } = useAsyncAction(async () => {
    await api.resetPassword(account.id, password);
    onClose(true);
  });

  function submit(event) {
    event.preventDefault();
    run();
  }

  return (
    <Modal open onClose={() => onClose(false)} title="Reset password">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <p className="text-sm">
          For <strong>{account.name}</strong>. They will be logged out everywhere.
        </p>
        <Label htmlFor="reset-password">New password</Label>
        <PasswordInput id="reset-password" autoFocus autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="neutral" onClick={() => onClose(false)}>Cancel</Button>
          <Button type="submit" disabled={busy || !password}>{busy ? 'Saving...' : 'Set password'}</Button>
        </div>
      </form>
    </Modal>
  );
}
