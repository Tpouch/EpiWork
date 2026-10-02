import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StepView from '../../components/StepView';
import { api } from '../../api';

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
  if (!active) return <p>Loading...</p>;

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
    <StepView
      step={active.step}
      status={active.status}
      helpRequested={active.helpRequested}
      answer={answer}
      onAnswerChange={setAnswer}
      onSubmit={submit}
      onRequestHelp={requestHelp}
    />
  );
}
