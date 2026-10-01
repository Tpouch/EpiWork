import { Card, CardContent } from './ui/card';
import { signalColors } from '../theme';

export default function PriorityFeed({ items }) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.length === 0 && <p className="opacity-70">Nothing needs attention right now.</p>}
      {items.map((item) => (
        <Card
          key={`${item.student?.id}-${item.workshopTitle}-${item.stepTitle}`}
          className="border-l-4"
          style={{ borderLeftColor: item.type === 'help' ? signalColors.needsHelp : signalColors.awaitingReview }}
        >
          <CardContent className="py-2">
            <p className="text-sm">
              <b>{item.student?.name}</b>{' '}
              {item.type === 'help' ? 'needs help' : 'awaiting review'} — {item.workshopTitle}, {item.stepTitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
