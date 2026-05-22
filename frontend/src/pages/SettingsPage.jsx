import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, resetSettings } from '../services/settingsService';
import { updateProfile, changePassword } from '../services/authService';
import { getPendingRequest } from '../services/subscriptionService';
import { LogOut, User, Plus, Globe, Crown, Lock, Eye, EyeOff, X, ChevronRight, Paintbrush, KeyRound, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

/* ── Presets ── */
const FONTS = [
  { id: 'Inter', label: 'CLEAN', family: 'Inter, sans-serif' },
  { id: 'Georgia', label: 'SERIF', family: 'Georgia, serif' },
  { id: 'Outfit', label: 'CONTEMPORARY', family: 'Outfit, sans-serif' },
  { id: 'Times New Roman', label: 'ELEGANT', family: '"Times New Roman", serif' },
  { id: 'IBM Plex Mono', label: 'ROUNDED', family: '"IBM Plex Mono", monospace' },
];
const BG_COLORS = ['#000000', '#1A237E', '#3E2723', '#1A1A1A', '#0D47A1', '#263238'];
const TEXT_COLORS = ['#FFFFFF', '#B0BEC5', '#FFC107', '#69F0AE', '#D1C4E9', '#000000'];

/* ── Accordion button ── */
function AccordionBtn({ icon: Icon, label, isOpen, onClick, description }) {
  return (
    <motion.button 
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${isOpen ? 'bg-zinc-800/60 border-zinc-700' : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
        }`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOpen ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'} transition-colors`}>
          <Icon size={16} />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-white">{label}</p>
          {description && <p className="text-[10px] text-zinc-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <ChevronRight size={16} className={`text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
    </motion.button>
  );
}

/* ── Color swatch row ── */
function ColorRow({ colors, active, onChange, settingKey }) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map(c => (
        <motion.button 
          key={c} 
          onClick={() => onChange(settingKey, c)}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className={`w-10 h-10 rounded-full border-2 transition-all ${active === c ? 'border-white scale-110 ring-2 ring-white/20' : 'border-zinc-800'
            }`} style={{ backgroundColor: c }} />
      ))}
      <div className="relative">
        <input type="color" value={active} onChange={e => onChange(settingKey, e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-600">
          <Plus size={14} />
        </div>
      </div>
    </div>
  );
}

/* ── Text input ── */
function Field({ label, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider ml-1">{label}</label>
      <input {...props}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none transition-colors" />
    </div>
  );
}

