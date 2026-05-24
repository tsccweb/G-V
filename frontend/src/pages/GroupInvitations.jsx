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
import { getGroups, getGroupById, addMembersToGroup } from '../services/groupService';
import { getUsers } from '../services/authService';
import { Link } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const roleIcons = {
  MEMBER: <Users size={16} />,
  MUSICIAN: <Music size={16} />,
  WORSHIP_LEADER: <Star size={16} />,
  PASTOR: <Shield size={16} />,
};

function GroupInvitations() {
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [inviteMsg, setInviteMsg] = useState(null);
  const [groupInviteMsg, setGroupInviteMsg] = useState(null);

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

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: !!token
  });

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
    enabled: !!token
  });

  const { data: selectedGroup } = useQuery({
    queryKey: ['group', selectedGroupId],
    queryFn: () => getGroupById(selectedGroupId),
    enabled: !!selectedGroupId
  });

  const ownedServices = useMemo(() => services?.filter((service) => service.userId === user?.id) || [], [services, user?.id]);

  useEffect(() => {
    if (!selectedServiceId && ownedServices.length > 0) {
      setSelectedServiceId(ownedServices[0].id);
    }
  }, [ownedServices, selectedServiceId]);

  useEffect(() => {
    if (!selectedGroupId && groups?.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    setSelectedMemberId('');
  }, [selectedGroupId]);

  const inviteMutation = useMutation({
    mutationFn: (data) => inviteToLineup(data),
    onSuccess: () => {
      setInviteMsg({ ok: true, t: 'Invitation sent successfully' });
      setTimeout(() => setInviteMsg(null), 3000);
      setSelectedMemberId('');
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

  const addGroupMembersMutation = useMutation({
    mutationFn: ({ groupId, memberIds }) => addMembersToGroup(groupId, memberIds),
    onSuccess: () => {
      setGroupInviteMsg({ ok: true, t: 'User added to the group successfully' });
      setTimeout(() => setGroupInviteMsg(null), 3000);
      setSelectedUserId('');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: (error) => {
      setGroupInviteMsg({ ok: false, t: error.response?.data?.error || 'Failed to add user to group' });
    }
  });

  const handleAddUserToGroup = () => {
    if (!selectedGroupId || !selectedUserId) {
      setGroupInviteMsg({ ok: false, t: 'Please select a group and a user.' });
      return;
    }
    addGroupMembersMutation.mutate({ groupId: selectedGroupId, memberIds: [selectedUserId] });
  };

  const handleInviteSubmit = () => {
    if (!selectedGroupId || !selectedMemberId || !selectedServiceId) {
      setInviteMsg({ ok: false, t: 'Please select a service, a group, and a group member.' });
      return;
    }

    const member = selectedGroup?.members?.find((m) => m.id === selectedMemberId);
    if (!member) {
      setInviteMsg({ ok: false, t: 'Selected member is not available in the chosen group.' });
      return;
    }

    inviteMutation.mutate({
      serviceId: selectedServiceId,
      email: member.email,
      role: inviteRole
    });
  };

  if (isInvitesLoading || isServicesLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <div className="rounded-[2.5rem] border border-zinc-800/60 bg-zinc-950/90 shadow-2xl shadow-black/30 p-10 backdrop-blur-xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">Group Lineup</div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Manage groups, members, and lineup invitations</h1>
            <p className="max-w-2xl text-zinc-400 leading-7">Send invitations to group members, review pending lineup responses, and keep every worship team assignment polished and clear.</p>
          </div>
          <Link 
            to="/groups"
            className="inline-flex items-center gap-3 rounded-[1.75rem] border border-zinc-800 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.26em] text-zinc-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
          >
            <Users size={18} className="text-emerald-500" />
            <span>Manage Groups</span>
          </Link>
        </div>
      </div>

      <section className="rounded-[2rem] border border-zinc-800/60 bg-zinc-950/90 p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pb-4 border-b border-zinc-800/50">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.24em] text-emerald-300">Pending Invitations</h2>
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl">Review all lineup invitations that need a response from your team or leaders.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-300 border border-zinc-800/60">
            <Mail size={14} className="text-emerald-400" /> {invitations?.length || 0} total
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {invitations?.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 mt-6">
              {invitations.map((invite) => (
                <motion.div
                  key={invite.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="group overflow-hidden rounded-[2rem] border border-zinc-800/60 bg-zinc-900/90 p-6 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/10 to-zinc-900 border border-zinc-800">
                        <Clock size={28} className="text-emerald-300" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">{invite.serviceTitle}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-zinc-300 border border-zinc-800/60">
                            {roleIcons[invite.role] || <Users size={14}/>} {invite.role}
                          </span>
                          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">by {invite.sender}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        onClick={() => respondMutation.mutate({ id: invite.id, status: 'DECLINED' })}
                        className="min-w-[140px] rounded-3xl border border-red-400/20 bg-zinc-950 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => respondMutation.mutate({ id: invite.id, status: 'ACCEPTED' })}
                        className="min-w-[140px] rounded-3xl bg-white px-5 py-3 text-sm font-black text-black shadow-lg shadow-white/10 transition hover:bg-zinc-100"
                      >
                        Accept Invite
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 rounded-[2rem] border border-dashed border-zinc-800/50 bg-zinc-900/80 p-12 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-800/70 border border-zinc-700">
                <Mail size={32} className="text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-base font-medium">No pending invitations at the moment.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="rounded-[2rem] border border-zinc-800/60 bg-zinc-950/90 p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pb-4 border-b border-zinc-800/50">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.24em] text-emerald-300">Invite Members into a Group</h2>
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl">Select a group, choose a user, and add them directly to the lineup-ready member roster.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-300 border border-zinc-800/60">
            {groups?.length || 0} Groups
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Select Group</label>
            <select
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4 text-sm text-white focus:outline-none focus:border-emerald-400/30 focus:ring-4 focus:ring-emerald-400/10 transition-all appearance-none"
            >
              {!groups?.length && <option value="">No groups available</option>}
              {groups?.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4 text-sm text-white focus:outline-none focus:border-emerald-400/30 focus:ring-4 focus:ring-emerald-400/10 transition-all appearance-none"
            >
              <option value="">Choose a user</option>
              {users?.map((userOption) => (
                <option key={userOption.id} value={userOption.id}>
                  {userOption.firstName} {userOption.lastName} – {userOption.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddUserToGroup}
              disabled={!selectedGroupId || !selectedUserId || addGroupMembersMutation.isLoading}
              className="w-full rounded-[1.75rem] bg-white px-6 py-4 text-sm font-black text-black shadow-xl shadow-white/5 transition hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addGroupMembersMutation.isLoading ? 'Inviting...' : 'Invite to Group'}
            </button>
          </div>
        </div>

        {groupInviteMsg && (
          <div className={`mt-4 rounded-2xl border p-4 text-xs font-bold ${groupInviteMsg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {groupInviteMsg.t}
          </div>
        )}
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
            <div className="p-8 bg-zinc-950/95 backdrop-blur-2xl border border-emerald-500/10 rounded-[3rem] shadow-2xl shadow-black/40 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-300 font-semibold">Send Invitation</p>
                  <h3 className="text-2xl font-black text-white">Add a group member to a service lineup</h3>
                </div>
                <button onClick={() => setShowInvite(false)} className="p-3 rounded-3xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Assigned Service</label>
                  <select 
                    value={selectedServiceId || ''} 
                    onChange={e => setSelectedServiceId(e.target.value)}
                    className="w-full rounded-3xl border border-zinc-800/70 bg-zinc-900 px-5 py-4 text-sm text-white outline-none transition focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                  >
                    {!ownedServices.length && <option value="">No services found</option>}
                    {ownedServices.map(s => <option key={s.id} value={s.id}>{s.title || s.date}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Role</label>
                  <select 
                    value={inviteRole} 
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full rounded-3xl border border-zinc-800/70 bg-zinc-900 px-5 py-4 text-sm text-white outline-none transition focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MUSICIAN">Musician</option>
                    <option value="WORSHIP_LEADER">Worship Leader</option>
                    <option value="PASTOR">Pastor</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Group</label>
                  <select
                    value={selectedGroupId || ''}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full rounded-3xl border border-zinc-800/70 bg-zinc-900 px-5 py-4 text-sm text-white outline-none transition focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                  >
                    {!groups?.length && <option value="">No groups available</option>}
                    {groups?.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Member</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full rounded-3xl border border-zinc-800/70 bg-zinc-900 px-5 py-4 text-sm text-white outline-none transition focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                  >
                    <option value="">Choose a member</option>
                    {selectedGroup?.members?.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName} - {member.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Select the group first, then choose a member to invite them into the service lineup.</p>

              {inviteMsg && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-2xl border p-4 text-xs font-bold ${inviteMsg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                >
                  {inviteMsg.t}
                </motion.div>
              )}

              <button 
                onClick={handleInviteSubmit}
                disabled={inviteMutation.isPending || !ownedServices.length || !selectedGroupId || !selectedMemberId}
                className="w-full rounded-[2rem] bg-white px-8 py-4 text-sm font-black text-black shadow-xl shadow-white/10 transition hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviteMutation.isPending ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                ) : (
                  <div className="inline-flex items-center justify-center gap-3">
                    <Send size={18} />
                    <span>Deliver Invitation</span>
                  </div>
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

export default GroupInvitations;
