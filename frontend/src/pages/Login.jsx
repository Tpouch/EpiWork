import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Stack, Text, Title } from '@mantine/core';
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
    <Stack align="center" justify="center" mih="100vh" gap="md">
      <Title order={1}>{'{ EPIWORK }'}</Title>
      <Text c="dimmed">Who&apos;s logging in?</Text>
      {admin && <Button size="md" onClick={() => pick(admin)}>I&apos;m the Admin</Button>}
      <Stack gap="xs">
        {students.map((s) => (
          <Button key={s.id} variant="outline" onClick={() => pick(s)}>
            {s.name}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
