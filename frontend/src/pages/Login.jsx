import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { currentUser } from '../api';
import EmailStep from '../components/auth/EmailStep';
import PasswordStep from '../components/auth/PasswordStep';
import SignupStep from '../components/auth/SignupStep';

export default function Login() {
  const [email, setEmail] = useState('');
  const [lookup, setLookup] = useState(null);

  if (currentUser()) return <Navigate to="/" replace />;

  function changeEmail() {
    setLookup(null);
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex flex-col justify-between gap-6 border-b-2 border-brutal-ink bg-brutal-lime p-6 md:w-1/2 md:border-b-0 md:border-r-2 md:p-12">
        <h1 className="text-5xl leading-none md:text-7xl">
          {'{ EPI'}
          <br />
          {'WORK }'}
        </h1>
        <p className="text-lg font-semibold">
          Live workshops.
          <br />
          Step by step.
          <br />
          Nobody left behind.
        </p>
      </aside>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {!lookup && <EmailStep email={email} onEmailChange={setEmail} onResult={setLookup} />}
          {lookup?.next === 'login' && <PasswordStep email={email} onChangeEmail={changeEmail} />}
          {lookup?.next === 'signup' && <SignupStep email={email} name={lookup.name} onChangeEmail={changeEmail} />}
        </div>
      </main>
    </div>
  );
}
