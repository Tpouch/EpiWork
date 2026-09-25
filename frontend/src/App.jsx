import { Routes, Route, Navigate } from 'react-router-dom';
import { currentUser } from './api';
import Login from './pages/Login';
import AppShell from './components/AppShell';
import WorkshopList from './pages/student/WorkshopList';
import StepPage from './pages/student/StepPage';
import AdminHome from './pages/admin/AdminHome';
import WorkshopEditor from './pages/admin/WorkshopEditor';
import WorkshopReview from './pages/admin/WorkshopReview';
import Workshops from './pages/admin/Workshops';
import WorkshopDetail from './pages/admin/WorkshopDetail';

function RequireUser({ children }) {
  const user = currentUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const user = currentUser();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
                    <Route path="/workshops/:id/edit" element={<WorkshopEditor />} />
                    <Route path="/workshops/:id/review" element={<WorkshopReview />} />
                  </>
                ) : (
                  <>
                    <Route path="/" element={<WorkshopList />} />
                    <Route path="/workshops/:id" element={<StepPage />} />
                  </>
                )}
              </Routes>
            </AppShell>
          </RequireUser>
        }
      />
    </Routes>
  );
}
