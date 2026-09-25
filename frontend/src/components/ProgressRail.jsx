import { Card, CardContent } from './ui/card';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import { signalColors } from '../theme';

const STATUS_COLOR = {
  done: signalColors.done,
  pending_review: signalColors.awaitingReview,
  available: '#171717',
  locked: '#8a8a8a',
  unlocked: signalColors.done,
};

function dotColor(row) {
  if (row.helpRequested) return signalColors.needsHelp;
  return STATUS_COLOR[row.status] || '#8a8a8a';
}

export default function ProgressRail({ workshop, studentsProgress }) {
  const totalSteps = workshop.steps.length;
  return (
    <Card className="mb-3">
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold">{workshop.title}</p>
          <p className="text-xs font-mono opacity-70">
            {studentsProgress.length} students · step 1-{totalSteps}
          </p>
        </div>
        <div className="relative h-5 bg-brutal-bg border-2 border-brutal-ink">
          <TooltipProvider>
            {studentsProgress.map(({ student, progress }) => {
              const currentIndex = progress.findIndex((r) => r.status !== 'done');
              const stepIndex = currentIndex === -1 ? totalSteps - 1 : currentIndex;
              const left = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 50;
              const row = progress[stepIndex];
              if (!row) return null;
              return (
                <Tooltip key={student.id}>
                  <TooltipTrigger
                    render={
                      <div
                        className="absolute top-[3px] w-3.5 h-3.5 rounded-full border-2 border-brutal-ink -translate-x-1/2"
                        style={{ left: `${left}%`, background: dotColor(row) }}
                      />
                    }
                  />
                  <TooltipContent>{`${student.name} — step ${stepIndex + 1}`}</TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
