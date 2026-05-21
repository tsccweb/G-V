import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices, deleteService } from '../services/serviceService';
import { Calendar, Plus, Users, ChevronRight, Trash2, Clock, Music, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import useAuthStore from '../store/authStore';

function ServiceList() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: getServices
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setDeletingId(null);
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-zinc-600" />
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-400">Error loading services</div>;

  const upcoming = services?.filter(s => new Date(s.date) >= new Date()) || [];
  const past = services?.filter(s => new Date(s.date) < new Date()) || [];
  const totalMembers = services?.reduce((sum, s) => sum + (s.lineup?.length || 0), 0) || 0;

  const ServiceCard = ({ service, isPast }) => {
    const date = new Date(service.date);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const accepted = service.lineup?.filter(m => m.status === 'ACCEPTED').length || 0;
    const pending = service.lineup?.filter(m => m.status === 'PENDING').length || 0;
    const isOwner = user?.id === service.userId;

    return (
      <div className="group relative">
        <Link
          to={`/services/${service.id}`}
          className={`block rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] ${
            isPast
              ? 'bg-zinc-950/50 border-zinc-800/50 opacity-60 hover:opacity-80'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 shadow-lg hover:shadow-xl'
          }`}
        >
          <div className="flex items-stretch">
            {/* Date Strip */}
            <div className={`flex flex-col items-center justify-center px-5 py-6 border-r ${
              isPast ? 'border-zinc-800/50' : 'border-zinc-800'
            }`}>
              <span className="text-[9px] font-black tracking-[0.3em] text-zinc-500">{month}</span>
              <span className="text-3xl font-black text-white leading-none mt-1">{day}</span>
              <span className="text-[10px] font-bold text-zinc-600 mt-1">{weekday}</span>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white truncate">{service.title}</h3>
                  {service.notes && (
                    <p className="text-xs text-zinc-500 mt-1 truncate">{service.notes}</p>
                  )}
                </div>
                <ChevronRight size={18} className="text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-1" />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400">
                  <Users size={10} />
                  {service.lineup?.length || 0}
                </span>
                {accepted > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400">
                    {accepted} ready
                  </span>
                )}
                {pending > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-bold text-amber-400">
                    {pending} pending
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Delete button (owner only) */}
        {isOwner && (
          <button
            onClick={(e) => {
              e.preventDefault();
              setDeletingId(service.id);
            }}
            className="absolute -top-2 -right-2 p-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-500 hover:text-red-400 hover:border-red-400/50 transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-32 space-y-8">
      
      {/* Header */}
      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400 mb-2">Worship Services</p>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Your Services</h1>
        </div>

        {/* Mini Stats */}
        <div className="flex gap-3">
          <div className="flex-1 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
            <p className="text-2xl font-black text-white">{services?.length || 0}</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500 mt-1">Total</p>
          </div>
          <div className="flex-1 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
            <p className="text-2xl font-black text-emerald-400">{upcoming.length}</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500 mt-1">Upcoming</p>
          </div>
          <div className="flex-1 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
            <p className="text-2xl font-black text-white">{totalMembers}</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500 mt-1">Lineup</p>
          </div>
        </div>
      </div>

      {/* Upcoming Services */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500 flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-400" />
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcoming.map(service => (
              <ServiceCard key={service.id} service={service} isPast={false} />
            ))}
          </div>
        </div>
      )}

      {/* Past Services */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500 flex items-center gap-2">
            <Clock size={14} />
            Past Services
          </h2>
          <div className="space-y-3">
            {past.map(service => (
              <ServiceCard key={service.id} service={service} isPast={true} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!services || services.length === 0) && (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
          <Calendar className="mx-auto mb-4 text-zinc-700" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">No services yet</h3>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto">
            Create your first worship service and start planning your team lineup.
          </p>
        </div>
      )}

      {/* FAB */}
      <Link
        to="/services/new"
        className="fixed bottom-24 lg:bottom-12 right-6 lg:right-12 flex items-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-black shadow-[0_16px_40px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-0.5 hover:bg-zinc-200 active:scale-95 z-50"
      >
        <Plus size={18} />
        New Service
      </Link>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 text-center space-y-5 shadow-2xl">
            <div className="mx-auto w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Delete Service?</h3>
              <p className="text-sm text-zinc-400">
                This will permanently remove this service and all its worship flow items.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceList;
