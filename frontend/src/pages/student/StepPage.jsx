import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Grid, Group, Radio, Stack, Text, Textarea, Title } from '@mantine/core';
import { api } from '../../api';
import { signalColors } from '../../theme';

function canSubmitAnswer(questionType, answer) {
  if (questionType === 'text') return answer.trim().length > 0;
  if (questionType === 'multiple_choice') return !!answer;
  return true;
}

function CheckpointQuestion({ step, answer, setAnswer }) {
  if (step.questionType === 'multiple_choice') {
    const options = step.questionOptions ? JSON.parse(step.questionOptions) : [];
    return (
      <Radio.Group label={step.questionPrompt} value={answer} onChange={setAnswer}>
        <Stack gap="xs" mt="xs">
          {options.map((opt) => (
            <Radio key={opt} value={opt} label={opt} />
          ))}
        </Stack>
      </Radio.Group>
    );
  }
  if (step.questionType === 'confirm') {
    return <Text c="dimmed">{step.questionPrompt || 'Confirm you completed this step.'}</Text>;
  }
  return (
    <Textarea
      label={step.questionPrompt}
      value={answer}
      onChange={(e) => setAnswer(e.currentTarget.value)}
      autosize
      minRows={4}
    />
  );
}

function StepAnswer({ active, answer, setAnswer, submit }) {
  if (active.status === 'pending_review') {
    return <Text c="dimmed">Waiting for the admin to review your answer.</Text>;
  }
  if (!active.step.isCheckpoint) {
    return <Button onClick={submit}>Mark done, next step</Button>;
  }
  return (
    <>
      <CheckpointQuestion step={active.step} answer={answer} setAnswer={setAnswer} />
      <Button onClick={submit} disabled={!canSubmitAnswer(active.step.questionType, answer)}>Submit answer</Button>
    </>
  );
}

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

  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Title order={3}>{active.step.title}</Title>
        <Text mt="sm">{active.step.content}</Text>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Stack>
          <StepAnswer active={active} answer={answer} setAnswer={setAnswer} submit={submit} />
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
