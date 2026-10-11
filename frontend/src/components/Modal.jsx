import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZES = {
  default: 'left-1/2 top-1/2 w-[min(420px,calc(100vw-32px))] max-h-[calc(100dvh-32px)] -translate-x-1/2 -translate-y-1/2',
  wide: 'left-1/2 top-1/2 w-[min(580px,calc(100vw-32px))] max-h-[calc(100dvh-32px)] -translate-x-1/2 -translate-y-1/2',
  full: 'inset-4',
};

export default function Modal({ open, onClose, title, children, size = 'default' }) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-brutal-dark/55" />
        <Dialog.Popup
          className={cn('fixed z-50 flex flex-col border-3 border-brutal-line bg-brutal-bg shadow-brutal-lg', SIZES[size])}
        >
          <div className="flex items-center justify-between border-b-3 border-brutal-line px-4 py-3">
            <Dialog.Title className="font-heading text-lg uppercase">{title}</Dialog.Title>
            <Dialog.Close aria-label="Close" className="cursor-pointer p-1">
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
