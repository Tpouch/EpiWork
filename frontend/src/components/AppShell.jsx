import { AppShell as MantineAppShell, Group, NavLink, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { setCurrentUser } from '../api';

export default function AppShell({ user, children }) {
  const navigate = useNavigate();

  function logout() {
    setCurrentUser(null);
    navigate('/login');
  }

  return (
    <MantineAppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={4}>{'{ EPIWORK }'}</Title>
          <Group>
            <Text size="sm" c="dimmed">{user?.name?.toUpperCase()}</Text>
            <Text size="sm" c="dimmed" onClick={logout} style={{ cursor: 'pointer' }}>
              Log out
            </Text>
          </Group>
        </Group>
      </MantineAppShell.Header>
      <MantineAppShell.Navbar p="md">
        <Text size="xs" c="dimmed" ff="monospace" mb="xs">{'< OVERVIEW />'}</Text>
        <NavLink label={user?.role === 'admin' ? 'Home' : 'Workshops'} onClick={() => navigate('/')} />
      </MantineAppShell.Navbar>
      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}
