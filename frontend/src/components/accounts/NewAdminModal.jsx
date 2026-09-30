import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { api } from '../../api';
import { useAsyncAction } from '../../lib/useAsyncAction';

export default function NewAdminModal({ onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, run } = useAsyncAction(async () => {
    await api.createAdmin({ name, email, password });
    onClose(true);
  });

  function submit(event) {
    event.preventDefault();
    run();
  }

  return (
    <Modal open onClose={() => onClose(false)} title="New admin">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Label htmlFor="new-admin-name">Name</Label>
        <Input id="new-admin-name" autoFocus autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
        <Label htmlFor="new-admin-email">Email</Label>
        <Input id="new-admin-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Label htmlFor="new-admin-password">Temporary password</Label>
        <PasswordInput id="new-admin-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-xs opacity-70">At least 8 characters. Give it to them directly; they can change it in My account.</p>
        {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="neutral" onClick={() => onClose(false)}>Cancel</Button>
          <Button type="submit" disabled={busy || !name.trim() || !email.trim() || !password}>
            {busy ? 'Creating...' : 'Create admin'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
