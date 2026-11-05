import { useEffect, useState } from 'react';
import Modal from './Modal';
import CopyButton from './CopyButton';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { formatTime } from '@/lib/formatTime';
import { api } from '../api';

function StudentsList({ students }) {
  if (students.length === 0) return <p className="text-sm opacity-70">Nobody joined this workshop yet.</p>;
  return (
    <ul className="flex flex-col gap-1">
      {students.map((student) => (
        <li key={student.id} className="flex items-center justify-between gap-2 border-2 border-brutal-line bg-brutal-surface px-3 py-1.5 text-sm">
          <span className="min-w-0 truncate">{student.name} <span className="opacity-60">{student.email}</span></span>
          <span className="shrink-0 font-semibold">
            {student.configuredAt ? `Configured at ${formatTime(student.configuredAt)}` : 'Not configured'}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Result({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2 border-2 border-brutal-line bg-brutal-field px-3 py-1.5">
      <span className="text-xs uppercase opacity-70">{label}</span>
      <code className="min-w-0 break-all font-mono text-sm">{value}</code>
      <CopyButton text={value} />
    </div>
  );
}

function ToolForm({ slug }) {
  const [login, setLogin] = useState('');
  const [exo, setExo] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function generate(event) {
    event.preventDefault();
    setError('');
    try {
      setResult(await api.checkerTool({ slug, login: login.trim(), exo: exo.trim() }));
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }

  return (
    <form onSubmit={generate} className="flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
        <div className="flex flex-col gap-1">
          <Label htmlFor="tool-login">Student email</Label>
          <Input id="tool-login" type="email" value={login} onChange={(e) => setLogin(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="tool-exo">Exercise (optional)</Label>
          <Input id="tool-exo" value={exo} placeholder="02" onChange={(e) => setExo(e.target.value)} />
        </div>
        <Button type="submit" disabled={!login.trim()}>Generate</Button>
      </div>
      {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
      {result && (
        <div className="flex flex-col gap-1">
          <Result label="Identification" value={result.id} />
          <Result label="Pairing" value={result.pair} />
          {result.flag && <Result label="Flag" value={result.flag} />}
        </div>
      )}
    </form>
  );
}

export default function CheckerAdminModal({ workshop, onClose }) {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.workshopChecker(workshop.id).then(setStudents).catch((err) => setError(err.message));
  }, [workshop.id]);

  return (
    <Modal open onClose={onClose} title="Checker" size="wide">
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-2">
          <h3 className="font-heading">Codes and flags of a student</h3>
          <p className="text-xs opacity-70">For support or tests. Workshop slug: <code>{workshop.slug}</code></p>
          <ToolForm slug={workshop.slug} />
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="font-heading">Workstations</h3>
          {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
          {!error && !students && <p>Loading...</p>}
          {students && <StudentsList students={students} />}
        </section>
      </div>
    </Modal>
  );
}
