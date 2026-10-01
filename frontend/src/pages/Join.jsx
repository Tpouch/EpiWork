import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Modal from '../components/Modal';
import { api, setCurrentUser } from '../api';

export default function Join() {
  const [code, setCode] = useState('');
  const [workshop, setWorkshop] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function checkCode(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      setWorkshop(await api.checkJoinCode(code.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function join(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { user, workshopId } = await api.join(code, email);
      setCurrentUser(user);
      // Full reload so App re-reads the stored user and picks the student routes.
      globalThis.location.assign(`/workshops/${workshopId}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function backToCode() {
    setWorkshop(null);
    setError('');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-4xl font-heading">{'{ EPIWORK }'}</h1>
      <form onSubmit={checkCode} className="flex w-full max-w-xs flex-col gap-3">
        <Label htmlFor="join-code">Workshop code</Label>
        <Input
          id="join-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="e.g. 7F3K9Q"
          className="text-center text-2xl uppercase tracking-[0.2em]"
        />
        {error && !workshop && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
        <Button type="submit" size="lg" disabled={busy || !code.trim()}>Continue</Button>
      </form>
      <Modal open={!!workshop} onClose={backToCode} title={workshop ? `Join ${workshop.icon} ${workshop.title}` : 'Join'}>
        <form onSubmit={join} className="flex flex-col gap-3">
          <Label htmlFor="join-email">Your Epitech email</Label>
          <Input
            id="join-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="firstname.lastname@epitech.eu"
          />
          <p className="text-xs opacity-60">Your name is taken from it so your teacher can see who you are.</p>
          {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
          <Button type="submit" disabled={busy || !email.trim()}>{busy ? 'Joining...' : 'Join workshop'}</Button>
        </form>
      </Modal>
    </div>
  );
}
