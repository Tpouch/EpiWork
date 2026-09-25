import { useNavigate } from 'react-router-dom';
import { setCurrentUser } from '../api';

export default function AppShell({ user, children }) {
  const navigate = useNavigate();

  function logout() {
    setCurrentUser(null);
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 border-b-2 border-brutal-ink bg-brutal-bg">
        <h1 className="text-lg font-heading">{'{ EPIWORK }'}</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm uppercase tracking-wide">{user?.name?.toUpperCase()}</span>
          <button
            type="button"
            onClick={logout}
            className="text-sm uppercase tracking-wide cursor-pointer underline underline-offset-2"
          >
            Log out
          </button>
        </div>
      </header>
      <div className="flex flex-1">
        <nav className="w-[220px] shrink-0 border-r-2 border-brutal-ink p-4 hidden sm:block">
          <p className="text-xs font-mono uppercase mb-2 opacity-70">{'< OVERVIEW />'}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-left w-full px-3 py-2 border-2 border-brutal-ink shadow-brutal-sm bg-brutal-lime font-medium"
          >
            {user?.role === 'admin' ? 'Home' : 'Workshops'}
          </button>
        </nav>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
