import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import AccountsTable from '../../components/accounts/AccountsTable';
import RoleFilter from '../../components/accounts/RoleFilter';
import NewAdminModal from '../../components/accounts/NewAdminModal';
import ResetPasswordModal from '../../components/accounts/ResetPasswordModal';
import DeleteAccountModal from '../../components/accounts/DeleteAccountModal';
import { api, currentUser } from '../../api';

function matches(account, query, role) {
  if (role !== 'all' && account.role !== role) return false;
  const needle = query.trim().toLowerCase();
  return !needle || `${account.name} ${account.email ?? ''}`.toLowerCase().includes(needle);
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function countLabel(accounts) {
  const admins = accounts.filter((a) => a.role === 'admin').length;
  return [plural(accounts.length, 'account'), plural(admins, 'admin'), plural(accounts.length - admins, 'student')].join(' · ');
}

export default function Accounts() {
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [dialog, setDialog] = useState(null);
  const meId = currentUser()?.id;

  function reload() {
    api
      .listAccounts()
      .then((list) => {
        setAccounts(list);
        setError('');
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    reload();
  }, []);

  function closeDialog(changed) {
    setDialog(null);
    if (changed) reload();
  }

  function clearFilters() {
    setQuery('');
    setRole('all');
  }

  const visible = accounts?.filter((account) => matches(account, query, role)) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-heading">Accounts</h2>
          {accounts && <p className="text-sm opacity-70">{countLabel(accounts)}</p>}
        </div>
        <Button onClick={() => setDialog({ kind: 'new' })}>
          <Plus aria-hidden="true" />
          New admin
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input
          aria-label="Search accounts"
          placeholder="Search name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <RoleFilter value={role} onChange={setRole} />
      </div>
      {error && <p role="alert" className="text-brutal-red">{error}</p>}
      {!accounts && !error && <p>Loading...</p>}
      {accounts && visible.length === 0 && (
        <p className="opacity-70">
          No account matches these filters.{' '}
          <button type="button" onClick={clearFilters} className="cursor-pointer underline underline-offset-2">
            Clear filters
          </button>
        </p>
      )}
      {visible.length > 0 && (
        <AccountsTable
          accounts={visible}
          meId={meId}
          onReset={(account) => setDialog({ kind: 'reset', account })}
          onDelete={(account) => setDialog({ kind: 'delete', account })}
        />
      )}
      {dialog?.kind === 'new' && <NewAdminModal onClose={closeDialog} />}
      {dialog?.kind === 'reset' && <ResetPasswordModal account={dialog.account} onClose={closeDialog} />}
      {dialog?.kind === 'delete' && <DeleteAccountModal account={dialog.account} onClose={closeDialog} />}
    </div>
  );
}
