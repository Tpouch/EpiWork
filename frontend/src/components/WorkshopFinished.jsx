import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StarDisplay } from './StarRating';
import { Button, buttonVariants } from './ui/button';

export default function WorkshopFinished({ workshopTitle, feedback, canRate, onRate }) {
  const canRateNow = !feedback && canRate;
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center border-3 border-brutal-line bg-brutal-green text-brutal-dark"
      >
        <Check className="size-7" />
      </span>
      <h2 className="text-2xl font-heading">You finished {workshopTitle}</h2>
      {feedback && (
        <p className="flex items-center gap-2 opacity-80">
          Thanks for your feedback: <StarDisplay value={feedback.rating} />
        </p>
      )}
      {canRateNow && <p className="opacity-70">You skipped the rating.</p>}
      <div className="flex flex-wrap justify-center gap-3">
        {canRateNow && <Button onClick={onRate}>Rate this workshop</Button>}
        <Link to="/my-workshops" className={buttonVariants({ variant: 'neutral' })}>Back to my workshops</Link>
      </div>
    </div>
  );
}
