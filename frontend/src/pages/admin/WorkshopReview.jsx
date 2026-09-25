import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { api } from '../../api';

export default function WorkshopReview() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  async function load() {
    setData(await api.workshopProgress(id));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!data) return <p>Loading...</p>;

  async function unlock(stepId, studentId) {
    await api.unlockStep(stepId, studentId);
    load();
  }

  async function resolveHelp(stepId, studentId) {
    await api.resolveHelp(stepId, studentId);
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-heading">Review</h2>
      {data.students.map(({ student, progress }) => (
        <Card key={student.id}>
          <CardContent>
            <p className="font-semibold">{student.name}</p>
            <div className="flex flex-col gap-1 mt-2">
              {progress.map((row) => (
                <div key={row.stepId} className="flex items-center justify-between">
                  <p className="text-sm">
                    {row.step.title} — {row.status}
                    {row.helpRequested ? ' · needs help' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    {row.status === 'pending_review' && (
                      <>
                        <Badge className="bg-brutal-cyan">{row.submittedAnswer || 'confirmed'}</Badge>
                        <Button size="sm" onClick={() => unlock(row.stepId, student.id)}>Unlock</Button>
                      </>
                    )}
                    {row.helpRequested && (
                      <Button
                        size="sm"
                        onClick={() => resolveHelp(row.stepId, student.id)}
                        className="bg-brutal-orange"
                      >
                        Resolve help
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
