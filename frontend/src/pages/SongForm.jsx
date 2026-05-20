import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSong, updateSong, getSongById } from '../services/songService';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

function SongForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    lyrics: '',
    key: '',
    capo: 0,
    bpm: '',
    language: '',
    notes: '',
    tags: '',
    category: ''
  });

  const { data: song } = useQuery({
    queryKey: ['songs', id],
    queryFn: () => getSongById(id),
    enabled: isEdit
  });

  useEffect(() => {
    if (song) {
      setFormData({
        ...song,
        tags: Array.isArray(song.tags) ? song.tags.join(', ') : '',
        bpm: song.bpm || '',
        category: song.category || ''
      });
    }
  }, [song]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateSong(id, data) : createSong(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success(`${formData.title} ${isEdit ? 'updated' : 'added'}!`);
      navigate('/songs');
    },
    onError: (err) => {
      // Error is handled by mutation.error
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      bpm: formData.bpm ? parseInt(formData.bpm) : null,
      capo: parseInt(formData.capo) || 0
    };
    mutation.mutate(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
          <span>Cancel</span>
        </button>
        <h1 className="text-2xl font-bold text-white">{isEdit ? 'Edit Song' : 'New Song'}</h1>
        <button
          type="submit"
          form="song-form"
          disabled={mutation.isLoading}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl shadow-lg shadow-white/5 transition-all disabled:opacity-50"
        >
          <span>{mutation.isLoading ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      {mutation.isError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold animate-in fade-in duration-300">
          {mutation.error.response?.data?.message || mutation.error.response?.data?.error || 'Failed to save song'}
          {mutation.error.response?.status === 403 && (
            <button 
              onClick={() => navigate('/pricing')}
              className="ml-4 underline hover:text-white"
            >
              Upgrade Plan
            </button>
          )}
        </div>
      )}

      <form id="song-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Amazing Grace"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Artist</label>
              <input
                type="text"
                name="artist"
                value={formData.artist}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Chris Tomlin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Key</label>
              <select
                name="key"
                value={formData.key}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Key</option>
                {['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
                <option disabled className="text-zinc-600">--- Minor ---</option>
                {['Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Uncategorized</option>
                  <option value="Pre-Worship">Pre-Worship</option>
                  <option value="Worship">Worship</option>
                  <option value="Praise">Praise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">BPM</label>
                <input
                  type="number"
                  name="bpm"
                  value={formData.bpm}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="72"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder="Special arrangement notes..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Lyrics & Chords (ChordPro format: [G]Amazing [C]grace)
          </label>
          <textarea
            name="lyrics"
            value={formData.lyrics}
            onChange={handleChange}
            rows={12}
            className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            placeholder="[G]Amazing grace, how [C]sweet the [G]sound..."
            required
          />
        </div>

      </form>
    </div>
  );
}

export default SongForm;
