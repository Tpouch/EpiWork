import { Group, Title } from '@mantine/core';
import { signalColors } from '../theme';

export default function SectionHeader({ children }) {
  return (
    <Group gap="xs" align="center">
      <div style={{ width: 4, height: 16, background: signalColors.sectionBar, borderRadius: 2 }} />
      <Title order={3}>{children}</Title>
    </Group>
  );
}
