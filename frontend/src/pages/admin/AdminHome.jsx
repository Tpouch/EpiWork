import { useEffect, useState } from 'react';
import { Button, Group, Stack, TextInput } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import SectionHeader from '../../components/SectionHeader';
import ProgressRail from '../../components/ProgressRail';
import PriorityFeed from '../../components/PriorityFeed';

export default function AdminHome() {
  const [workshops, setWorkshops] = useState([]);
  const [progressByWorkshop, setProgressByWorkshop] = useState({});
  const [feed, setFeed] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  async function load() {
    const ws = await api.listWorkshops();
    setWorkshops(ws);
    const entries = await Promise.all(ws.map((w) => api.workshopProgress(w.id)));
    setProgressByWorkshop(Object.fromEntries(ws.map((w, i) => [w.id, entries[i]])));
    setFeed(await api.adminFeed());
  }

  useEffect(() => {
    load();
  }, []);

  async function createWorkshop() {
    if (!newTitle.trim()) return;
    const w = await api.createWorkshop({ title: newTitle, description: '' });
    setNewTitle('');
    navigate(`/workshops/${w.id}/edit`);
  }

  return (
    <Stack>
      <SectionHeader>Class progress</SectionHeader>
      {workshops.map((w) => (
        <Link key={w.id} to={`/workshops/${w.id}/review`} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
          <ProgressRail workshop={w} studentsProgress={progressByWorkshop[w.id]?.students || []} />
        </Link>
      ))}

      <Group>
        <TextInput
          placeholder="New workshop title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.currentTarget.value)}
        />
        <Button onClick={createWorkshop}>New workshop</Button>
      </Group>

      <div style={{ marginTop: 24 }}>
        <SectionHeader>Priority_</SectionHeader>
      </div>
      <PriorityFeed items={feed} />
    </Stack>
  );
}
