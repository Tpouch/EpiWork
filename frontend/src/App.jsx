import { useLayoutEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { currentUser } from './api';
import { applyAccent } from './lib/accent';
import Login from './pages/Login';
import Account from './pages/Account';
import NotFound from './pages/NotFound';
import AppShell from './components/AppShell';
import StudentHome from './pages/student/StudentHome';
import MyWorkshops from './pages/student/MyWorkshops';
import StepPage from './pages/student/StepPage';
import AdminHome from './pages/admin/AdminHome';
import WorkshopEditor from './pages/admin/WorkshopEditor';
import WorkshopReview from './pages/admin/WorkshopReview';
import Workshops from './pages/admin/Workshops';
import WorkshopDetail from './pages/admin/WorkshopDetail';
import Teach from './pages/admin/Teach';
import History from './pages/admin/History';
import RunDetail from './pages/admin/RunDetail';
import Accounts from './pages/admin/Accounts';

function RequireUser({ children }) {
  const user = currentUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(currentUser);

  // Layout effect so the saved color is painted on the first frame, without a lime flash.
  useLayoutEffect(() => {
    applyAccent(user?.accentColor);
  }, [user?.accentColor]);
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/join" element={<Navigate to="/" replace />} />
      <Route
        path="/*"
        element={
          <RequireUser>
            <AppShell user={user}>
              <Routes>
                {user?.role === 'admin' ? (
                  <>
                    <Route path="/" element={<AdminHome />} />
                    <Route path="/workshops" element={<Workshops />} />
                    <Route path="/workshops/:id" element={<WorkshopDetail />} />
                    <Route path="/teach" element={<Teach />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/history/:runId" element={<RunDetail />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/workshops/:id/edit" element={<WorkshopEditor />} />
                    <Route path="/workshops/:id/review" element={<WorkshopReview />} />
                  </>
                ) : (
                  <>
                    <Route path="/" element={<StudentHome />} />
                    <Route path="/my-workshops" element={<MyWorkshops />} />
                    <Route path="/workshops/:id" element={<StepPage />} />
                  </>
                )}
                <Route path="/account" element={<Account user={user} onUserChange={setUser} />} />
                <Route
                  path="*"
                  element={<NotFound homeLabel="Back to home" />}
                />
              </Routes>
            </AppShell>
          </RequireUser>
        }
      />
    </Routes>
  );
}
