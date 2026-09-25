import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useNavigate } from 'react-router-dom';
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
    <div className="flex flex-col gap-4">
      <SectionHeader>Class progress</SectionHeader>
      {workshops.map((w) => (
        <div key={w.id} onClick={() => navigate(`/workshops/${w.id}/review`)} className="cursor-pointer">
          <ProgressRail workshop={w} studentsProgress={progressByWorkshop[w.id]?.students || []} />
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Input
          placeholder="New workshop title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <Button onClick={createWorkshop}>New workshop</Button>
      </div>

      <div className="mt-6">
        <SectionHeader>Priority_</SectionHeader>
      </div>
      <PriorityFeed items={feed} />
    </div>
  );
}
