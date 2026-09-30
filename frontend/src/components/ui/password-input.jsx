import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './input';

export function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-11" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
