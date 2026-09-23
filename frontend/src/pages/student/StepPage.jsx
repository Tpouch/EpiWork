import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Grid, Group, Radio, Stack, Text, Textarea, Title } from '@mantine/core';
import { api } from '../../api';
import { signalColors } from '../../theme';

export default function StepPage() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [activeStepId, setActiveStepId] = useState(null);
  const [answer, setAnswer] = useState('');

  async function load() {
    const data = await api.myWorkshopProgress(id);
    setRows(data);
    const firstActionable = data.find((r) => r.status === 'available' || r.status === 'pending_review');
    setActiveStepId(firstActionable ? firstActionable.stepId : data[data.length - 1]?.stepId);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const active = rows.find((r) => r.stepId === activeStepId);
  if (!active) return <Text>Loading...</Text>;

  async function submit() {
    await api.submitStep(active.stepId, answer);
    setAnswer('');
    load();
  }

  async function requestHelp() {
    await api.requestHelp(active.stepId);
    load();
  }

  const options = active.step.questionOptions ? JSON.parse(active.step.questionOptions) : [];
  const canSubmit =
    active.step.questionType === 'text' ? answer.trim().length > 0 :
    active.step.questionType === 'multiple_choice' ? !!answer :
    true;

  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Title order={3}>{active.step.title}</Title>
        <Text mt="sm">{active.step.content}</Text>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Stack>
          {active.status === 'pending_review' ? (
            <Text c="dimmed">Waiting for the admin to review your answer.</Text>
          ) : active.step.isCheckpoint ? (
            <>
              {active.step.questionType === 'multiple_choice' ? (
                <Radio.Group label={active.step.questionPrompt} value={answer} onChange={setAnswer}>
                  <Stack gap="xs" mt="xs">
                    {options.map((opt) => (
                      <Radio key={opt} value={opt} label={opt} />
                    ))}
                  </Stack>
                </Radio.Group>
              ) : active.step.questionType === 'confirm' ? (
                <Text c="dimmed">{active.step.questionPrompt || 'Confirm you completed this step.'}</Text>
              ) : (
                <Textarea
                  label={active.step.questionPrompt}
                  value={answer}
                  onChange={(e) => setAnswer(e.currentTarget.value)}
                  autosize
                  minRows={4}
                />
              )}
              <Button onClick={submit} disabled={!canSubmit}>Submit answer</Button>
            </>
          ) : (
            <Button onClick={submit}>Mark done, next step</Button>
          )}
          <Group>
            <Button
              variant="outline"
              styles={{ root: { borderColor: signalColors.needsHelp, color: signalColors.needsHelpText } }}
              onClick={requestHelp}
              disabled={active.helpRequested}
            >
              {active.helpRequested ? 'Help requested' : 'I need help'}
            </Button>
          </Group>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
