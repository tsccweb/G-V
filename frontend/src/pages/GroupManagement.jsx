import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Plus, Trash2, X, Search, UserPlus, 
  Settings2, Info, CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getGroups, createGroup, updateGroup, deleteGroup } from '../services/groupService';
import { getUsers } from '../services/authService';
import toast from 'react-hot-toast';

function GroupManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({ name: '', description: '', memberIds: [] });

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups
  });

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  });

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      resetForm();
      toast.success('Group created successfully');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      resetForm();
      toast.success('Group updated successfully');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group deleted');
    }
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', memberIds: [] });
    setShowCreate(false);
    setEditingGroup(null);
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      memberIds: group.members?.map(m => m.id) || []
    });
    setShowCreate(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Group name is required');
    
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleMember = (userId) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId]
    }));
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return [];
    return allUsers?.filter(u => 
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5) || [];
  }, [allUsers, searchQuery]);

  if (groupsLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group text-xs font-black uppercase tracking-widest"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Ministry <span className="text-emerald-500">Groups</span>
            </h1>
            <p className="text-zinc-500 max-w-xl text-sm font-medium">
              Organize your group members into reusable groups for faster service scheduling and bulk invitations.
            </p>
          </div>
        </div>

        <button 
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-3 shadow-xl shadow-white/5 active:scale-95"
        >
          <Plus size={20} />
          CREATE GROUP
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Groups List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-2">Your Groups</h2>
            <span className="text-[10px] font-bold text-zinc-700 uppercase">{groups?.length || 0} Total</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups?.map((group) => (
              <motion.div
                key={group.id}
                layout
                className="group relative p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] hover:border-emerald-500/30 transition-all duration-500"
              >
                <div className="flex flex-col h-full justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                        <Users size={24} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(group)}
                          className="p-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
                        >
                          <Settings2 size={16} />
                        </button>
                        <button 
                          onClick={() => { if(window.confirm('Delete this group?')) deleteMutation.mutate(group.id); }}
                          className="p-2.5 bg-zinc-900 hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight leading-tight">{group.name}</h3>
                      <p className="text-zinc-500 text-xs mt-1 font-medium line-clamp-2">{group.description || 'No description provided.'}</p>

                      {group.members?.length > 0 && (
                        <div className="mt-4 text-[11px] text-zinc-400 space-y-2">
                          <p className="font-bold uppercase tracking-[0.18em] text-zinc-500">Members</p>
                          <div className="flex flex-wrap gap-2">
                            {group.members.slice(0, 4).map((member) => (
                              <span key={member.id} className="px-2 py-1 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-[10px] uppercase tracking-[0.15em] text-zinc-300">
                                {member.firstName} {member.lastName}
                              </span>
                            ))}
                            {group.members.length > 4 && (
                              <span className="px-2 py-1 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-[10px] uppercase tracking-[0.15em] text-zinc-300">
                                +{group.members.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/30">
                    <div className="flex items-center -space-x-2">
                      {[...Array(Math.min(3, group._count.members))].map((_, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-500 uppercase">
                          {i === 2 && group._count.members > 3 ? `+${group._count.members - 2}` : <Users size={12}/>}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                      {group._count.members} MEMBERS
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {(!groups || groups.length === 0) && (
              <div className="col-span-full py-20 text-center bg-zinc-900/10 border border-zinc-800/50 border-dashed rounded-[3rem] space-y-4">
                <div className="w-16 h-16 bg-zinc-900 rotate-12 rounded-3xl flex items-center justify-center mx-auto border border-zinc-800">
                  <Info size={32} className="text-zinc-700" />
                </div>
                <p className="text-zinc-500 font-medium max-w-xs mx-auto">You have not created any groups yet. Start by creating your first ministry group.</p>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Sidebar */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {showCreate ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-8 bg-zinc-900/50 backdrop-blur-3xl border border-white/5 rounded-[3rem] sticky top-32 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    {editingGroup ? 'Edit' : 'New'} <span className="text-emerald-500">Group</span>
                  </h2>
                  <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-xl text-zinc-500 hover:text-white transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Group Name</label>
                    <input 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sunday Morning Band"
                      className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Description (Optional)</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What is the purpose of this group?"
                      className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-white focus:border-emerald-500/50 transition-all outline-none min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Members</label>
                      <span className="text-[10px] font-bold text-emerald-500">{formData.memberIds.length} Selected</span>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <input 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full bg-black/50 border border-zinc-800/50 rounded-xl pl-11 pr-4 py-3 text-xs text-white focus:border-emerald-500/30 transition-all outline-none"
                      />
                    </div>

                    {/* Search Results */}
                    {searchQuery && (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                        {filteredUsers.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleMember(u.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                              formData.memberIds.includes(u.id) 
                                ? 'bg-emerald-500/10 border-emerald-500/20' 
                                : 'bg-transparent border-zinc-800/50 hover:bg-zinc-800/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 uppercase">
                                {u.firstName[0]}
                              </div>
                              <div className="text-left">
                                <p className="text-[11px] font-bold text-white leading-none">{u.firstName} {u.lastName}</p>
                                <p className="text-[10px] text-zinc-500 mt-1">{u.email}</p>
                              </div>
                            </div>
                            {formData.memberIds.includes(u.id) ? <CheckCircle2 size={14} className="text-emerald-500" /> : <UserPlus size={14} className="text-zinc-600" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected Members List (Quick view) */}
                    {!searchQuery && formData.memberIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.memberIds.map(id => {
                          const u = allUsers?.find(user => user.id === id);
                          return (
                            <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-full border border-zinc-700/50">
                              <span className="text-[10px] font-bold text-zinc-300">{u?.firstName}</span>
                              <button type="button" onClick={() => toggleMember(id)} className="text-zinc-500 hover:text-red-400"><X size={10}/></button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="w-full py-5 bg-emerald-500 text-black font-black rounded-3xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-2xl shadow-emerald-500/20"
                  >
                    {editingGroup ? 'UPDATE GROUP' : 'SAVE GROUP'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <div className="p-10 border border-zinc-800/50 border-dashed rounded-[3rem] sticky top-32 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center border border-zinc-800">
                  <Users size={40} className="text-zinc-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Group Management</h3>
                  <p className="text-zinc-500 text-xs font-medium leading-relaxed">Select a group to edit its details, or use the button above to create a new group.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default GroupManagement;
