import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Mail, Check, X, UserPlus, Clock, Users, Shield, 
  Music, Mic, Star, Headphones, Monitor, Trash2, Send, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { getServices, inviteToLineup } from '../services/serviceService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const roleIcons = {
  MEMBER: <Users size={16} />,
  MUSICIAN: <Music size={16} />,
  VOCALIST: <Mic size={16} />,
  WORSHIP_LEADER: <Star size={16} />,
  MEDIA_TEAM: <Monitor size={16} />,
  SOUND_TEAM: <Headphones size={16} />,
};

function TeamLineup() {
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [inviteMsg, setInviteMsg] = useState(null);
  const [expandedServices, setExpandedServices] = useState([]);

  const toggleService = (id) => {
    setExpandedServices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const { data: invitations, isLoading: isInvitesLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/services/lineup/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
    enabled: !!token
  });

  const ownedServices = services?.filter((service) => service.userId === user?.id) || [];

  useEffect(() => {
    if (!selectedServiceId && ownedServices.length > 0) {
      setSelectedServiceId(ownedServices[0].id);
    }
  }, [ownedServices, selectedServiceId]);

  const inviteMutation = useMutation({
    mutationFn: (data) => inviteToLineup(data),
    onSuccess: () => {
      setInviteMsg({ ok: true, t: 'Invitation sent successfully' });
      setTimeout(() => setInviteMsg(null), 3000);
      setInviteEmail('');
      setInviteRole('MEMBER');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error) => {
      setInviteMsg({ ok: false, t: error.response?.data?.error || 'Failed to send invite' });
    }
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axios.put(`${API_URL}/services/lineup/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
    }
  });

  const handleInviteSubmit = () => {
    if (!inviteEmail || !selectedServiceId) {
      setInviteMsg({ ok: false, t: 'Please select a service and enter an email.' });
      return;
    }
    inviteMutation.mutate({ serviceId: selectedServiceId, email: inviteEmail, role: inviteRole });
  };

  if (isInvitesLoading || isServicesLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
          Team & <span className="text-zinc-500">Invitations</span>
        </h1>
        <p className="text-zinc-500 max-w-xl">
          Manage your worship ministry team, send invitations, and track member status across your services.
        </p>
      </motion.div>

      {/* Invitations Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <Mail size={14} className="text-emerald-500" />
            Pending Your Response
          </h2>
          <span className="px-2 py-1 bg-zinc-900 rounded-lg text-[10px] font-bold text-zinc-500">
            {invitations?.length || 0} Total
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {invitations?.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {invitations.map((invite) => (
                <motion.div
                  key={invite.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-[2rem] hover:border-zinc-700/50 transition-all duration-500"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <Clock size={28} className="text-zinc-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{invite.serviceTitle}</h3>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full border border-emerald-500/20">
                          Invite
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-lg border border-zinc-800/50">
                          <span className="text-zinc-500">{roleIcons[invite.role] || <Users size={14}/>}</span>
                          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">{invite.role}</span>
                        </div>
                        <span className="text-xs text-zinc-500 italic">by {invite.sender}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4 md:mt-0">
                    <button
                      onClick={() => respondMutation.mutate({ id: invite.id, status: 'DECLINED' })}
                      className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-500 font-bold hover:text-red-400 hover:border-red-400/30 transition-all active:scale-95"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => respondMutation.mutate({ id: invite.id, status: 'ACCEPTED' })}
                      className="flex-1 md:flex-none px-8 py-3 rounded-2xl bg-white text-black font-black hover:bg-zinc-200 shadow-xl shadow-white/5 transition-all active:scale-95 translate-y-[-2px] hover:translate-y-[-4px]"
                    >
                      Accept Invite
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center bg-zinc-900/20 border border-zinc-800/50 border-dashed rounded-[3rem]"
            >
              <div className="w-16 h-16 bg-zinc-900/50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                <Mail size={32} className="text-zinc-700" />
              </div>
              <p className="text-zinc-500 font-medium">No pending invitations at the moment.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Team Services Section */}
      <section className="space-y-12">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <Shield size={14} className="text-blue-500" />
            Your Teams per Service
          </h2>
          <span className="px-2 py-1 bg-zinc-900 rounded-lg text-[10px] font-bold text-zinc-500">
            {services?.length || 0} Services
          </span>
        </div>

        <div className="space-y-16">
          {services?.map((service, sIdx) => (
            <motion.div 
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.1 }}
              className="group bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden hover:border-zinc-700/50 transition-colors"
            >
              {/* Service Header - Clickable */}
              <button 
                onClick={() => toggleService(service.id)}
                className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 text-left hover:bg-zinc-800/20 transition-colors"
              >
                <div>
                  <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                    {service.title || 'Untitled Service'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-zinc-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Created BY:</span>
                    <span className="text-xs font-black text-zinc-300">
                      {service.createdBy ? `${service.createdBy.firstName} ${service.createdBy.lastName}` : 'System'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-xs text-zinc-400">{new Date(service.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {service.lineup?.length || 0} Members
                  </div>
                  <motion.div
                    animate={{ rotate: expandedServices.includes(service.id) ? 180 : 0 }}
                    className="text-zinc-600"
                  >
                    <ChevronRight size={20} className="rotate-90" />
                  </motion.div>
                </div>
              </button>

              {/* Members Content Area */}
              <AnimatePresence>
                {expandedServices.includes(service.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="p-8 pt-0 space-y-6">
                      <div className="h-px bg-zinc-800/50 w-full" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {service.lineup?.map((member) => (
                          <div
                            key={member.id}
                            className="p-5 bg-zinc-950/40 border border-zinc-800/50 rounded-[2rem] hover:bg-zinc-900/50 hover:border-zinc-700/50 transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-xl text-zinc-600 uppercase">
                                  {member.user?.firstName?.[0] || '?'}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-zinc-900 ${member.status === 'ACCEPTED' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-white capitalize">
                                  {member.user ? `${member.user.firstName} ${member.user.lastName}` : 'Invited Member'}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5 text-zinc-500">
                                  {roleIcons[member.role] || <Users size={12}/>}
                                  <span className="text-[10px] font-black uppercase tracking-wider">{member.role}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!service.lineup || service.lineup.length === 0) && (
                          <div className="col-span-full py-10 text-center bg-zinc-900/10 border border-zinc-800/30 border-dashed rounded-[2rem] text-zinc-600 text-sm">
                            No members have been added to this service yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          {(!services || services.length === 0) && (
            <div className="py-20 text-center bg-zinc-900/20 border border-zinc-800 rounded-[3rem]">
              <p className="text-zinc-500">You are not involved in any active services.</p>
            </div>
          )}
        </div>
      </section>

      {/* Invite Floating Panel */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-4 bottom-24 z-50 md:max-w-2xl md:mx-auto"
          >
            <div className="p-8 bg-zinc-950/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white">Send New Invitation</h3>
                <button onClick={() => setShowInvite(false)} className="p-2 hover:bg-white/10 rounded-xl text-zinc-500 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Assigned Service</label>
                  <select 
                    value={selectedServiceId || ''} 
                    onChange={e => setSelectedServiceId(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all appearance-none"
                  >
                    {!ownedServices.length && <option value="">No services found</option>}
                    {ownedServices.map(s => <option key={s.id} value={s.id}>{s.title || s.date}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Team Member Role</label>
                  <select 
                    value={inviteRole} 
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all appearance-none"
                  >
                    {Object.keys(roleIcons).map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Member Email</label>
                  <input 
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)}
                    type="email" 
                    placeholder="email@worship.com"
                    className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all"
                  />
                </div>
              </div>

              {inviteMsg && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-2xl text-xs font-bold border ${inviteMsg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                >
                  {inviteMsg.t}
                </motion.div>
              )}

              <button 
                onClick={handleInviteSubmit}
                disabled={inviteMutation.isPending || !ownedServices.length}
                className="w-full py-5 bg-white text-black font-black rounded-3xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl shadow-white/5 disabled:opacity-50"
              >
                {inviteMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    <span>Deliver Invitation</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setShowInvite(true); setInviteMsg(null); }}
        className="fixed bottom-10 right-10 w-16 h-16 bg-white text-black rounded-3xl flex items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.2)] z-[60] hover:bg-zinc-200 transition-colors"
      >
        <UserPlus size={28} />
      </motion.button>
    </div>
  );
}

export default TeamLineup;
