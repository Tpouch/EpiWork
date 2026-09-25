import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-brutal-ink/55" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 border-3 border-brutal-ink bg-brutal-bg shadow-brutal-lg">
          <div className="flex items-center justify-between border-b-3 border-brutal-ink px-4 py-3">
            <Dialog.Title className="font-heading text-lg uppercase">{title}</Dialog.Title>
            <Dialog.Close aria-label="Close" className="cursor-pointer p-1">
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="p-4">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
