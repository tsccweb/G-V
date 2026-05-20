import { useQuery } from '@tanstack/react-query';
import { getServices } from '../services/serviceService';
import { getSongs } from '../services/songService';
import { Play, Settings, Plus, LayoutList, Music, Radio, Users, Calendar, Lock, ArrowRight, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function Dashboard() {
  const { user, theme, toggleTheme } = useAuthStore();
  const navigate = useNavigate();

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: getServices
  });

  const { data: songs } = useQuery({
    queryKey: ['songs'],
    queryFn: getSongs
  });

  const nextService = services?.find(s => new Date(s.date) >= new Date());

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).toUpperCase();

  const handleStartSession = () => {
    if (user?.plan === 'FREE') {
      navigate('/pricing');
      return;
    }
    if (nextService) {
      navigate(`/services/${nextService.id}`);
    } else {
      navigate('/services');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-black text-white p-6 md:p-12 pb-24 md:pb-12 space-y-12 animate-in fade-in duration-500">

      {/* Top Header */}
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] md:text-xs font-bold text-zinc-500 tracking-wider">
            {formattedDate}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 w-6">
              <div className="h-1 bg-white rounded-full w-full"></div>
              <div className="h-1 bg-white rounded-full w-4"></div>
              <div className="h-1 bg-white rounded-full w-5"></div>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{'G>/\\V'}</h1>
          </div>
        </div>
      </header>

      {/* Hero Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={handleStartSession}
          className={`relative overflow-hidden group p-8 rounded-[2.5rem] flex flex-col justify-between items-start text-left hover:scale-[0.98] transition-all shadow-2xl active:scale-[0.95] min-h-[240px] ${user?.plan === 'FREE' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white text-black shadow-white/10'
            }`}
        >
          <div className={`p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform ${user?.plan === 'FREE' ? 'bg-zinc-800 text-zinc-600' : 'bg-black text-white'
            }`}>
            {user?.plan === 'FREE' ? <Lock size={32} /> : <Play size={32} className="fill-white" />}
          </div>
          <div>
            <h2 className={`text-3xl font-black tracking-tighter uppercase mb-2 ${user?.plan === 'FREE' ? 'text-zinc-600' : 'text-black'}`}>
              {user?.plan === 'FREE' ? 'Go Premium' : 'Start Worship'}
            </h2>
            <p className="text-zinc-500 font-bold text-sm">
              {user?.plan === 'FREE' ? 'Unlock full planning & live tools' : (nextService ? `Next: ${nextService.title}` : 'Ready for duty')}
            </p>
          </div>
        </button>

        <Link
          to="/join"
          className="relative overflow-hidden group bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] flex flex-col justify-between items-start text-left hover:border-zinc-500 transition-all shadow-2xl active:scale-[0.95] min-h-[240px]"
        >
          <div className="p-4 bg-zinc-800 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
            <Radio size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase mb-2 text-white">Join Live</h2>
            <p className="text-zinc-600 font-bold text-sm">Follow the leader with a code</p>
          </div>
        </Link>
      </div>

      {/* Management Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Songs */}
        <Link to="/songs" className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] hover:border-zinc-700 transition-all flex items-center justify-between group">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-zinc-800 rounded-2xl text-zinc-400 group-hover:bg-zinc-100 group-hover:text-black transition-all">
              <Music size={24} />
            </div>
            <div>
              <span className="text-xl font-black text-white uppercase tracking-tighter block mb-1">Song Library</span>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{songs?.length || 0} TOTAL SONGS</p>
            </div>
          </div>
          <ArrowRight className="text-zinc-700 group-hover:text-white transition-colors" />
        </Link>

        {/* Team */}
        <Link to="/team" className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] hover:border-zinc-700 transition-all flex items-center justify-between group">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-zinc-800 rounded-2xl text-zinc-400 group-hover:bg-zinc-100 group-hover:text-black transition-all">
              <Users size={24} />
            </div>
            <div>
              <span className="text-xl font-black text-white uppercase tracking-tighter block mb-1">Ministry Team</span>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">CONNECT & COLLABORATE</p>
            </div>
          </div>
          <ArrowRight className="text-zinc-700 group-hover:text-white transition-colors" />
        </Link>
      </div>

      {/* Upcoming Services or CTA */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-black text-zinc-500 uppercase tracking-widest">
            {user?.plan === 'FREE' ? 'Ministry Pro Features' : 'Upcoming Services'}
          </h2>
          {user?.plan !== 'FREE' && (
            <Link to="/services" className="text-xs font-bold text-zinc-700 hover:text-white transition-colors">VIEW ALL</Link>
          )}
        </div>

        {user?.plan === 'FREE' ? (
          <div className="bg-gradient-to-br from-emerald-500/5 via-zinc-900/50 to-emerald-500/5 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
              <h3 className="text-2xl font-black text-white italic mb-2 tracking-tight">Unlock Service Planning</h3>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                Connect your repertoire to actual services, schedule your team, and manage live flows in real-time. Upgrade your ministry today.
              </p>
            </div>
            <Link to="/pricing" className="px-8 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-3">
              Upgrade Now <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {services?.slice(0, 3).map(service => (
              <Link key={service.id} to={`/services/${service.id}`} className="group flex items-center gap-4 p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-600 transition-all">
                <div className="w-12 h-12 bg-zinc-950 rounded-xl flex flex-col items-center justify-center border border-zinc-800">
                  <span className="text-[10px] font-black text-white">{new Date(service.date).toLocaleDateString('en-US', { day: '2-digit' })}</span>
                  <span className="text-[8px] font-black text-zinc-500 uppercase">{new Date(service.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white truncate text-sm">{service.title}</h4>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{service.type || 'SUNDAY SERVICE'}</p>
                </div>
                <Calendar size={16} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              </Link>
            ))}
            {!services?.length && <p className="text-center py-10 text-zinc-700 text-xs font-bold font-mono">NO SERVICE UPDATES</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
