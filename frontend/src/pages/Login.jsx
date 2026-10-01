import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { api, setCurrentUser } from '../api';

export default function Login() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.listUsers().then(setUsers);
  }, []);

  function pick(user) {
    setCurrentUser(user);
    navigate('/');
  }

  const admin = users.find((u) => u.role === 'admin');
  const students = users.filter((u) => u.role === 'student');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-4xl font-heading">{'{ EPIWORK }'}</h1>
      <p className="opacity-70">Who&apos;s logging in?</p>
      {admin && (
        <Button size="lg" onClick={() => pick(admin)}>
          I&apos;m the Admin
        </Button>
      )}
      <div className="flex flex-col gap-2">
        {students.map((s) => (
          <Button key={s.id} variant="neutral" onClick={() => pick(s)}>
            {s.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
