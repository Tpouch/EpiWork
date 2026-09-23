import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
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

  if (!data) return <Text>Loading...</Text>;

  async function unlock(stepId, studentId) {
    await api.unlockStep(stepId, studentId);
    load();
  }

  async function resolveHelp(stepId, studentId) {
    await api.resolveHelp(stepId, studentId);
    load();
  }

  return (
    <Stack>
      <Title order={2}>Review</Title>
      {data.students.map(({ student, progress }) => (
        <Paper key={student.id} withBorder p="sm">
          <Text fw={600}>{student.name}</Text>
          <Stack gap={4} mt="xs">
            {progress.map((row) => (
              <Group key={row.stepId} justify="space-between">
                <Text size="sm">
                  {row.step.title} — {row.status}
                  {row.helpRequested ? ' · needs help' : ''}
                </Text>
                <Group gap="xs">
                  {row.status === 'pending_review' && (
                    <>
                      <Badge color="cyan">{row.submittedAnswer || 'confirmed'}</Badge>
                      <Button size="xs" onClick={() => unlock(row.stepId, student.id)}>Unlock</Button>
                    </>
                  )}
                  {row.helpRequested && (
                    <Button size="xs" color="orange" onClick={() => resolveHelp(row.stepId, student.id)}>
                      Resolve help
                    </Button>
                  )}
                </Group>
              </Group>
            ))}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
