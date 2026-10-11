import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './ui/button';

export default function CopyButton({ text, className }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="neutral" size="xs" onClick={copy} className={className}>
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}
