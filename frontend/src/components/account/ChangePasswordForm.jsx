import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { api } from '../../api';
import { useAsyncAction } from '../../lib/useAsyncAction';

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAsyncAction(async () => {
    if (next !== confirm) throw new Error('New passwords do not match.');
    await api.changePassword(current, next);
    setCurrent('');
    setNext('');
    setConfirm('');
    setSaved(true);
  });

  function submit(event) {
    event.preventDefault();
    setSaved(false);
    run();
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <h3 className="text-xl">Change password</h3>
          <Label htmlFor="current-password">Current password</Label>
          <PasswordInput id="current-password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <Label htmlFor="new-password">New password</Label>
          <PasswordInput id="new-password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <PasswordInput id="confirm-password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <p className="text-xs opacity-70">8+ characters. Your other devices will be logged out.</p>
          {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy || !current || !next || !confirm}>
              {busy ? 'Updating...' : 'Update password'}
            </Button>
            {saved && (
              <span role="status" className="flex items-center gap-1 border-2 border-brutal-line bg-brutal-green px-2 py-1 text-xs font-semibold text-brutal-dark">
                <Check className="size-3" aria-hidden="true" />
                Password updated
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
