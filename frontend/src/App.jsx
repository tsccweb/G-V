import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import SongList from './pages/SongList';
import SongDetail from './pages/SongDetail';
import SongForm from './pages/SongForm';
import Pricing from './pages/Pricing';
import ServiceList from './pages/ServiceList';
import ServicePlanner from './pages/ServicePlanner';
import ServiceForm from './pages/ServiceForm';
import LiveWorshipMode from './pages/LiveWorshipMode';
import GroupInvitations from './pages/GroupInvitations';
import Dashboard from './pages/Dashboard';
import JoinSession from './pages/JoinSession';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import GroupManagement from './pages/GroupManagement';
import Layout from './components/Layout';
import InstallPrompt from './components/InstallPrompt';
import { useAppBadge } from './hooks/useAppBadge';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

function App() {
  const { checkAuth, user, isLoading } = useAuthStore();
  
  // Initialize App Icon Badging
  useAppBadge(!!user);

  useEffect(() => {
    checkAuth();
    if (useAuthStore.getState().theme === 'light') {
      document.documentElement.classList.add('light-theme');
    }

    // Poll for real-time authentication & plan updates silently every 5 seconds
    const interval = setInterval(() => checkAuth(true), 5000);
    return () => clearInterval(interval);
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-600"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-black text-white">
          <InstallPrompt />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
            <Route path="/join" element={<JoinSession />} />
            <Route path="/live/:id" element={<LiveWorshipMode />} />

            {/* Protected Routes */}
            <Route path="/" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />

            {/* Songs */}
            <Route path="/songs" element={user ? <Layout><SongList /></Layout> : <Navigate to="/login" />} />
            <Route path="/songs/new" element={user ? <Layout><SongForm /></Layout> : <Navigate to="/login" />} />
            <Route path="/songs/:id" element={user ? <Layout><SongDetail /></Layout> : <Navigate to="/login" />} />
            <Route path="/songs/:id/edit" element={user ? <Layout><SongForm /></Layout> : <Navigate to="/login" />} />

            {/* Services (Pastor Flow) */}
            <Route path="/services" element={user && user.plan !== 'FREE' ? <Layout><ServiceList /></Layout> : <Navigate to="/pricing" />} />
            <Route path="/services/new" element={user && user.plan !== 'FREE' ? <Layout><ServiceForm /></Layout> : <Navigate to="/pricing" />} />
            <Route path="/services/:id" element={user && user.plan !== 'FREE' ? <Layout><ServicePlanner /></Layout> : <Navigate to="/pricing" />} />

            {/* Live */}
            <Route path="/services/:id/live" element={user && user.plan !== 'FREE' ? <LiveWorshipMode /> : <Navigate to="/pricing" />} />

            {/* Groups & Settings */}
            <Route path="/groups/lineup" element={user && user.plan !== 'FREE' ? <Layout><GroupInvitations /></Layout> : <Navigate to="/pricing" />} />
            <Route path="/groups" element={user && user.plan !== 'FREE' ? <Layout><GroupManagement /></Layout> : <Navigate to="/pricing" />} />
            <Route path="/settings" element={user ? <Layout><SettingsPage /></Layout> : <Navigate to="/login" />} />
            <Route path="/pricing" element={user ? <Layout><Pricing /></Layout> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.role === 'ADMIN' ? <Layout><AdminDashboard /></Layout> : <Navigate to="/" />} />
          </Routes>
          <Toaster 
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#18181b', // zinc-900
                color: '#fff',
                borderRadius: '1rem',
                border: '1px solid #27272a', // zinc-800
              }
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
