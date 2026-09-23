import { Group, Paper, Text, Tooltip } from '@mantine/core';
import { signalColors } from '../theme';

const STATUS_COLOR = {
  done: signalColors.done,
  pending_review: signalColors.awaitingReview,
  available: '#C7C8D1',
  locked: '#4A4A4A',
  unlocked: signalColors.done,
};

function dotColor(row) {
  if (row.helpRequested) return signalColors.needsHelp;
  return STATUS_COLOR[row.status] || '#4A4A4A';
}

export default function ProgressRail({ workshop, studentsProgress }) {
  const totalSteps = workshop.steps.length;
  return (
    <Paper withBorder p="sm" mb="sm">
      <Group justify="space-between" mb="xs">
        <Text fw={600}>{workshop.title}</Text>
        <Text size="xs" c="dimmed" ff="monospace">
          {studentsProgress.length} students · step 1-{totalSteps}
        </Text>
      </Group>
      <div style={{ position: 'relative', height: 20, background: '#242424', borderRadius: 3 }}>
        {studentsProgress.map(({ student, progress }) => {
          const currentIndex = progress.findIndex((r) => r.status !== 'done');
          const stepIndex = currentIndex === -1 ? totalSteps - 1 : currentIndex;
          const left = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 50;
          const row = progress[stepIndex];
          if (!row) return null;
          return (
            <Tooltip key={student.id} label={`${student.name} — step ${stepIndex + 1}`}>
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: `${left}%`,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: dotColor(row),
                  border: '2px solid #141414',
                  transform: 'translateX(-50%)',
                }}
              />
            </Tooltip>
          );
        })}
      </div>
    </Paper>
  );
}
