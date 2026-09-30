import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { api } from '../api';
import { useAsyncAction } from '../lib/useAsyncAction';

export default function JoinCodeCard() {
  const [code, setCode] = useState('');
  const [workshop, setWorkshop] = useState(null);
  const navigate = useNavigate();
  const check = useAsyncAction(async () => setWorkshop(await api.checkJoinCode(code.trim())));
  const join = useAsyncAction(async () => {
    const { workshopId } = await api.join(code.trim());
    navigate(`/workshops/${workshopId}`);
  });

  function submit(event) {
    event.preventDefault();
    check.run();
  }

  return (
    <Card>
      <CardContent>
        {!workshop ? (
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="join-code">Join a workshop</Label>
              <Input
                id="join-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="e.g. 7F3K9Q"
                className="uppercase tracking-[0.2em]"
              />
            </div>
            <Button type="submit" disabled={check.busy || !code.trim()}>
              {check.busy ? 'Checking...' : 'Continue'}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">
              Join {workshop.icon} {workshop.title}?
            </p>
            <div className="flex gap-2">
              <Button variant="neutral" onClick={() => setWorkshop(null)}>Use another code</Button>
              <Button onClick={() => join.run()} disabled={join.busy}>
                {join.busy ? 'Joining...' : 'Join workshop'}
              </Button>
            </div>
          </div>
        )}
        {(check.error || join.error) && (
          <p role="alert" className="mt-2 text-sm text-brutal-red">{check.error || join.error}</p>
        )}
      </CardContent>
    </Card>
  );
}
