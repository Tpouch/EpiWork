import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { api } from '../../api';
import { useAsyncAction } from '../../lib/useAsyncAction';

const LOCKED_INPUT = 'border-dashed opacity-70';

export default function ProfileForm({ user, onSaved }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? '');
  const [saved, setSaved] = useState(false);
  const canEditName = !user.isProtected;
  const canEditEmail = canEditName && user.role === 'admin';
  const { busy, error, run } = useAsyncAction(async () => {
    onSaved(await api.updateMe(canEditEmail ? { name, email } : { name }));
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
          <h3 className="text-xl">Profile</h3>
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={!canEditName}
            className={canEditName ? undefined : LOCKED_INPUT}
          />
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={!canEditEmail}
            aria-describedby={canEditEmail ? undefined : 'profile-email-help'}
            className={canEditEmail ? undefined : LOCKED_INPUT}
          />
          {!canEditEmail && (
            <p id="profile-email-help" className="text-xs opacity-70">
              {user.isProtected
                ? "This is the base admin account: its name and email can't be changed, only its password."
                : "Your Epitech email is your login and can't be changed."}
            </p>
          )}
          {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
          {canEditName && (
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={busy || !name.trim()}>{busy ? 'Saving...' : 'Save profile'}</Button>
              {saved && (
                <output className="flex items-center gap-1 border-2 border-brutal-ink bg-brutal-green px-2 py-1 text-xs font-semibold">
                  <Check className="size-3" aria-hidden="true" />
                  Saved
                </output>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
