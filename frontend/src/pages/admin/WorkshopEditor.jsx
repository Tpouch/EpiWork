import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { api } from '../../api';

const EMPTY_STEP = { title: '', content: '', isCheckpoint: false, questionType: '', questionPrompt: '', questionOptions: '' };

const QUESTION_TYPES = [
  { value: 'text', label: 'Free text' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'confirm', label: 'Simple confirmation' },
];

const QUESTION_TYPE_ITEMS = Object.fromEntries(QUESTION_TYPES.map((o) => [o.value, o.label]));

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

  if (!workshop) return <p>Loading...</p>;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-heading">{workshop.title}</h2>
      <div className="flex flex-col gap-2">
        {workshop.steps.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {s.order}. {s.title}{s.isCheckpoint ? ' (checkpoint)' : ''}
                </p>
                <p className="text-sm opacity-70">{s.content}</p>
              </div>
              <Button variant="neutral" className="text-brutal-red border-brutal-red" onClick={() => removeStep(s.id)}>
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <h4 className="text-lg font-heading mt-4">Add a step</h4>
      <div className="flex flex-col gap-1">
        <Label htmlFor="step-title">Title</Label>
        <Input id="step-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="step-content">Subject / instructions</Label>
        <Textarea id="step-content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="step-checkpoint"
          checked={form.isCheckpoint}
          onCheckedChange={(checked) => setForm({ ...form, isCheckpoint: checked === true })}
        />
        <Label htmlFor="step-checkpoint">This is a checkpoint (needs admin review)</Label>
      </div>
      {form.isCheckpoint && (
        <>
          <div className="flex flex-col gap-1">
            <Label>Question type</Label>
            <Select items={QUESTION_TYPE_ITEMS} value={form.questionType} onValueChange={(v) => setForm({ ...form, questionType: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a question type" />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="step-prompt">Question prompt</Label>
            <Input
              id="step-prompt"
              value={form.questionPrompt}
              onChange={(e) => setForm({ ...form, questionPrompt: e.target.value })}
            />
          </div>
          {form.questionType === 'multiple_choice' && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="step-options">Options (comma-separated)</Label>
              <Input
                id="step-options"
                value={form.questionOptions}
                onChange={(e) => setForm({ ...form, questionOptions: e.target.value })}
              />
            </div>
          )}
        </>
      )}
      <Button onClick={addStep} disabled={!form.title.trim()}>Add step</Button>
    </div>
  );
}
