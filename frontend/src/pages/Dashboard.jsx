import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getServices } from '../services/serviceService';
import { getSongs, createSong } from '../services/songService';
import { 
  Play, LayoutList, Music, Radio, Users, Calendar, Lock, 
  ArrowRight, Sparkles, Loader2, AlertCircle, 
  FileUp, FileText 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { importSongFromPdf } from '../services/importService';
import NotificationTray from '../components/NotificationTray';

function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [showTrialPopup, setShowTrialPopup] = useState(false);

  // Check if this is a new user who should see the trial popup
  useEffect(() => {
    if (localStorage.getItem('showTrialPopup') === 'true') {
      setShowTrialPopup(true);
    }
  }, []);

  const dismissTrialPopup = () => {
    setShowTrialPopup(false);
    localStorage.removeItem('showTrialPopup');
  };

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: getServices
  });

  const { data: songs } = useQuery({
    queryKey: ['songs'],
    queryFn: getSongs
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeServices = services?.filter(s => s.status !== 'COMPLETED') || [];
  const futureServices = activeServices
    .filter((s) => {
      const serviceDate = new Date(s.date);
      serviceDate.setHours(0, 0, 0, 0);
      return serviceDate >= today;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextService = futureServices[0];

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

  const handlePdfImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsImporting(true);
    setImportError(null);
    
    try {
      const parsedData = await importSongFromPdf(file);
      
      await createSong({
        title: parsedData.title,
        artist: parsedData.artist,
        lyrics: parsedData.lyrics,
        chords: parsedData.chords || '',
        key: parsedData.key || 'C',
        category: 'Imported'
      });
      queryClient.invalidateQueries(['songs']);
      setTimeout(() => navigate('/songs'), 1500);
    } catch (error) {
      setImportError(error.response?.data?.error || 'Failed to parse PDF.');
    } finally {
      setIsImporting(false);
    }
  };

  // Calculate trial expiry date for display
  const trialExpiryDate = user?.planExpiresAt
    ? new Date(user.planExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-col min-h-full bg-black text-white p-6 md:p-12 pb-24 md:pb-12 space-y-12 animate-in fade-in duration-500">

      {/* Free Standard Trial Welcome Popup */}
      {showTrialPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="relative max-w-md w-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-white/10 rounded-[2.5rem] p-10 shadow-[0_0_80px_rgba(245,158,11,0.08)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            {/* Decorative glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              {/* Icon */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Sparkles size={36} className="text-white" />
              </div>

              {/* Heading */}
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Welcome to G{'>'}{'/'}{'\\'}{'\\'} V!</h2>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                  You have been gifted a <span className="text-amber-400 font-black">FREE Standard Plan</span> for <span className="text-white font-black">1 month</span>!
                </p>
              </div>

              {/* Features */}
              <div className="w-full space-y-3 text-left">
                {[
                  { icon: <LayoutList size={16} />, text: 'Service Planning & Scheduling' },
                  { icon: <Radio size={16} />, text: 'Live Worship Broadcasting' },
                  { icon: <Users size={16} />, text: 'Group Lineup Management' },
                  { icon: <Music size={16} />, text: 'Unlimited Song Library' },
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-2xl border border-white/[0.04]">
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">{feat.icon}</div>
                    <span className="text-sm font-bold text-zinc-300">{feat.text}</span>
                  </div>
                ))}
              </div>

              {/* Expiry */}
              {trialExpiryDate && (
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  Trial valid until {trialExpiryDate}
                </p>
              )}

              {/* CTA */}
              <button
                onClick={dismissTrialPopup}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all text-sm shadow-xl"
              >
                Got It — Let&apos;s Go!
              </button>
            </div>
          </div>
        </div>
      )}

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
        <NotificationTray />
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
            <p className={`font-bold text-sm ${
              nextService && new Date(nextService.date).setHours(0,0,0,0) === today.getTime() 
                ? 'text-amber-500/80' 
                : 'text-zinc-500'
            }`}>
              {user?.plan === 'FREE' 
                ? 'Unlock full planning & live tools' 
                : (nextService 
                    ? (new Date(nextService.date).setHours(0,0,0,0) === today.getTime() 
                        ? `Today: ${nextService.title}` 
                        : `Next: ${nextService.title}`)
                    : 'Ready for duty')}
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

      {/* Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: PDF Import */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group h-full flex flex-col">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText size={120} className="text-amber-500" />
          </div>
          <div className="relative z-10 space-y-6 flex-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                <FileUp size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Smart PDF Import</h3>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Upload Ultimate Guitar PDF export</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <div className={`w-full border-2 border-dashed border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all cursor-pointer group/upload ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isImporting ? (
                    <Loader2 size={32} className="text-amber-500 animate-spin" />
                  ) : (
                    <FileUp size={32} className="text-zinc-700 group-hover/upload:text-amber-500 transition-colors" />
                  )}
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-400">
                      {isImporting ? 'Parsing PDF...' : 'Click to Upload PDF'}
                    </p>
                    <p className="text-[10px] text-zinc-600 font-medium mt-1">Select your Ultimate Guitar export file</p>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePdfImport}
                    disabled={isImporting}
                  />
                </div>
              </label>

              {importError && (
                <div className="flex items-start gap-3 text-red-500 text-[10px] font-bold bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <p>{importError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
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

        {/* Groups */}
        <Link to="/groups" className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] hover:border-zinc-700 transition-all flex items-center justify-between group">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-zinc-800 rounded-2xl text-zinc-400 group-hover:bg-zinc-100 group-hover:text-black transition-all">
              <Users size={24} />
            </div>
            <div>
              <span className="text-xl font-black text-white uppercase tracking-tighter block mb-1">Ministry Groups</span>
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
                Connect your repertoire to actual services, schedule your groups, and manage live flows in real-time. Upgrade your ministry today.
              </p>
            </div>
            <Link to="/pricing" className="px-8 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-3">
              Upgrade Now <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {futureServices?.slice(0, 3).map(service => (
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
            {!futureServices?.length && <p className="text-center py-10 text-zinc-700 text-xs font-bold font-mono">NO SERVICE UPDATES</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
