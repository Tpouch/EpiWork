import { Paper, Stack, Text } from '@mantine/core';
import { signalColors } from '../theme';

export default function PriorityFeed({ items }) {
  return (
    <Stack gap={6}>
      {items.length === 0 && <Text c="dimmed">Nothing needs attention right now.</Text>}
      {items.map((item, i) => (
        <Paper
          key={i}
          p="xs"
          style={{
            borderLeft: `3px solid ${item.type === 'help' ? signalColors.needsHelp : signalColors.awaitingReview}`,
            background: '#242424',
          }}
        >
          <Text size="sm">
            <b>{item.student?.name}</b>{' '}
            {item.type === 'help' ? 'needs help' : 'awaiting review'} — {item.workshopTitle}, {item.stepTitle}
          </Text>
        </Paper>
      ))}
    </Stack>
  );
}
