import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { api } from '../../api';
import { useAsyncAction } from '../../lib/useAsyncAction';

export default function EmailStep({ email, onEmailChange, onResult }) {
  const { busy, error, run } = useAsyncAction(async () => {
    onResult(await api.lookupEmail(email.trim()));
  });

  function submit(event) {
    event.preventDefault();
    run();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h2 className="text-3xl">Log in or sign up</h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="firstname.lastname@epitech.eu"
          aria-describedby="login-email-help"
        />
        {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
        <p id="login-email-help" className="text-xs opacity-70">
          Students: use your Epitech email. First time here? We&apos;ll create your account.
        </p>
      </div>
      <Button type="submit" size="lg" disabled={busy || !email.trim()}>
        {busy ? 'Checking...' : 'Continue'}
        <ArrowRight aria-hidden="true" />
      </Button>
    </form>
  );
}
