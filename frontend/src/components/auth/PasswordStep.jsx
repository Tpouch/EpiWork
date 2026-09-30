import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { api } from '../../api';
import { useAsyncAction } from '../../lib/useAsyncAction';

export default function PasswordStep({ email, onChangeEmail }) {
  const [password, setPassword] = useState('');
  const { busy, error, run } = useAsyncAction(async () => {
    await api.login(email.trim(), password);
    // Full reload so App re-reads the stored user and picks the right routes.
    window.location.assign('/');
  });

  function submit(event) {
    event.preventDefault();
    run();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h2 className="text-3xl">Welcome back</h2>
      <p className="text-sm">
        {email.trim()} ·{' '}
        <button type="button" onClick={onChangeEmail} className="cursor-pointer underline underline-offset-2">
          change
        </button>
      </p>
      <input type="email" name="username" autoComplete="username" value={email.trim()} readOnly hidden />
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">Password</Label>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
      </div>
      <Button type="submit" size="lg" disabled={busy || !password}>
        {busy ? 'Logging in...' : 'Log in'}
      </Button>
    </form>
  );
}
