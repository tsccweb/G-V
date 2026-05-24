import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSongById, deleteSong } from '../services/songService';
import { getSettings } from '../services/settingsService';
import { ChevronLeft, Edit, Clock, Trash2 } from 'lucide-react';
import ChordSheetJS from 'chordsheetjs';

function SongDetail() {
  const [fontSize, setFontSize] = useState(16);
  const [activeSection, setActiveSection] = useState(null);
  const [transpose, setTranspose] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: song, isLoading, error } = useQuery({
    queryKey: ['songs', id],
    queryFn: () => getSongById(id)
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSong(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      navigate('/songs');
    }
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this song? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) return <div className="p-8 text-center text-zinc-400">Loading song...</div>;
  if (error) return <div className="p-8 text-center text-white">Error loading song</div>;

  const transposeChord = (chord, amount) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatMap = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    const shift = parseInt(amount) || 0;

    return chord.replace(/[A-G][b#]?/g, (match) => {
      let note = match;
      if (note.endsWith('b')) note = flatMap[note] || note;
      const idx = notes.indexOf(note);
      if (idx === -1) return match;
      let newIdx = (idx + shift) % 12;
      if (newIdx < 0) newIdx += 12;
      return notes[newIdx];
    });
  };

  const getTransposableLyrics = (raw, amount) => {
    if (!raw) return '';
    const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const isChord = (w) => /^[A-G][b#]?(m|maj|min|aug|dim|sus|add|M|2|4|5|6|7|9|11|13)*(?:\/[A-G][b#]?)?$/.test(w);

    return normalized.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      const words = trimmed.split(/\s+/);

      if (words.length > 0 && words.every(isChord)) {
        if (amount === 0) return line.replace(/([A-G][b#]?(?:m|maj|min|aug|dim|sus|add|M|2|4|5|6|7|9|11|13)*(?:\/[A-G][b#]?)?)/gi, '[$1]');

        const regex = /([A-G][b#]?(?:m|maj|min|aug|dim|sus|add|M|2|4|5|6|7|9|11|13)*(?:\/[A-G][b#]?)?)/gi;
        const matches = [];
        let m;
        while ((m = regex.exec(line)) !== null) {
          matches.push({ chord: m[0], index: m.index });
        }

        let offset = 0;
        let newLine = line;

        matches.forEach(({ chord, index }) => {
          const newChord = transposeChord(chord, amount);
          const diff = newChord.length - chord.length;
          const pos = index + offset;

          const before = newLine.substring(0, pos);
          const after = newLine.substring(pos + chord.length);

          let compAfter = after;
          if (diff > 0) {
            for (let i = 0; i < diff; i++) if (compAfter.startsWith(' ')) compAfter = compAfter.substring(1);
          } else if (diff < 0) {
            compAfter = ' '.repeat(Math.abs(diff)) + compAfter;
          }

          const wrapped = '[' + newChord + ']';
          newLine = before + wrapped + compAfter;
          offset += (wrapped.length - chord.length) + (after.length - compAfter.length);
        });
        return newLine;
      }
      return line;
    }).join('\n');
  };

  const isAlreadyChordPro = song.lyrics && song.lyrics.includes('[') && song.lyrics.includes(']');
  const processedLyrics = getTransposableLyrics(song.lyrics || '', isAlreadyChordPro ? 0 : transpose);
  const songObj = new ChordSheetJS.ChordProParser().parse(processedLyrics);
  let transposedSong = songObj;
  // If we already transposed in pre-processor, don't transpose again here
  // unless it was already ChordPro format
  if (transpose !== 0 && isAlreadyChordPro) {
    transposedSong = songObj.transpose(transpose);
  }

  // Custom Section Detection & Rendering
  const formatLyricsWithSections = (songData) => {
    const lines = songData.toString().split('\n');
    const processed = [];
    let currentSection = null;

    lines.forEach((line, idx) => {
      const isSection = line.startsWith('[') && /^(?:Verse|Chorus|Bridge|Intro|Outro|Tag|Refrain|Instrumental).*?]/i.test(line.slice(1));
      if (isSection) {
        currentSection = line.slice(1, -1).toUpperCase();
        processed.push({ type: 'header', content: currentSection, id: `section-${idx}` });
      } else if (line.trim()) {
        processed.push({ type: 'line', content: line });
      } else {
        processed.push({ type: 'spacer' });
      }
    });
    return processed;
  };

  const sections = formatLyricsWithSections(transposedSong);
  const headerSections = sections.filter(s => s.type === 'header');

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  const formatter = new ChordSheetJS.TextFormatter();
  const rawText = formatter.format(transposedSong);

  // Custom Highlighter that preserves spacing
  const highlighted = rawText.split('\n').map(line => {
    // Detect if the line is a section header (comment)
    if (line[0] === '[' && /^(?:Verse|Chorus|Bridge|Intro|Outro|Tag|Refrain|Instrumental).*?]/i.test(line.slice(1))) {
      return `<div class="comment">${line.replace(/[[\]]/g, '')}</div>`;
    }
    // Highlight chords by wrapping them in spans without changing length
    return line.replace(/[[]([^\]]*?)]/g, '<span class="chord">$1</span>');
  }).join('\n');

  return (
    <div className="w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigator */}
      <aside className="lg:w-48 order-2 lg:order-1">
        <div className="sticky top-24 space-y-4">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Navigation</p>
          <div className="space-y-1">
            {headerSections.map((s, i) => (
              <button
                key={i}
                onClick={() => scrollToSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeSection === s.id ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                  }`}
              >
                {s.content}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-900">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-2">Display</p>
            <div className="flex bg-zinc-900 rounded-xl p-1">
              <button onClick={() => setFontSize(s => Math.max(12, s - 2))} className="flex-1 p-2 hover:bg-zinc-800 rounded-lg text-xs font-bold font-serif">A-</button>
              <button onClick={() => setFontSize(s => Math.min(32, s + 2))} className="flex-1 p-2 hover:bg-zinc-800 rounded-lg text-xs font-bold font-serif">A+</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-8 order-1 lg:order-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/songs" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm tracking-tight">LIBRARY</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Transpose Group */}
            <div className="flex bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl h-11 items-stretch overflow-hidden">
              <button
                onClick={() => setTranspose(t => (t - 1 + 12) % 12)}
                className="px-4 flex items-center justify-center hover:bg-white hover:text-black transition-all text-xs font-black border-r border-zinc-800/50"
              >b</button>
              <div className="px-4 flex flex-col items-center justify-center min-w-[4rem]">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Key</span>
                <span className="text-sm font-black text-white leading-none">
                  {song.key ? transposeChord(song.key, transpose) : 'C'}
                </span>
              </div>
              <button
                onClick={() => setTranspose(t => (t + 1) % 12)}
                className="px-4 flex items-center justify-center hover:bg-white hover:text-black transition-all text-xs font-black border-l border-zinc-800/50"
              >#</button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsScrolling(!isScrolling)}
                className={`flex items-center justify-center w-11 h-11 rounded-2xl transition-all border ${isScrolling ? 'bg-white border-white text-black shadow-lg shadow-white/10' : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                title="Toggle Auto-Scroll"
              >
                <Clock size={18} className={isScrolling ? 'animate-spin-slow' : ''} />
              </button>

              <Link
                to={`/songs/${id}/edit`}
                className="flex items-center justify-center w-11 h-11 bg-zinc-900/80 hover:bg-zinc-800 hover:text-white text-zinc-400 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all"
                title="Edit Song"
              >
                <Edit size={18} />
              </Link>

              <button
                onClick={handleDelete}
                className="flex items-center justify-center w-11 h-11 bg-red-500/5 hover:bg-red-500/10 text-red-500/60 hover:text-red-500 rounded-2xl border border-red-900/20 hover:border-red-500/50 transition-all shadow-lg shadow-red-500/5"
                title="Delete Song"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>

        <header className="space-y-4">
          <div className="flex items-end gap-4 overflow-hidden">
            <div className="h-16 w-1 bg-gradient-to-b from-blue-500 to-transparent rounded-full" />
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter leading-none">{song.title}</h1>
              <p className="text-xl text-zinc-500 font-bold mt-2 tracking-tight">{song.artist}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] pt-6 opacity-60">
            {song.key && (
              <span>
                <span className="text-zinc-700 mr-2">KEY</span>
                {transposeChord(song.key, transpose)}
              </span>
            )}
            {song.bpm && <span><span className="text-zinc-700 mr-2">TEMPO</span> {song.bpm} BPM</span>}
            <span><span className="text-zinc-700 mr-2">CATEGORY</span> {song.category || 'GENERAL'}</span>
          </div>
        </header>

        <section className="bg-black/50 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-x-auto">
          <div
            className="chord-sheet p-8 md:p-12"
            style={{ fontSize: `${fontSize}px` }}
          >
            {/* We use the HTML formatter but inject sticky headers or custom style */}
            <pre
              className="bg-transparent border-none p-0 overflow-visible leading-[1.1]"
              style={{ fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit' }}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </div>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .chord-sheet { 
          font-family: '${settings?.fontFamily || 'ui-monospace'}', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', monospace;
        }
        .chord-sheet pre {
          white-space: pre;
          word-break: normal;
          overflow-wrap: normal;
          font-family: inherit;
          margin: 0;
          padding: 0;
        }
        .chord-sheet .paragraph { margin-bottom: 2rem; }
        .chord-sheet .comment { 
          display: block; 
          background: #18181b; 
          color: #ef4444; 
          font-weight: 900; 
          font-size: 0.7em; 
          padding: 0.5rem 1rem; 
          border-radius: 0.5rem; 
          margin: 2rem 0 1rem 0; 
          width: fit-content;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          position: sticky;
          top: 1rem;
          z-index: 10;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .chord-sheet .chord { 
          color: ${settings?.chordColor || '#60a5fa'}; 
          font-weight: bold; 
          margin-bottom: -0.1rem;
          white-space: pre; 
          display: block;
        }
        .chord-sheet .lyrics { 
          color: #d4d4d8; 
          font-weight: 500; 
          white-space: pre;
        }
        .chord-sheet td { padding-right: 0.1em; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}} />
    </div>
  );
}

export default SongDetail;
