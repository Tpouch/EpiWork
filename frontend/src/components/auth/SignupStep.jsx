import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { api } from '../../api';
import { useAsyncAction } from '../../lib/useAsyncAction';

export default function SignupStep({ email, name, onChangeEmail }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { busy, error, run } = useAsyncAction(async () => {
    if (password !== confirm) throw new Error('Passwords do not match.');
    await api.signup(email.trim(), password);
    globalThis.location.assign('/');
  });

  function submit(event) {
    event.preventDefault();
    run();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h2 className="text-3xl">Create your account</h2>
      <p className="text-sm">
        Hi <strong>{name}</strong>. First time here: pick a password (8+ characters).{' '}
        <button type="button" onClick={onChangeEmail} className="cursor-pointer underline underline-offset-2">
          Not you?
        </button>
      </p>
      <input type="email" name="username" autoComplete="username" value={email.trim()} readOnly hidden />
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-password">Password</Label>
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-confirm">Confirm password</Label>
        <PasswordInput
          id="signup-confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
      </div>
      <Button type="submit" size="lg" disabled={busy || !password || !confirm}>
        {busy ? 'Creating...' : 'Create account'}
      </Button>
    </form>
  );
}
