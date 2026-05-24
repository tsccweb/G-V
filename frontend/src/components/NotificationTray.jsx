import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, Loader2, Info, UserPlus, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function NotificationTray() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications, isLoading: isNoteLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: isOpen
  });

  const { data: counts, refetch: refetchCounts } = useQuery({
    queryKey: ['notificationCounts'],
    queryFn: getUnreadCount,
    refetchInterval: 30000 // Poll every 30 seconds
  });

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      refetchCounts();
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      refetchCounts();
    }
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
      >
        <Bell size={20} />
        {counts?.total > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black">
            {counts.total > 9 ? '9+' : counts.total}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 md:w-96 max-h-[500px] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-xl">
                <h3 className="font-black text-sm uppercase tracking-widest text-zinc-400">Activity</h3>
                {counts?.total > 0 && (
                  <button 
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-[10px] font-bold text-zinc-600 hover:text-white transition-colors"
                  >
                    MARK ALL AS READ
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isNoteLoading ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3 text-zinc-600">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">Loading...</span>
                  </div>
                ) : notifications?.length > 0 ? (
                  <div className="divide-y divide-zinc-800/50">
                    {notifications.map((note) => (
                      <div 
                        key={`${note.type}-${note.id}`}
                        onClick={() => {
                          if (note.type === 'INVITATION') {
                            navigate('/groups/lineup');
                            setIsOpen(false);
                          } else if (note.type === 'ADMIN_REQUEST') {
                            navigate('/admin');
                            setIsOpen(false);
                          } else if (!note.isRead) {
                            markReadMutation.mutate(note.id);
                          }
                        }}
                        className={`p-4 flex gap-4 hover:bg-zinc-800/30 transition-colors cursor-pointer group ${!note.isRead ? 'bg-amber-500/5' : ''}`}
                      >
                        <div className={`mt-1 p-2 rounded-xl h-fit ${
                          note.type === 'INVITATION' ? 'bg-blue-500/10 text-blue-500' :
                          note.type === 'ADMIN_REQUEST' ? 'bg-purple-500/10 text-purple-500' :
                          !note.isRead ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-600'
                        }`}>
                          {note.type === 'INVITATION' ? <UserPlus size={16} /> : 
                           note.type === 'ADMIN_REQUEST' ? <ShieldAlert size={16} /> : 
                           <Info size={16} />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className={`text-sm leading-relaxed ${!note.isRead ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`}>
                            {note.message}
                          </p>
                          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter">
                            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!note.isRead && (
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 group-hover:scale-125 transition-transform ${
                            note.type === 'INVITATION' ? 'bg-blue-500' :
                            note.type === 'ADMIN_REQUEST' ? 'bg-purple-500' : 'bg-amber-500'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-800">
                      <Bell size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">All caught up</p>
                      <p className="text-xs text-zinc-700 font-medium mt-1">No new notifications at the moment.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 text-center">
                <p className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.2em]">Ministry Alerts • Psalms V3</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
