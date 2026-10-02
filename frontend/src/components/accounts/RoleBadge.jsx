import { Badge } from '../ui/badge';

export default function RoleBadge({ role }) {
  const color = role === 'admin' ? 'bg-brutal-cyan' : 'bg-brutal-bg';
  return <Badge className={`${color} font-semibold uppercase`}>{role}</Badge>;
}
