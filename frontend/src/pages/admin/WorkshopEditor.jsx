import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Checkbox, Group, Paper, Select, Stack, Text, TextInput, Textarea, Title } from '@mantine/core';
import { api } from '../../api';

const EMPTY_STEP = { title: '', content: '', isCheckpoint: false, questionType: '', questionPrompt: '', questionOptions: '' };

export default function WorkshopEditor() {
  const { id } = useParams();
  const [workshop, setWorkshop] = useState(null);
  const [form, setForm] = useState(EMPTY_STEP);

  async function load() {
    const workshops = await api.listWorkshops();
    setWorkshop(workshops.find((w) => String(w.id) === id));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function addStep() {
    const payload = {
      title: form.title,
      content: form.content,
      isCheckpoint: form.isCheckpoint,
      questionType: form.isCheckpoint ? form.questionType || 'confirm' : null,
      questionOptions:
        form.isCheckpoint && form.questionType === 'multiple_choice'
          ? form.questionOptions.split(',').map((s) => s.trim()).filter(Boolean)
          : null,
      questionPrompt: form.isCheckpoint ? form.questionPrompt : null,
    };
    await api.createStep(id, payload);
    setForm(EMPTY_STEP);
    load();
  }

  async function removeStep(stepId) {
    await api.deleteStep(stepId);
    load();
  }

  if (!workshop) return <Text>Loading...</Text>;

  return (
    <Stack>
      <Title order={2}>{workshop.title}</Title>
      <Stack gap="xs">
        {workshop.steps.map((s) => (
          <Paper key={s.id} withBorder p="sm">
            <Group justify="space-between">
              <div>
                <Text fw={600}>
                  {s.order}. {s.title}{s.isCheckpoint ? ' (checkpoint)' : ''}
                </Text>
                <Text size="sm" c="dimmed">{s.content}</Text>
              </div>
              <Button color="red" variant="subtle" onClick={() => removeStep(s.id)}>Remove</Button>
            </Group>
          </Paper>
        ))}
      </Stack>

      <Title order={4} mt="md">Add a step</Title>
      <TextInput label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.currentTarget.value })} />
      <Textarea label="Subject / instructions" value={form.content} onChange={(e) => setForm({ ...form, content: e.currentTarget.value })} />
      <Checkbox
        label="This is a checkpoint (needs admin review)"
        checked={form.isCheckpoint}
        onChange={(e) => setForm({ ...form, isCheckpoint: e.currentTarget.checked })}
      />
      {form.isCheckpoint && (
        <>
          <Select
            label="Question type"
            data={[
              { value: 'text', label: 'Free text' },
              { value: 'multiple_choice', label: 'Multiple choice' },
              { value: 'confirm', label: 'Simple confirmation' },
            ]}
            value={form.questionType}
            onChange={(v) => setForm({ ...form, questionType: v })}
          />
          <TextInput
            label="Question prompt"
            value={form.questionPrompt}
            onChange={(e) => setForm({ ...form, questionPrompt: e.currentTarget.value })}
          />
          {form.questionType === 'multiple_choice' && (
            <TextInput
              label="Options (comma-separated)"
              value={form.questionOptions}
              onChange={(e) => setForm({ ...form, questionOptions: e.currentTarget.value })}
            />
          )}
        </>
      )}
      <Button onClick={addStep} disabled={!form.title.trim()}>Add step</Button>
    </Stack>
  );
}
