import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getServiceById,
  updateServiceItems,
  addToLineup,
  addServiceItem,
  removeServiceItem,
  deleteService,
  removeFromLineup,
  updateServiceStatus
} from '../services/serviceService';
import { getSongs } from '../services/songService';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Info, GripVertical, Check, X, Trash2, Search, AlertTriangle,
  ChevronLeft, Plus, Music, MessageSquare, BookOpen, Users, Send, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ServicePlanner() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: service, isLoading, error } = useQuery({
    queryKey: ['services', id],
    queryFn: () => getServiceById(id)
  });

  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Vocalist');
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [selectedSongForFlow, setSelectedSongForFlow] = useState(null);
  const [selectedKey, setSelectedKey] = useState('');
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const { data: songsData } = useQuery({
    queryKey: ['songs'],
    queryFn: getSongs
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(res.data);
        if (res.data.length > 0) setSelectedUserId(res.data[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (service?.items) {
      setItems(service.items);
    }
  }, [service]);

  const mutation = useMutation({
    mutationFn: (newItems) => updateServiceItems(id, newItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', id] });
    }
  });

  const assignMutation = useMutation({
    mutationFn: (data) => addToLineup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', id] });
      setIsAssigning(false);
    }
  });

  const removeLineupMutation = useMutation({
    mutationFn: (lineupId) => removeFromLineup(id, lineupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', id] });
      setMemberToRemove(null);
    }
  });

  const handleAssign = () => {
    if (!selectedUserId || !selectedRole) return;
    assignMutation.mutate({ serviceId: id, userId: selectedUserId, role: selectedRole });
  };

  const addItemMutation = useMutation({
    mutationFn: (data) => addServiceItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', id] });
    }
  });

  const handleAddItem = (song, key) => {
    addItemMutation.mutate({
      title: song.title,
      type: 'SONG',
      duration: 5,
      order: items.length,
      songId: song.id,
      key: key || song.key
    });
    setIsSongModalOpen(false);
    setSelectedSongForFlow(null);
    setSelectedKey('');
    setSongSearchQuery('');
  };

  const removeItemMutation = useMutation({
    mutationFn: (itemId) => removeServiceItem(id, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', id] });
    }
  });

  const handleRemoveItem = (itemId) => {
    if (confirm('Are you sure you want to remove this item from the worship flow?')) {
      removeItemMutation.mutate(itemId);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: () => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      navigate('/services');
    }
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateServiceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  const handleDeleteService = () => {
    if (confirm('CRITICAL: Are you sure you want to delete this ENTIRE service? This will remove all worship flow items and lineups. This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const handleFinishService = () => {
    if (confirm('Finish this service? It will moved to the Service History and you will no longer be able to edit items or use Live Mode.')) {
      statusMutation.mutate('COMPLETED');
    }
  };


  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    // Update orders
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index
    }));

    setItems(updatedItems);
    mutation.mutate(updatedItems.map(item => ({ id: item.id, order: item.order })));
  };

  if (isLoading) return <div className="p-8 text-center text-zinc-400">Loading planner...</div>;
  if (error) return <div className="p-8 text-center text-white">Error loading service</div>;

  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'song': return <Music size={18} className="text-zinc-300" />;
      case 'message': return <MessageSquare size={18} className="text-zinc-300" />;
      case 'scripture reading': return <BookOpen size={18} className="text-zinc-300" />;
      case 'benediction': return <Users size={18} className="text-zinc-300" />;
      default: return <Info size={18} className="text-zinc-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-4">
          <Link to="/services" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
            <ChevronLeft size={16} />
            <span>Back to Services</span>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-white">{service.title}</h1>
            <p className="text-zinc-400">
              {new Date(service.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {user?.id === service?.userId && service?.status !== 'COMPLETED' && (
            <button
              onClick={handleFinishService}
              disabled={statusMutation.isPending}
              className="w-full md:w-auto px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl shadow-lg shadow-emerald-500/10 transition-all font-bold flex items-center justify-center gap-2"
            >
              <Check size={18} />
              <span>Finish Service</span>
            </button>
          )}

          {service?.status === 'COMPLETED' && (
             <div className="px-6 py-2 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-xl font-bold flex items-center justify-center gap-2">
                <Check size={18} className="text-emerald-500" />
                <span>Completed</span>
             </div>
          )}

          {service?.status !== 'COMPLETED' && (
            <Link to={`/services/${id}/live`} className="w-full md:w-auto px-6 py-2 bg-white hover:bg-zinc-200 text-black rounded-xl shadow-lg shadow-white/5 transition-all font-bold flex items-center justify-center">
              Go Live
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Worship Flow Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider text-sm">Worship Flow</h2>
            {user?.id === service?.userId && (
              <button
                onClick={() => setIsSongModalOpen(true)}
                disabled={addItemMutation.isPending || service?.status === 'COMPLETED'}
                className="flex items-center gap-1 text-zinc-300 hover:text-white bg-zinc-900 px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50"
              >
                <Plus size={14} />
                <span>Add Song</span>
              </button>
            )}
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="service-items" isDropDisabled={user?.id !== service?.userId}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={user?.id !== service?.userId}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-4 p-4 bg-zinc-900 border rounded-2xl transition-all ${snapshot.isDragging ? 'border-zinc-600 shadow-2xl z-50 bg-zinc-800' : 'border-zinc-800 hover:border-zinc-600'
                            }`}
                        >
                          <div {...provided.dragHandleProps} className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing">
                            <GripVertical size={20} />
                          </div>

                          <div className="p-2 bg-black rounded-lg">
                            {getTypeIcon(item.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white truncate">{item.title}</h4>
                              {item.key && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-md border border-zinc-700 font-mono">
                                  {item.key}
                                </span>
                              )}
                            </div>
                            {item.assignedTo && (
                              <p className="text-xs text-zinc-500 truncate">
                                Assigned to: {item.assignedTo}
                              </p>
                            )}
                          </div>

                          <div className="text-right flex items-center gap-4">
                            <span className="text-sm font-mono text-zinc-500">{item.duration}m</span>
                            {user?.id === service?.userId && (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === item.id ? null : item.id);
                                  }}
                                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                >
                                  <MoreVertical size={16} />
                                </button>

                                <AnimatePresence>
                                  {openMenuId === item.id && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-[60]" 
                                        onClick={() => setOpenMenuId(null)}
                                      />
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, x: 10 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, x: 10 }}
                                        className="absolute right-0 top-10 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-[70] overflow-hidden"
                                      >
                                        <button
                                          onClick={() => {
                                            removeItemMutation.mutate(item.id);
                                            setOpenMenuId(null);
                                          }}
                                          className="w-full px-4 py-3 text-left text-xs font-bold text-red-400 hover:bg-red-400/10 flex items-center gap-2 transition-colors"
                                        >
                                          <Trash2 size={12} />
                                          Delete
                                        </button>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Team Lineup Column */}
        <div className="space-y-6">
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Team Lineup</h2>
              {user?.id === service?.userId && (
                <button onClick={() => setIsAssigning(!isAssigning)} className="text-zinc-300 hover:text-white">
                  {isAssigning ? <X size={20} /> : <Plus size={20} />}
                </button>
              )}
            </div>

            {isAssigning && (
              <div className="p-4 bg-black border border-zinc-800 rounded-2xl space-y-3">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-zinc-900 text-white px-3 py-2 rounded-lg border border-zinc-700 text-sm focus:outline-none"
                >
                  {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                </select>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-zinc-900 text-white px-3 py-2 rounded-lg border border-zinc-700 text-sm focus:outline-none"
                >
                  <option value="Worship Leader">Worship Leader</option>
                  <option value="Guitarist">Guitarist</option>
                  <option value="Bassist">Bassist</option>
                  <option value="Pianist">Pianist</option>
                  <option value="Drummer">Drummer</option>
                  <option value="Back up">Back up</option>
                  <option value="Tambourine">Tambourine</option>
                  <option value="Media Team">Media Team</option>
                </select>
                <button
                  onClick={handleAssign}
                  disabled={assignMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200"
                >
                  <Check size={16} /> <span>Assign Role</span>
                </button>
              </div>
            )}

            <div className="space-y-4">
              {service.lineup?.length > 0 ? (
                service.lineup.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black border border-zinc-800 flex items-center justify-center font-bold text-zinc-300">
                      {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{member.user?.firstName} {member.user?.lastName}</p>
                      <p className="text-xs text-zinc-500">{member.role}</p>
                    </div>
                    <div className={`ml-auto px-2 py-1 rounded text-[10px] font-bold ${member.status === 'ACCEPTED' ? 'bg-zinc-100/10 text-zinc-300' : 'bg-zinc-100/10 text-zinc-300'
                      }`}>
                      {member.status}
                    </div>
                    {user?.id === service?.userId && (
                      <button
                        onClick={() => setMemberToRemove(member)}
                        className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Remove from lineup"
                        disabled={removeLineupMutation.isPending}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-zinc-500 text-sm py-4">No team members assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Song Selection Modal */}
      {isSongModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {selectedSongForFlow ? 'Select Key' : 'Select a Song'}
              </h2>
              <button 
                onClick={() => {
                  setIsSongModalOpen(false);
                  setSelectedSongForFlow(null);
                }} 
                className="text-zinc-500 hover:text-white p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!selectedSongForFlow ? (
                <div className="space-y-2">
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input
                        type="text"
                        placeholder="Search your library..."
                        value={songSearchQuery}
                        onChange={(e) => setSongSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-black border border-zinc-700 rounded-xl focus:ring-2 focus:ring-white focus:outline-none transition-all text-white"
                      />
                    </div>
                  </div>

                  {songsData
                    ?.filter(s => s.title.toLowerCase().includes(songSearchQuery.toLowerCase()) || s.artist?.toLowerCase().includes(songSearchQuery.toLowerCase()))
                    .map(song => (
                      <button
                        key={song.id}
                        onClick={() => {
                          setSelectedSongForFlow(song);
                          setSelectedKey(song.key || 'C');
                        }}
                        className="w-full text-left p-4 bg-black border border-zinc-800 rounded-xl hover:border-zinc-600 hover:bg-zinc-800/50 transition-all flex items-center gap-4 group"
                      >
                        <div className="p-3 bg-zinc-900 rounded-lg group-hover:bg-zinc-700 transition-colors">
                          <Music size={20} className="text-zinc-400 group-hover:text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-lg">{song.title}</h4>
                          <p className="text-sm text-zinc-500">{song.artist || 'Unknown Artist'}</p>
                        </div>
                        <div className="ml-auto">
                          <span className="text-xs font-bold px-2 py-1 bg-zinc-900 rounded-md text-zinc-400 border border-zinc-800">
                            {song.key || '?'}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="space-y-8 p-4">
                  <div className="flex items-center gap-4 p-4 bg-black border border-zinc-800 rounded-2xl">
                    <div className="p-3 bg-zinc-800 rounded-xl">
                      <Music size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedSongForFlow.title}</h3>
                      <p className="text-zinc-500 text-sm">Original Key: {selectedSongForFlow.key || 'None'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(k => (
                      <button
                        key={k}
                        onClick={() => setSelectedKey(k)}
                        className={`py-3 rounded-xl border font-bold transition-all ${
                          selectedKey === k 
                            ? 'bg-white text-black border-white shadow-lg shadow-white/10 scale-105' 
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setSelectedSongForFlow(null)}
                      className="flex-1 py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => handleAddItem(selectedSongForFlow, selectedKey)}
                      className="flex-[2] py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all shadow-xl shadow-white/5"
                    >
                      Add to Flow
                    </button>
                  </div>
                </div>
              )}
              {(!songsData || songsData.length === 0) && !selectedSongForFlow && (
                <div className="text-center p-8 text-zinc-500">Your library is empty. Add songs from the Song Library first!</div>
              )}
            </div>
          </div>
        </div>
      )}
      {memberToRemove && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm flex flex-col shadow-2xl p-6 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-2">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Remove Team Member?</h3>
              <p className="text-sm text-zinc-400">
                Are you sure you want to remove <span className="text-white font-bold">{memberToRemove.user?.firstName} {memberToRemove.user?.lastName}</span> from the lineup? They will no longer be assigned as {memberToRemove.role}.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setMemberToRemove(null)}
                className="flex-1 px-4 py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => removeLineupMutation.mutate(memberToRemove.id)}
                disabled={removeLineupMutation.isPending}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition flex items-center justify-center gap-2"
              >
                {removeLineupMutation.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ServicePlanner;