/* ═══════════════════════════════════════════ */
export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();

  /* ── Accordion state ── */
  const [openSection, setOpenSection] = useState(null); // 'display' | 'profile' | 'password'
  const toggle = (key) => setOpenSection(prev => prev === key ? null : key);

  /* ── Data state ── */
  const [ls, setLs] = useState(null);
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '',
  });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  /* ── Queries ── */
  const { data: settings, isLoading } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  useEffect(() => { if (settings) setLs(settings); }, [settings]);

  const { data: pendingReq } = useQuery({
    queryKey: ['subscription', 'pending'],
    queryFn: getPendingRequest,
    enabled: !!localStorage.getItem('token')
  });

  const saveMut = useMutation({
    mutationFn: d => updateSettings(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
  const profileMut = useMutation({
    mutationFn: d => updateProfile(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
  const resetMut = useMutation({
    mutationFn: resetSettings,
    onSuccess: d => { setLs(d); queryClient.invalidateQueries({ queryKey: ['settings'] }); },
  });

  const set = (k, v) => setLs(p => ({ ...p, [k]: v }));
  const saveAll = () => {
    const { id, userId, ...d } = ls;
    saveMut.mutate(d, {
      onSuccess: () => {
        setSaveMsg('Changes saved ✓');
        setTimeout(() => setSaveMsg(null), 2500);
      }
    });
    profileMut.mutate(profile);
  };
  const handlePwChange = async () => {
    setPwMsg(null);
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, t: 'Passwords do not match' });
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPwMsg({ ok: true, t: 'Password updated ✓' });
      setPw({ current: '', next: '', confirm: '' });
      setShowCurrentPw(false);
      setShowNewPw(false);
    } catch (e) {
      setPwMsg({ ok: false, t: e.response?.data?.error || 'Failed' });
    }
  };

  if (isLoading || !ls) return <div className="flex items-center justify-center h-screen text-zinc-500">Loading…</div>;

  return (
    <div className="max-w-lg mx-auto px-5 pt-2 pb-48">

      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-50 bg-black/90 backdrop-blur-lg py-4 -mx-5 px-5">
        <h1 className="text-lg font-bold text-white">Settings</h1>
      </div>

      {/* Live Preview */}
      <div className="mt-4 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
        <div className="px-8 py-10 transition-all duration-500"
          style={{ backgroundColor: ls.bgColor, fontFamily: ls.fontFamily, color: ls.textColor }}>
          <p className="text-[9px] font-black tracking-[0.4em] uppercase opacity-40 mb-3">VERSE 1</p>
          <p className="text-xl font-bold leading-snug">Worthy of every song we could ever sing</p>
        </div>
      </div>

      {/* ── Accordion Sections ── */}
      <div className="mt-8 space-y-3">

        {/* 1. Customize Display */}
        <div>
          <AccordionBtn icon={Paintbrush} label="Customize Display" description="Font, background & text color"
            isOpen={openSection === 'display'} onClick={() => toggle('display')} />
          <AnimatePresence>
            {openSection === 'display' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-8">
                  {/* Font */}
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Font</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {FONTS.map(f => (
                        <motion.button 
                          key={f.id} 
                          onClick={() => set('fontFamily', f.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl border text-left transition-all ${ls.fontFamily === f.id
                              ? 'border-white bg-zinc-800/80 text-white'
                              : 'border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-700'
                            }`}>
                          <p className="text-[8px] font-black tracking-[0.2em] opacity-50 mb-1">{f.label}</p>
                          <p className="text-sm font-semibold truncate" style={{ fontFamily: f.family }}>Worthy of every song</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  {/* Background */}
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Background</p>
                    <ColorRow colors={BG_COLORS} active={ls.bgColor} onChange={set} settingKey="bgColor" />
                  </div>
                  {/* Text Color */}
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Text Color</p>
                    <ColorRow colors={TEXT_COLORS} active={ls.textColor} onChange={set} settingKey="textColor" />
                  </div>
                  <button onClick={() => resetMut.mutate()}
                    className="text-[10px] font-bold text-zinc-600 hover:text-zinc-300 uppercase tracking-widest transition-colors">
                    Reset to defaults
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Edit Profile */}
        <div>
          <AccordionBtn icon={User} label="Edit Profile" description="Name & phone number"
            isOpen={openSection === 'profile'} onClick={() => toggle('profile')} />
          <AnimatePresence>
            {openSection === 'profile' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name" value={profile.firstName}
                      onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} />
                    <Field label="Last Name" value={profile.lastName}
                      onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} />
                  </div>
                  <Field label="Phone" type="tel" value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Change Password - Hidden for Google Users */}
        {user?.authProvider !== 'GOOGLE' && (
          <div>
            <AccordionBtn icon={KeyRound} label="Change Password" description="Update your login credentials"
              isOpen={openSection === 'password'} onClick={() => toggle('password')} />
            <AnimatePresence>
              {openSection === 'password' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
                    {pwMsg && (
                      <div className={`px-4 py-2.5 rounded-xl text-xs font-bold ${pwMsg.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>{pwMsg.t}</div>
                    )}
                    <div className="relative">
                      <Field label="Current Password" type={showCurrentPw ? 'text' : 'password'} value={pw.current}
                        onChange={e => setPw(p => ({ ...p, current: e.target.value }))} />
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 bottom-2.5 text-zinc-600 hover:text-zinc-400">
                        {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Field label="New Password" type={showNewPw ? 'text' : 'password'} value={pw.next}
                          onChange={e => setPw(p => ({ ...p, next: e.target.value }))} />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 bottom-2.5 text-zinc-600 hover:text-zinc-400">
                          {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <div className="relative">
                        <Field label="Confirm" type={showNewPw ? 'text' : 'password'} value={pw.confirm}
                          onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 bottom-2.5 text-zinc-600 hover:text-zinc-400">
                          {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <button onClick={handlePwChange} disabled={!pw.current || !pw.next}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                      Update Password
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Account Card ── */}
      <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Crown size={12} className="text-emerald-500" />
              {user?.plan} Plan
            </span>
            <span className="flex items-center gap-1.5 border-l border-zinc-800 pl-4">
              <Globe size={12} /> {user?.role}
            </span>
          </div>
          <button onClick={() => navigate('/pricing')}
            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
            {pendingReq ? 'Check Status' : (user?.plan === 'FREE' ? 'Upgrade Plan' : 'Show Plan')}
          </button>
        </div>
        <div className="flex items-center justify-between pt-4">
          <p className="text-[11px] text-zinc-500">{user?.email}</p>
          <button onClick={() => setShowLogoutConfirm(true)}
            className="px-4 py-2 bg-red-500/10 text-red-500 text-xs font-bold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1.5">
            <LogOut size={13} /> Log out
          </button>
        </div>
      </div>

      {/* ── Admin Link ── */}
      {user?.role === 'ADMIN' && (
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 w-full flex items-center justify-between p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-amber-500">Admin Control Panel</p>
              <p className="text-[10px] text-amber-600/60 font-bold uppercase tracking-wider">Manage Users & Approvals</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-amber-500/50 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* ── Toast ── */}
      {saveMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          {saveMsg}
        </div>
      )}

      {/* ── Floating Save ── */}
      {openSection !== null && (
        <div className="fixed bottom-24 lg:bottom-6 left-0 right-0 px-5 z-50 max-w-lg mx-auto animate-in slide-in-from-bottom-4 duration-300">
          <button onClick={saveAll} disabled={saveMut.isPending || profileMut.isPending}
            className="w-full bg-white text-black py-3.5 rounded-xl font-bold text-sm shadow-[0_8px_30px_rgba(255,255,255,0.15)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {saveMut.isPending || profileMut.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
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
  );
}
