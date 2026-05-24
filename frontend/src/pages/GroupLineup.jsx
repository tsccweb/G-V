import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Mail, X, UserPlus, Clock, Users, Shield, 
  Music, Star, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { getServices, inviteToLineup } from '../services/serviceService';
import { getGroups } from '../services/groupService';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const roleIcons = {
  MEMBER: <Users size={16} />,
  MUSICIAN: <Music size={16} />,
  WORSHIP_LEADER: <Star size={16} />,
  PASTOR: <Shield size={16} />,
};

function GroupLineup() {
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [inviteMsg, setInviteMsg] = useState(null);

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

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
    enabled: !!token
  });

  const ownedServices = useMemo(() => services?.filter((service) => service.userId === user?.id) || [], [services, user?.id]);

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
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    }
  });

  const handleInviteSubmit = () => {
    if (!inviteEmail || !selectedServiceId) {
      setInviteMsg({ ok: false, t: 'Please select a service and enter an email.' });
      return;
    }
    inviteMutation.mutate({ serviceId: selectedServiceId, email: inviteEmail, role: inviteRole });
  };

  const handleAddFromGroup = async (groupId) => {
    if (!selectedServiceId) return toast.error('Please select a service first.');
    const group = groups?.find(g => g.id === groupId);
    if (!group) return;

    try {
      // Get full group details to get member emails
      const res = await axios.get(`${API_URL}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullGroup = res.data;
      
      if (!fullGroup.members?.length) return toast.error('Group has no members.');

      toast.promise(
        Promise.all(fullGroup.members.map(member => 
          inviteToLineup({ serviceId: selectedServiceId, email: member.email, role: inviteRole })
        )),
        {
          loading: `Inviting ${fullGroup.members.length} members...`,
          success: 'Group members invited successfully!',
          error: 'Some invitations failed. They might already be invited.'
        }
      );
      setShowInvite(false);
    } catch (err) {
      toast.error('Failed to process group invitation.');
    }
  };

  if (isInvitesLoading || isServicesLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Groups & <span className="text-zinc-500">Invitations</span>
            </h1>
            <p className="text-zinc-500 max-w-xl">
              Manage your worship ministry groups, send invitations, and track member status in one place.
            </p>
          </div>
          <Link 
            to="/groups"
            className="hidden md:flex items-center gap-3 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl transition-all group"
          >
            <Users size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-300">Manage Groups</span>
          </Link>
        </div>

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
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Group Member Role</label>
                  <select 
                    value={inviteRole} 
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all appearance-none"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MUSICIAN">Musician</option>
                    <option value="WORSHIP_LEADER">Worship Leader</option>
                    <option value="PASTOR">Pastor</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Member Email</label>
                    {groups?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter">OR ADD FROM GROUP:</span>
                        <select 
                          onChange={(e) => {
                            if (e.target.value) handleAddFromGroup(e.target.value);
                            e.target.value = "";
                          }}
                          className="bg-emerald-500/10 border-none text-[10px] font-black text-emerald-500 uppercase px-2 py-0.5 rounded cursor-pointer hover:bg-emerald-500/20 outline-none"
                        >
                          <option value="">SELECT GROUP...</option>
                          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
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

export default GroupLineup;
