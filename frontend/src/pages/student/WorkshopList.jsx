import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function WorkshopList() {
  const [workshops, setWorkshops] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.listWorkshops().then(setWorkshops);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-heading">Workshops</h2>
      {workshops.map((w) => (
        <Card
          key={w.id}
          onClick={() => navigate(`/workshops/${w.id}`)}
          className="cursor-pointer"
        >
          <CardContent>
            <p className="font-semibold">{w.title}</p>
            <p className="text-sm opacity-70">{w.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
