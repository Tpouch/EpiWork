import { useEffect, useState } from 'react';
import { Card, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function WorkshopList() {
  const [workshops, setWorkshops] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.listWorkshops().then(setWorkshops);
  }, []);

  return (
    <Stack>
      <Title order={2}>Workshops</Title>
      {workshops.map((w) => (
        <Card key={w.id} withBorder onClick={() => navigate(`/workshops/${w.id}`)} style={{ cursor: 'pointer' }}>
          <Text fw={600}>{w.title}</Text>
          <Text size="sm" c="dimmed">{w.description}</Text>
        </Card>
      ))}
    </Stack>
  );
}
