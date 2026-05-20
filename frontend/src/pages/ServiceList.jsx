import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices, deleteService } from '../services/serviceService';
import { Calendar, Plus, Users, ChevronRight, MoreVertical, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import useAuthStore from '../store/authStore';

function ServiceList() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeMenu, setActiveMenu] = useState(null);

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: getServices
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setActiveMenu(null);
    }
  });

  const handleDelete = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this service?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-zinc-400">Loading services...</div>;
  if (error) return <div className="p-8 text-center text-white">Error loading services</div>;

  return (
    <div className="relative p-4 md:p-8">
      <div className="mb-10 rounded-[2rem] border border-zinc-800 bg-zinc-950/80 p-8 shadow-[0_30px_70px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.45em] text-emerald-400 mb-4">Worship Services</p>
            <h1 className="text-4xl md:text-5xl font-black text-white">Plan your next gatherings</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              Easily manage upcoming worship services, keep your team in sync, and review lineup progress from a single dashboard.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Total services</p>
              <p className="mt-2 text-2xl font-black text-white">{services?.length || 0}</p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Next service</p>
              <p className="mt-2 text-2xl font-black text-white">{services?.[0] ? new Date(services[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}</p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Lineup size</p>
              <p className="mt-2 text-2xl font-black text-white">{services?.reduce((sum, service) => sum + (service.lineup?.length || 0), 0) || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {services?.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {services.map((service) => {
            const date = new Date(service.date);
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const day = date.getDate();
            const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
            const hasPending = service.lineup?.some((member) => member.status === 'PENDING');

            return (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className="group block overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-zinc-900"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-5">
                    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-3xl bg-white/5 text-center text-white border border-zinc-800">
                      <span className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">{month}</span>
                      <span className="text-3xl font-black">{day}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-2xl font-bold text-white truncate">{service.title}</h3>
                      <p className="mt-2 text-sm text-zinc-400">{weekday} • {service.notes || 'No notes added yet'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-right">
                    <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">Lineup</span>
                    <span className="text-2xl font-black text-white">{service.lineup?.length || 0}</span>
                    <span className={`text-sm font-semibold ${hasPending ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {hasPending ? 'Pending invitations' : 'Ready to go'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-300">
                    <p className="font-semibold text-white">{service.lineup?.filter((member) => member.status === 'ACCEPTED').length || 0}</p>
                    <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 mt-1">Accepted</p>
                  </div>
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-300">
                    <p className="font-semibold text-white">{service.lineup?.filter((member) => member.status === 'PENDING').length || 0}</p>
                    <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 mt-1">Pending</p>
                  </div>
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-300">
                    <p className="font-semibold text-white">{service.lineup?.length || 0}</p>
                    <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 mt-1">Total</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {service.lineup?.slice(0, 4).map((member, i) => (
                    <div key={i} className="flex h-11 min-w-[3rem] items-center justify-center rounded-2xl bg-zinc-950 border border-zinc-800 px-3 text-sm font-bold text-white">
                      {member.user?.name?.split(' ').map((word) => word[0]).join('') || '?'}
                    </div>
                  ))}
                  {service.lineup?.length > 4 && (
                    <div className="flex h-11 min-w-[3rem] items-center justify-center rounded-2xl bg-zinc-950 border border-zinc-800 px-3 text-sm font-bold text-zinc-400">
                      +{service.lineup.length - 4}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-zinc-500">
                    <Users size={16} />
                    <span>{service.lineup?.length || 0} team members</span>
                  </div>
                  <ChevronRight className="text-zinc-500 transition-colors group-hover:text-white" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-950/80 p-16 text-center text-zinc-400 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
          <Calendar className="mx-auto mb-6 text-zinc-600" size={56} />
          <h3 className="text-2xl font-bold text-white mb-2">No upcoming services</h3>
          <p className="max-w-xl mx-auto text-sm leading-7 text-zinc-500">
            Create your first worship service and invite your team to participate. Everything you need is available here.
          </p>
        </div>
      )}

      <Link
        to="/services/new"
        className="fixed bottom-24 lg:bottom-12 right-6 lg:right-12 flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black shadow-[0_18px_40px_rgba(255,255,255,0.16)] transition-all hover:-translate-y-0.5 hover:bg-zinc-200 active:scale-95 z-60"
      >
        <Plus size={18} />
        New Service
      </Link>
    </div>
  );
}

export default ServiceList;
