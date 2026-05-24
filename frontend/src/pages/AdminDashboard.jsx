import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAllUsers, 
  updateUser, 
  deleteUser, 
  getSubscriptionRequests, 
  handleSubscriptionRequest 
} from '../services/adminService';
import { 
  Users, 
  CreditCard, 
  Search, 
  Check, 
  X, 
  Trash2, 
  Edit,
  Shield,
  Star,
  Zap,
  Crown
} from 'lucide-react';

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(date));
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Queries
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: getAllUsers,
    enabled: !!localStorage.getItem('token')
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['admin', 'requests'],
    queryFn: getSubscriptionRequests,
    enabled: !!localStorage.getItem('token')
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] })
  });

  const handleRequestMutation = useMutation({
    mutationFn: ({ id, status }) => handleSubscriptionRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const filteredUsers = users?.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingRequests = requests?.filter(r => r.status === 'PENDING');
  const processedRequests = requests?.filter(r => r.status !== 'PENDING');

  if (usersLoading || requestsLoading) return <div className="p-8 text-center text-zinc-500">Loading Admin Control...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Control</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage users and subscription approvals</p>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Users size={16} /> Users
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'requests' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <CreditCard size={16} /> 
            Requests 
            {pendingRequests?.length > 0 && (
              <span className="bg-emerald-500 text-black text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* Users Table/Grid */}
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredUsers?.map(u => (
                <motion.div
                  key={u.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <UserCard 
                    user={u} 
                    onUpdate={(data) => updateMutation.mutate({ id: u.id, data })}
                    onDelete={() => {
                      if (window.confirm(`Delete user ${u.email}?`)) deleteMutation.mutate(u.id);
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Requests */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Pending Requests</h2>
            </div>
            
            {pendingRequests?.length === 0 ? (
              <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
                No pending subscription requests
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingRequests?.map(req => (
                  <RequestCard 
                    key={req.id} 
                    request={req} 
                    onAction={(status) => handleRequestMutation.mutate({ id: req.id, status })}
                  />
                ))}
              </div>
            )}
          </section>

          {/* History */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
              <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Recent Activity</h2>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
              {/* Desktop Table */}
              <table className="hidden md:table w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-900 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Request</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {processedRequests?.map(r => (
                    <tr key={r.id}>
                      <td className="px-6 py-4">
                        <p className="text-white font-bold">{r.user.firstName} {r.user.lastName}</p>
                        <p className="text-[10px] text-zinc-600">{r.user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-white font-medium">To {r.plan}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                          r.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-600">
                        {formatDate(r.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-zinc-800">
                {processedRequests?.map(r => (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-bold text-sm truncate">{r.user.firstName} {r.user.lastName}</p>
                      <p className="text-[10px] text-zinc-600 truncate">{r.user.email}</p>
                      <p className="text-xs text-zinc-400 mt-1">To <span className="text-white font-semibold">{r.plan}</span></p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                        r.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {r.status}
                      </span>
                      <span className="text-[10px] text-zinc-600">{formatDate(r.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function UserCard({ user, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...user });

  const PlanIcon = user.plan === 'PREMIUM' ? Crown : user.plan === 'STANDARD' ? Star : Zap;
  const RoleIcon = user.role === 'ADMIN' ? Shield : Users;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${user.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-400'}`}>
          <RoleIcon size={20} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <Edit size={16} />
          </button>
          <button onClick={onDelete} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-white font-bold">{user.firstName} {user.lastName}</p>
        <p className="text-xs text-zinc-500">{user.email}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlanIcon size={14} className={user.plan === 'FREE' ? 'text-zinc-600' : 'text-emerald-400'} />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{user.plan}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{user.role}</span>
          {user.planExpiresAt && (
            <span className="text-[9px] font-bold text-blue-400/70 lowercase tracking-tighter italic">
              Expires {new Date(user.planExpiresAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 p-4 bg-black/40 rounded-xl space-y-4 border border-zinc-800">
          <div>
            <label className="text-[10px] font-black text-zinc-600 uppercase mb-1 block">Role</label>
            <select 
              value={editData.role}
              onChange={(e) => setEditData({ ...editData, role: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="MEMBER">MEMBER</option>
              <option value="MUSICIAN">MUSICIAN</option>
              <option value="WORSHIP_LEADER">WORSHIP_LEADER</option>
              <option value="PASTOR">PASTOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-zinc-600 uppercase mb-1 block">Plan</label>
            <select 
              value={editData.plan}
              onChange={(e) => setEditData({ ...editData, plan: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="FREE">FREE</option>
              <option value="STANDARD">STANDARD</option>
            </select>
          </div>
          <button 
            onClick={() => {
              onUpdate(editData);
              setIsEditing(false);
            }}
            className="w-full bg-white text-black py-2 rounded-lg text-xs font-bold"
          >
            Update Permissions
          </button>
        </div>
      )}
    </div>
  );
}

function RequestCard({ request, onAction }) {
  const PlanIcon = request.plan === 'PREMIUM' ? Crown : Star;
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-lg">
          {request.user.firstName[0]}{request.user.lastName[0]}
        </div>
        <div>
          <p className="text-white font-bold text-lg">{request.user.firstName} {request.user.lastName}</p>
          <p className="text-sm text-zinc-500">{request.user.email}</p>
          <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">
            Member since {new Date().getFullYear()} {/* Placeholder */}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 py-3 bg-black/40 rounded-2xl border border-zinc-800">
        <div className="text-zinc-500">
          <p className="text-[9px] font-black uppercase tracking-widest">Wants to upgrade to</p>
          <div className="flex items-center gap-2 mt-0.5">
            <PlanIcon size={18} className="text-emerald-400" />
            <span className="text-lg font-black text-white italic">{request.plan}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onAction('REJECTED')}
          className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-zinc-800 text-zinc-500 font-bold text-sm hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center gap-2"
        >
          <X size={16} /> Reject
        </button>
        <button 
          onClick={() => onAction('APPROVED')}
          className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-emerald-500 text-black font-black text-sm hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
        >
          <Check size={18} /> Approve
        </button>
      </div>
    </div>
  );
}
