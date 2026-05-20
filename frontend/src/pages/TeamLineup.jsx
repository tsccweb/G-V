import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Mail, Check, X, UserPlus, Clock, Users } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { getServices, inviteToLineup } from '../services/serviceService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function TeamLineup() {
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [inviteMsg, setInviteMsg] = useState(null);

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/services/lineup/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always'
  });

  const { data: teamMembers } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/services/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always'
  });

  const { data: services } = useQuery({
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
      setInviteMsg({ ok: true, t: 'Invitation sent ✓' });
      setInviteEmail('');
      setInviteRole('MEMBER');
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error) => {
      setInviteMsg({ ok: false, t: error.response?.data?.error || 'Failed to send invite' });
    }
  });

  const handleInviteSubmit = () => {
    if (!inviteEmail || !selectedServiceId) {
      setInviteMsg({ ok: false, t: 'Please select a service and enter an email.' });
      return;
    }
    inviteMutation.mutate({ serviceId: selectedServiceId, email: inviteEmail, role: inviteRole });
  };

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

  if (isLoading) return <div className="p-8 text-center text-zinc-400">Checking invitations...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-white">Team & Invitations</h1>
      </div>

      {showInvite && (
        <div className="space-y-4 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
            <label className="flex-1 text-[11px] uppercase tracking-[0.3em] text-zinc-500">
              Service
              <select value={selectedServiceId || ''} onChange={e => setSelectedServiceId(e.target.value)}
                className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600">
                {ownedServices.length === 0 ? (
                  <option value="">No owned services available</option>
                ) : ownedServices.map((service) => (
                  <option key={service.id} value={service.id}>{service.title || service.date}</option>
                ))}
              </select>
            </label>
            <label className="flex-1 text-[11px] uppercase tracking-[0.3em] text-zinc-500">
              Email
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email"
                placeholder="member@example.com"
                className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600" />
            </label>
            <label className="flex-1 text-[11px] uppercase tracking-[0.3em] text-zinc-500">
              Role
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600">
                <option value="MEMBER">MEMBER</option>
                <option value="MUSICIAN">MUSICIAN</option>
                <option value="VOCALIST">VOCALIST</option>
                <option value="WORSHIP_LEADER">WORSHIP LEADER</option>
                <option value="MEDIA_TEAM">MEDIA TEAM</option>
                <option value="SOUND_TEAM">SOUND TEAM</option>
              </select>
            </label>
          </div>
          {inviteMsg && (
            <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${inviteMsg.ok ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
              {inviteMsg.t}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={handleInviteSubmit}
              className="w-full px-5 py-3 rounded-2xl bg-white text-black font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
              disabled={inviteMutation.isLoading || !ownedServices.length}
            >
              {inviteMutation.isLoading ? 'Sending…' : 'Send Invite'}
            </button>
            <button onClick={() => setShowInvite(false)}
              className="w-full px-5 py-3 rounded-2xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Mail size={16} />
          <span>Pending Invitations</span>
        </h2>

        {invitations?.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {invitations.map((invite) => (
              <div key={invite.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100/10 text-zinc-300 rounded-2xl flex items-center justify-center">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{invite.serviceTitle}</h3>
                    <p className="text-zinc-400">Role: <span className="text-zinc-300 font-bold">{invite.role}</span></p>
                    <p className="text-xs text-zinc-500 mt-1">Invited by {invite.sender}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
                  <button
                    onClick={() => respondMutation.mutate({ id: invite.id, status: 'DECLINED' })}
                    className="flex-1 md:flex-none px-6 py-2 bg-black text-zinc-400 hover:text-white border border-zinc-800 hover:border-red-400/50 rounded-xl transition-all font-bold w-full md:w-auto"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => respondMutation.mutate({ id: invite.id, status: 'ACCEPTED' })}
                    className="flex-1 md:flex-none px-6 py-2 bg-white hover:bg-zinc-200 text-black rounded-xl shadow-lg shadow-white/5 transition-all font-bold w-full md:w-auto"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-zinc-900 border border-zinc-800 border-dashed rounded-3xl">
            <p className="text-zinc-500">No pending invitations.</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Users size={16} />
          <span>My Team</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamMembers?.map((member) => (
            <div key={member.id} className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center font-bold text-zinc-500">
                {member.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{member.name}</p>
                <p className="text-xs text-zinc-500">{member.role}</p>
              </div>
              <div className={`w-2 h-2 rounded-full ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => { setShowInvite(prev => !prev); setInviteMsg(null); }}
        className="fixed bottom-24 right-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black shadow-[0_18px_40px_rgba(255,255,255,0.18)] transition-all hover:bg-zinc-200 active:scale-95 z-60"
      >
        <UserPlus size={18} />
        Invite
      </button>
    </div>
  );
}

export default TeamLineup;
