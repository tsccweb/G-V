import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Music, LayoutDashboard, Calendar, Users, Settings, LogOut, Menu, X, Lock, LayoutList, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';

function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Songs', path: '/songs', icon: Music },
    { name: 'Services', path: '/services', icon: Calendar, isPremium: true },
    { name: 'Team', path: '/team', icon: Users, isPremium: true },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden bg-black text-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
            {'G>/\\V'}
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const isLocked = item.isPremium && user?.plan === 'FREE';

            return (
              <Link
                key={item.name}
                to={isLocked ? '/pricing' : item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${isActive
                    ? 'bg-white text-black shadow-lg shadow-white/5'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </div>
                {isLocked && <Lock size={14} className="text-zinc-500 group-hover:text-emerald-400 transition-colors" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.plan} Plan</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Link
              to="/pricing"
              className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all"
            >
              <LayoutList size={20} />
              <span className="font-medium">Subscription Plan</span>
            </Link>
            
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400/80 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] relative bg-black">
        {/* Desktop Header/Padding could go here if needed, but keeping it clean */}

        <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Navigation - Visible on phones AND tablets when sidebar is hidden */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-zinc-900 pb-safe pb-2">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              const isLocked = item.isPremium && user?.plan === 'FREE';

              return (
                <Link
                  key={item.name}
                  to={isLocked ? '/pricing' : item.path}
                  className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                    } ${isLocked ? 'opacity-40' : ''}`}
                >
                  <div className="relative">
                    <Icon size={isActive ? 22 : 20} className={isActive ? 'animate-in zoom-in duration-200' : ''} />
                    {isLocked && (
                      <div className="absolute -top-1 -right-1 bg-black rounded-full p-0.5">
                        <Lock size={8} className="text-zinc-500" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Sign Out?</h3>
                <p className="text-zinc-500 text-sm mt-2">Are you sure you want to log out of your session?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-6 py-3 rounded-2xl border border-zinc-800 text-zinc-400 font-bold hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-500/10 transition-all"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

export default Layout;
