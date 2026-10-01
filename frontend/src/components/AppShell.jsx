import { NavLink } from 'react-router-dom';
import { History, House, LayoutGrid, LogOut, Play, Users } from 'lucide-react';
import { api } from '../api';
import ThemeToggle from './ThemeToggle';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/workshops', label: 'Workshops', icon: LayoutGrid },
  { to: '/teach', label: 'Teach', icon: Play },
  { to: '/history', label: 'History', icon: History },
  { to: '/accounts', label: 'Accounts', icon: Users },
];

const STUDENT_NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/my-workshops', label: 'My workshops', icon: LayoutGrid },
];

function navItemClass({ isActive }) {
  return cn(
    'flex items-center gap-2 border-2 px-3 py-2 text-sm font-semibold uppercase tracking-wide',
    isActive ? 'border-brutal-line bg-brutal-accent text-brutal-dark shadow-brutal-sm' : 'border-transparent hover:border-brutal-line',
  );
}

export default function AppShell({ user, children }) {
  const items = user?.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;

  async function logout() {
    await api.logout();
    window.location.assign('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 border-b-2 border-brutal-line bg-brutal-bg">
        <h1 className="text-lg font-heading">{'{ EPIWORK }'}</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <NavLink
            to="/account"
            className="border-2 border-brutal-line bg-brutal-accent px-2 py-1 text-brutal-dark text-sm font-semibold uppercase tracking-wide shadow-brutal-sm"
          >
            {user?.name}
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1 text-sm uppercase tracking-wide cursor-pointer underline underline-offset-2"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col sm:flex-row">
        <nav
          aria-label="Main"
          className="flex gap-2 border-b-2 border-brutal-line p-3 sm:w-[200px] sm:shrink-0 sm:flex-col sm:border-b-0 sm:border-r-2 sm:p-4"
        >
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navItemClass}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 min-w-0 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
