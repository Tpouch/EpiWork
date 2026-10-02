import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import RoleBadge from './RoleBadge';

export default function AccountsTable({ accounts, meId, onReset, onDelete }) {
  return (
    <div className="overflow-x-auto border-2 border-brutal-ink shadow-brutal">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-brutal-ink text-left text-xs uppercase tracking-wide">
            <th scope="col" className="p-3">Name</th>
            <th scope="col" className="p-3">Email</th>
            <th scope="col" className="p-3">Role</th>
            <th scope="col" className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id} className="border-b border-brutal-ink/20 last:border-b-0">
              <td className="p-3 font-semibold">
                {account.name}
                {account.id === meId && <Badge className="ml-2 bg-brutal-lime font-semibold uppercase">You</Badge>}
                {account.isProtected && (
                  <Badge className="ml-2 bg-brutal-bg font-semibold uppercase">
                    <Lock aria-hidden="true" />
                    Base admin
                  </Badge>
                )}
              </td>
              <td className="p-3">{account.email ?? '—'}</td>
              <td className="p-3"><RoleBadge role={account.role} /></td>
              <td className="p-3">
                {account.id === meId ? (
                  <div className="text-right">
                    <Link to="/account" className="underline underline-offset-2">Edit in My account</Link>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="neutral" onClick={() => onReset(account)}>Reset password</Button>
                    {!account.isProtected && (
                      <Button size="sm" variant="danger" onClick={() => onDelete(account)} aria-label={`Delete ${account.name}`}>
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
