import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createService } from '../services/serviceService';
import { Calendar, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function ServiceForm() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createService,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      navigate(`/services/${data.id}`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !date) return;
    mutation.mutate({ title, date, notes });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/services" className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors border border-zinc-800">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-white">Create New Service</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        {mutation.isError && (
          <div className="p-4 bg-red-900/20 border border-red-900/50 text-white rounded-xl">
            Failed to create service. Please try again.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Service Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white focus:outline-none transition-all text-white placeholder-zinc-700"
              placeholder="e.g. Sunday Morning Worship"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Service Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white focus:outline-none transition-all text-white placeholder-zinc-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white focus:outline-none transition-all text-white placeholder-zinc-700 min-h-[100px]"
              placeholder="Any special instructions or focus for this service..."
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all shadow-lg shadow-white/5 disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating...' : (
              <>
                <Save size={20} />
                <span>Create Service</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ServiceForm;
