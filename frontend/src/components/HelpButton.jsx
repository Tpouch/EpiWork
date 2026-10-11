import { LifeBuoy } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export default function HelpButton({ requested, disabled, onClick }) {
  return (
    <Button
      variant="neutral"
      onClick={onClick}
      disabled={disabled || requested}
      className={cn(
        'border-brutal-orange text-brutal-ink',
        requested && 'border-brutal-line bg-brutal-orange text-brutal-dark disabled:opacity-100 data-disabled:opacity-100',
      )}
    >
      <LifeBuoy aria-hidden="true" />
      {requested ? 'Help requested' : 'I need help'}
    </Button>
  );
}
