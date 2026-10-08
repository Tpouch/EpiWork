import { useState } from 'react';
import { Flag } from 'lucide-react';
import Modal from './Modal';
import StarRating from './StarRating';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useAsyncAction } from '@/lib/useAsyncAction';

export default function FinishModal({ open, workshopTitle, awaitingReview, canRate, onSend, onClose }) {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const { busy, error, run } = useAsyncAction(onSend);

  async function send() {
    const saved = await run({ rating, comment });
    if (saved) onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Workshop finished!">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center border-2 border-brutal-line bg-brutal-green text-brutal-dark"
          >
            <Flag className="size-5" />
          </span>
          <p className="font-bold">Well done, you finished {workshopTitle}.</p>
        </div>
        {awaitingReview && (
          <p className="border-2 border-brutal-line bg-brutal-cyan px-2.5 py-1.5 text-sm text-brutal-dark">
            Your last answer is waiting for review.
          </p>
        )}
        {canRate ? (
          <>
            <div className="flex flex-col gap-1.5">
              <p id="finish-rating-label" className="text-sm font-semibold">How was this workshop?</p>
              <StarRating value={rating} onChange={setRating} labelledBy="finish-rating-label" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="finish-comment">
                Comment <span className="font-normal opacity-70">(optional)</span>
              </Label>
              <Textarea
                id="finish-comment"
                rows={3}
                maxLength={1000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What worked, what was confusing..."
              />
            </div>
            {error && <p role="alert" className="text-sm text-brutal-red">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="neutral" onClick={onClose}>Skip</Button>
              <Button onClick={send} disabled={!rating || busy}>Send</Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm opacity-70">Rating is open to students who joined the live session.</p>
            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
