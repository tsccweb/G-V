import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFlowById, syncState, getState, joinByCode } from '../services/worshipFlowService';
import { getSettings } from '../services/settingsService';
import { getServiceById, goLiveService } from '../services/serviceService';
import useAuthStore from '../store/authStore';
import {
  ChevronLeft, Play, FastForward, RotateCcw, X, Settings2, Plus,
  Trash2, Upload, Minus, List, History, Pause, AlignLeft, Eye,
  Radio, Share2, Music, Type, Palette, Gauge, ArrowLeft, Maximize2,
  Copy, CheckCircle2, ChevronRight, Sliders, Settings
} from 'lucide-react';
import ChordSheetJS from 'chordsheetjs';

function LiveWorshipMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Mode & Role State
  const [viewType, setViewType] = useState('audience'); // 'audience', 'musician', 'leader'
  const [isHosting, setIsHosting] = useState(false);

  // Interaction State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [scrollSpeed, setScrollSpeed] = useState(5); // 1-10
  const [localFontSize, setLocalFontSize] = useState(24);
  const [transpose, setTranspose] = useState(0);

  // UI State
  const [showShare, setShowShare] = useState(false);
  const [showSongList, setShowSongList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScrollPanel, setShowScrollPanel] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const scrollRef = useRef(null);
  const isJumping = useRef(false);

  // Mutations
  const goLiveMutation = useMutation({
    mutationFn: () => goLiveService(id),
    onSuccess: (newSession) => {
      queryClient.setQueryData(['liveSession', id], (oldData) => {
        if (oldData?.items || oldData?.songs || oldData?.lineup) {
          return { ...oldData, liveSession: newSession };
        }
        return newSession;
      });
      setIsHosting(true);
    }
  });

  // Fetch Live Data
  const { data: session, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['liveSession', id],
    queryFn: () => {
      if (id.length === 6) return joinByCode(id);
      if (window.location.pathname.startsWith('/live/')) return getState(id);
      if (window.location.pathname.includes('/services/')) return getServiceById(id);
      return getFlowById(id);
    },
    refetchInterval: isHosting ? false : 2000,
    retry: false
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings
  });

  const flow = session?.worshipFlow || session?.service || session;
  const sessionCode = session?.sessionCode || session?.liveSession?.sessionCode;
  const liveSessionId = session?.liveSession?.id || (session?.sessionCode ? session?.id : null);
  const items = flow?.songs || flow?.items || [];
  const currentItem = items[currentIndex];

  // Role Logic — grant leader view to service/flow owners + elevated roles
  useEffect(() => {
    if (user) {
      const isOwner = user.id === flow?.userId || user.id === flow?.createdBy?.id;
      if (isOwner || ['ADMIN', 'WORSHIP_LEADER', 'PASTOR'].includes(user.role)) setViewType('leader');
      else if (['MUSICIAN', 'GUITARIST', 'KEYBOARDIST', 'BASSIST', 'DRUMMER'].includes(user.role)) setViewType('musician');
      else setViewType('audience');
    }
  }, [user, flow]);

  // Auto-Start Broadcasting for Leaders
  useEffect(() => {
    if (viewType === 'leader' && session && !isHosting) {
      if (sessionCode) {
        setIsHosting(true);
      } else if (!goLiveMutation.isPending && !goLiveMutation.isSuccess) {
        goLiveMutation.mutate();
      }
    }
  }, [viewType, session, isHosting, sessionCode, goLiveMutation.isPending, goLiveMutation.isSuccess]);

  // Content Parsing (Split by Section Header for accurate labeling)
  const slides = useMemo(() => {
    const rawSong = currentItem?.song || currentItem;
    if (!rawSong?.lyrics) return [];

    const lyrics = rawSong.lyrics.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split by section markers like [Verse 1]
    const sectionRegex = /(\[(?:Verse|Chorus|Bridge|Intro|Outro|Tag|Refrain|Instrumental|Solo|Interlude|Ending|VAMP|Pre-Chorus|PreChorus).*?\])/i;
    const parts = lyrics.split(sectionRegex);

    const result = [];
    // If the song doesn't start with a header, the first part is 'no header'
    let currentPart = { label: 'SONG', raw: '' };

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (sectionRegex.test(part)) {
        // If we have content in the previous part, push it
        if (currentPart.raw.trim()) {
          currentPart.raw = currentPart.raw.trim(); // Trim extra newlines
          currentPart.content = currentPart.raw; 
          result.push(currentPart);
        }
        // Start a new part with this header
        currentPart = { label: part.replace(/[\[\]]/g, '').toUpperCase(), raw: '', content: '' };
      } else {
        currentPart.raw += part;
      }
    }
    if (currentPart.raw.trim()) {
      currentPart.raw = currentPart.raw.trim(); // Trim extra newlines
      currentPart.content = currentPart.raw;
      result.push(currentPart);
    }

    return result;
  }, [currentItem]);

  const activeSlide = slides[currentSlideIndex];
  
  // Calculate initial transposition when song changes
  useEffect(() => {
    if (currentItem?.type === 'SONG' && currentItem.key && currentItem.song?.key) {
      const keys = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
      const flatMap = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
      
      const getNormKey = (k) => {
        if (!k) return 'C';
        let nk = k.split(' ')[0]; // Remove extra info like ' (Original)'
        if (nk.endsWith('b')) nk = flatMap[nk] || nk;
        return nk;
      };

      const fromIdx = keys.indexOf(getNormKey(currentItem.song.key));
      const toIdx = keys.indexOf(getNormKey(currentItem.key));
      
      if (fromIdx !== -1 && toIdx !== -1) {
        let diff = (toIdx - fromIdx) % 12;
        while (diff < 0) diff += 12;
        setTranspose(diff);
      }
    } else {
      setTranspose(0);
    }
  }, [currentIndex, currentItem]);

  // Section Jump Buttons (Unique sections in current song)
  const sections = useMemo(() => {
    const seen = new Set();
    return slides.map((s, idx) => ({ label: s.label, index: idx }))
      .filter(s => {
        if (seen.has(s.label)) return false;
        seen.add(s.label);
        return true;
      });
  }, [slides]);

  // Sync Mutation (Leader)
  const syncMutation = useMutation({
    mutationFn: (state) => syncState(liveSessionId, state),
  });

  // Leader Sync Effect
  useEffect(() => {
    if (isHosting && liveSessionId) {
      syncMutation.mutate({
        currentItemId: items[currentIndex]?.id,
        currentSlide: currentSlideIndex,
        isPaused,
        // We'll skip raw scroll sync for simplicity, matching slides is more important
      });
    }
  }, [currentIndex, currentSlideIndex, isPaused, isHosting]);

  // Follower Sync Effect
  useEffect(() => {
    if (!isHosting && session) {
      const liveIdx = items.findIndex(item => item.id === session.currentItemId);
      if (liveIdx !== -1) {
        setCurrentIndex(liveIdx);
        setCurrentSlideIndex(session.currentSlide);
        setIsPaused(session.isPaused);
      }
    }
  }, [session, isHosting]);

  // Auto-Scroll Logic (Smooth requestAnimationFrame version)
  useEffect(() => {
    if (isPaused) return;

    let lastTime = performance.now();
    let frame;

    const scroll = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      
      // Speed calculation: Quadratic scale for better range
      // 1: ~40px/s, 5: ~520px/s, 10: ~2020px/s
      const pixelsPerSecond = Math.pow(scrollSpeed, 2) * 20 + 20;
      const distance = (pixelsPerSecond * deltaTime) / 1000;
      
      if (scrollRef.current && !isJumping.current) {
        scrollRef.current.scrollBy(0, distance);
      }
      
      lastTime = currentTime;
      frame = requestAnimationFrame(scroll);
    };

    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [isPaused, scrollSpeed]);

  // Handlers
  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      handleNextSong();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    } else {
      handlePrevSong();
    }
  };

  const handleNextSong = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentSlideIndex(0);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  };

  const handlePrevSong = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCurrentSlideIndex(0);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  };

  const jumpToSong = (idx) => {
    setCurrentIndex(idx);
    setCurrentSlideIndex(0);
    setShowSongList(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const jumpToSection = (index) => {
    setCurrentSlideIndex(index);
    isJumping.current = true;
    
    // Smooth scroll to the highlighted section
    const el = document.getElementById(`slide-${index}`);
    if (el && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: el.offsetTop - 120, // 120px offset for the top HUD
        behavior: 'smooth'
      });
    }

    // Reset jump flag after smooth scroll is likely done
    setTimeout(() => {
      isJumping.current = false;
    }, 800);
  };

  const copyJoinLink = () => {
    const link = `${window.location.origin}/join?code=${session?.sessionCode}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (sessionLoading) return <div className="p-8 text-center text-zinc-400 bg-black min-h-screen flex items-center justify-center font-black tracking-tighter text-4xl animate-pulse">{'G>/\\V LIVE...'}</div>;
  if (sessionError || !session) return (
    <div className="p-8 text-center text-zinc-400 bg-black min-h-screen flex flex-col items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-800 mb-4">
        <X size={48} className="text-zinc-600" />
      </div>
      <h2 className="text-3xl font-black text-white uppercase tracking-tight">Session Ended</h2>
      <p className="text-zinc-500 max-w-xs text-sm leading-relaxed">This worship session is no longer active or the invitation has expired.</p>
      <Link to="/" className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all uppercase tracking-widest text-xs">Return Home</Link>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 flex flex-col overflow-hidden select-none"
      style={{ 
        backgroundColor: settings?.bgColor || '#000000', 
        color: settings?.textColor || '#ffffff',
        fontFamily: settings?.fontFamily || 'sans-serif'
      }}
    >
      {/* Top HUD — Minimal */}
      <div className="px-3 py-2 md:px-6 md:py-4 flex items-center justify-between border-b border-white/[0.05] bg-black/50 backdrop-blur-3xl z-50">
        <div className="flex items-center gap-3 md:gap-6 min-w-0">
          <button onClick={() => navigate(-1)} className="shrink-0 p-2 md:p-3 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl md:rounded-2xl transition-all border border-white/[0.05]">
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm md:text-lg font-black tracking-tight leading-none uppercase truncate">
              {currentItem?.song?.title || currentItem?.title || 'Waiting...'}
            </h2>
            <div className="flex items-center gap-2 mt-1 overflow-hidden">
              <span className="shrink-0 px-1.5 py-0.5 bg-white/10 rounded-md text-[8px] md:text-[9px] font-black tracking-tight text-zinc-400 uppercase">
                {currentIndex + 1} / {items.length}
              </span>
              <p className="text-[9px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest truncate">{flow?.title || 'Live Worship'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          {/* Font Size Adjusters (Hidden on mobile to save space, accessible via Settings drawer) */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-zinc-900/50 rounded-xl border border-white/0.05">
            <button
              onClick={(e) => { e.stopPropagation(); setLocalFontSize(v => Math.max(12, v - 2)); }}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-zinc-500 hover:text-amber-500 hover:bg-white/5 rounded-lg transition-all"
            >
              <Type size={14} />
            </button>
            <span className="text-[10px] font-black text-zinc-300 w-4 text-center">{localFontSize}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setLocalFontSize(v => Math.min(64, v + 2)); }}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-zinc-500 hover:text-amber-500 hover:bg-white/5 rounded-lg transition-all"
            >
              <Type size={18} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3 bg-zinc-900/30 p-1 md:p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setShowShare(true)}
              className="p-2 md:p-3 hover:bg-zinc-800 rounded-xl transition-all group"
              title="Share Service"
            >
              <Share2 size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
            </button>



            {/* Session code block (Hidden on mobile to save space, accessible via Share button) */}
            {sessionCode && (
              <div className="hidden sm:flex bg-white text-black px-2.5 py-1.5 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl items-center gap-2 group cursor-pointer hover:bg-zinc-200 transition-all shadow-xl" onClick={copyJoinLink}>
                <span className="text-xs md:text-lg font-mono font-black tracking-widest leading-none">{sessionCode}</span>
                {copySuccess ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} className="text-zinc-400" />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Presentation Surface */}
      <main className="flex-1 flex relative overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-20 py-16 md:py-24 scroll-smooth scrollbar-hide"
        >
          <div className="max-w-5xl mx-auto space-y-12 md:space-y-16 mb-96">
            {slides.map((slide, idx) => (
              <div key={idx} id={`slide-${idx}`} className="space-y-3 md:space-y-4 transition-all duration-500">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] md:text-[11px] font-black text-zinc-600 tracking-[0.3em] md:tracking-[0.5em] uppercase whitespace-nowrap">
                    {slide.label}
                  </span>
                  <div className="h-px bg-zinc-900 w-full" />
                </div>
                <div style={{ fontSize: `${localFontSize}px`, fontFamily: settings?.fontFamily || 'inherit' }} className="leading-tight">
                  {viewType === 'musician' || viewType === 'leader' ? (
                    <ChordSheetRenderer lyrics={slide.raw} transpose={transpose} fontSize={localFontSize} settings={settings} />
                  ) : (
                    <div className="font-bold tracking-tight whitespace-pre-line leading-relaxed" style={{ color: settings?.textColor || 'inherit' }}>
                      {slide.content.replace(/\[.*?\]/g, '')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Section Shortcuts — right side amber pills */}
        {(viewType === 'musician' || viewType === 'leader') && (
          <div className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 md:gap-3 z-40">
            {sections.map((sec, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); jumpToSection(sec.index); }}
                className={`px-2.5 py-1.5 md:w-28 md:py-3 rounded-lg md:rounded-2xl text-[8px] md:text-[10px] font-black tracking-wide md:tracking-widest transition-all border ${slides[currentSlideIndex]?.label === sec.label
                  ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30'
                  : 'bg-zinc-900/80 text-zinc-500 border-zinc-700/50 hover:text-amber-400 hover:border-amber-500/50 backdrop-blur-xl'
                  }`}
              >
                {sec.label.slice(0, 3)}
              </button>
            ))}
          </div>
        )}

        {/* Settings Drawer (toggleable from bottom toolbar) */}
        {showSettings && viewType !== 'audience' && (
          <div className="absolute bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="mx-3 mb-2 p-4 bg-zinc-900/95 backdrop-blur-3xl border border-white/5 rounded-2xl shadow-2xl space-y-3">
              {/* Transpose */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Key</span>
                <div className="flex items-center gap-2 bg-black/50 p-1 rounded-xl border border-white/5">
                  <button onClick={() => setTranspose(t => (t - 1 + 12) % 12)} className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg text-sm font-black text-blue-400">♭</button>
                  <span className="text-sm font-black text-white min-w-[2rem] text-center">{transposeChord(currentItem?.song?.key || 'C', transpose)}</span>
                  <button onClick={() => setTranspose(t => (t + 1) % 12)} className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg text-sm font-black text-blue-400">♯</button>
                </div>
              </div>
              {/* Font Size */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Font Size</span>
                <div className="flex items-center gap-3">
                  <input type="range" min="12" max="64" value={localFontSize} onChange={(e) => setLocalFontSize(parseInt(e.target.value))} className="w-28 accent-white" />
                  <span className="text-[10px] font-black text-zinc-400 min-w-[20px]">{localFontSize}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll Speed Panel (toggleable) */}
        {showScrollPanel && (
          <div className="absolute bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="mx-3 mb-2 p-4 bg-zinc-900/95 backdrop-blur-3xl border border-white/5 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Scroll Speed</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-zinc-600">Slow</span>
                <input
                  type="range" min="1" max="10" value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                  className="flex-1 accent-white"
                />
                <span className="text-[10px] font-bold text-zinc-600">Fast</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Toolbar — Universal for all roles */}
      <div className="z-50 bg-black border-t border-white/[0.05]">
        <div className="flex items-center justify-between px-3 py-2 md:px-8 md:py-4">
          {/* Song List */}
          <button
            onClick={() => setShowSongList(true)}
            className="p-2.5 md:p-3 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-all border border-white/5"
          >
            <List size={18} />
          </button>

          {/* Prev Song */}
          <button onClick={(e) => { e.stopPropagation(); handlePrevSong(); }} className="p-2 text-zinc-500 hover:text-white transition-all">
            <ChevronLeft size={22} />
          </button>

          {/* Play / Start */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
            className={`flex items-center gap-2 px-6 md:px-10 py-2.5 md:py-3 rounded-2xl font-black text-xs md:text-sm tracking-wider transition-all active:scale-95 ${isPaused ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-zinc-800 text-white border border-zinc-700'
              }`}
          >
            {isPaused ? <><Play size={16} className="fill-black" /> Start</> : <><Pause size={16} className="fill-white" /> Pause</>}
          </button>

          {/* Next Song */}
          <button onClick={(e) => { e.stopPropagation(); handleNextSong(); }} className="p-2 text-zinc-500 hover:text-white transition-all">
            <ChevronRight size={22} />
          </button>

          {/* Scroll Speed Toggle */}
          <button
            onClick={() => { setShowScrollPanel(!showScrollPanel); setShowSettings(false); }}
            className={`p-2.5 md:p-3 rounded-xl transition-all border border-white/5 ${showScrollPanel ? 'bg-white text-black' : 'bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400'
              }`}
          >
            <Sliders size={18} />
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => { setShowSettings(!showSettings); setShowScrollPanel(false); }}
            className={`p-2.5 md:p-3 rounded-xl transition-all border border-white/5 ${showSettings ? 'bg-white text-black' : 'bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400'
              }`}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Share Overlay */}
      {showShare && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl animate-in fade-in duration-500">
          <button onClick={() => setShowShare(false)} className="absolute top-8 right-8 p-4 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-all">
            <X size={24} />
          </button>

          <div className="max-w-md w-full flex flex-col items-center text-center space-y-10">
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-white tracking-tight uppercase">Share Service</h1>
              <p className="text-zinc-500 text-sm font-medium tracking-wide">Invite musicians and audience to follow live.</p>
            </div>

            <div className="bg-white p-6 rounded-[3rem] shadow-[0_0_100px_rgba(255,255,255,0.15)] scale-110">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${window.location.origin}/join?code=${sessionCode}`}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>

            {sessionCode ? (
              <div className="w-full space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-2 shadow-2xl">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">6-DIGIT CODE</p>
                  <p className="text-6xl font-mono font-black text-white tracking-[0.3em]">{sessionCode}</p>
                </div>

                <button
                  onClick={copyJoinLink}
                  className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-3xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  {copySuccess ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                  {copySuccess ? 'LINK COPIED' : 'COPY RE-JOIN LINK'}
                </button>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-10 flex flex-col items-center gap-4">
                  <div className="p-4 bg-zinc-800 rounded-full text-zinc-500">
                    <Radio size={48} />
                  </div>
                  <p className="text-zinc-400 font-medium tracking-wide">Service is not live yet.</p>
                </div>
                <button
                  onClick={() => { goLiveMutation.mutate(); }}
                  disabled={goLiveMutation.isLoading}
                  className="w-full py-5 bg-amber-500 text-black font-black uppercase tracking-widest rounded-3xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3"
                >
                  <Radio size={20} />
                  {goLiveMutation.isLoading ? 'STARTING...' : 'GO LIVE NOW'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Song List Drawer */}
      {showSongList && (
        <div className="fixed inset-0 z-[110] flex animate-in fade-in duration-500">
          <div className="flex-1 bg-black/60 backdrop-blur-md" onClick={() => setShowSongList(false)} />
          <div className="w-full max-w-sm bg-zinc-950 border-l border-white/5 p-8 flex flex-col animate-in slide-in-from-right-full duration-500">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black uppercase tracking-widest">Worship Flow</h3>
              <button onClick={() => setShowSongList(false)} className="p-2 hover:bg-zinc-900 rounded-xl">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => jumpToSong(idx)}
                  className={`w-full p-5 rounded-2xl flex items-center gap-5 transition-all text-left border ${currentIndex === idx ? 'bg-white text-black border-white shadow-xl' : 'bg-zinc-900/50 border-white/5 hover:border-white/10 text-zinc-400 hover:text-white'}`}
                >
                  <span className="text-[10px] font-black opacity-30">{idx + 1}</span>
                  <div className="flex-1 truncate">
                    <p className="font-black uppercase tracking-tight text-sm truncate">{item.song?.title || item.title}</p>
                    <p className={`text-[10px] font-bold mt-0.5 ${currentIndex === idx ? 'text-black/50' : 'text-zinc-600'}`}>{item.song?.key || 'KEY ?'} · {item.type || 'SONG'}</p>
                  </div>
                  {currentIndex === idx && <Play size={16} className="fill-black" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .chord-rendering-wrap {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .chord-renderer.is-presentation {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          text-align: center;
        }
        .chord-renderer.is-presentation table {
          margin: 0 auto;
          width: auto;
        }
        .chord-renderer { 
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
          white-space: pre !important;
          line-height: 1.2 !important;
        }
        .chord-renderer .chord, .chord-renderer .chord-line { 
          color: ${settings?.chordColor || '#60a5fa'} !important; 
          font-weight: bold !important; 
          white-space: pre !important; 
          display: inline !important;
        }
        .chord-renderer .lyrics { color: #f4f4f5; font-weight: 700; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        input[type=range] { -webkit-appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: white; cursor: pointer; margin-top: -6px; border: 2px solid #3b82f6; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: #27272a; border-radius: 2px; }
      `}} />
    </div>
  );
}

// Sub-component for rendering lines with chords natively using ChordSheetJS
function ChordSheetRenderer({ lyrics: rawLyrics, transpose, fontSize, isSlide, settings }) {
  const renderedHtml = useMemo(() => {
    try {
      const isAlreadyChordPro = rawLyrics.includes('[') && rawLyrics.includes(']');
      
      // If it's already ChordPro, we don't use getTransposableLyrics (which is for plain text)
      // Instead, we parse directly and transpose using ChordSheetJS
      let songObj;
      if (isAlreadyChordPro) {
        songObj = new ChordSheetJS.ChordProParser().parse(rawLyrics);
        if (transpose !== 0) {
          songObj = songObj.transpose(transpose);
        }
      } else {
        // For plain text, we use getTransposableLyrics to convert to ChordPro first
        const chordProLyrics = getTransposableLyrics(rawLyrics, transpose);
        songObj = new ChordSheetJS.ChordProParser().parse(chordProLyrics);
      }

      // Convert to HTML using a custom formatter or manual replacement
      // TextFormatter gives plain text with chords on top, no brackets.
      // We'll use a formatter that keeps brackets for easier styling if needed,
      // or just handle the TextFormatter output.
      const formatter = new ChordSheetJS.TextFormatter();
      const rawText = formatter.format(songObj);

      // Re-map the multi-line text to apply our .chord styling
      // TextFormatter output:
      //  C     G
      // Lyrics...
      // We need to identify which lines are chord lines.
      return rawText.split('\n').map(line => {
        // If the line is purely chords (and spaces), wrap it in a span
        if (line.trim() && line.split(/\s+/).every(w => !w || /^[A-G][b#]?(m|maj|min|aug|dim|sus|add|M|2|4|5|6|7|9|11|13)*(?:\/[A-G][b#]?)?$/.test(w))) {
          return `<span class="chord-line">${line}</span>`;
        }
        return line;
      }).join('\n');
    } catch (err) {
      console.error('Chord parsing error:', err);
      return rawLyrics;
    }
  }, [rawLyrics, transpose]);

  return (
    <pre
      className={`chord-renderer ${isSlide ? 'is-presentation' : ''}`}
      style={{
        fontSize: isSlide ? 'inherit' : `${fontSize}px`,
        fontFamily: settings?.fontFamily || 'inherit',
        color: settings?.textColor || 'inherit'
      }}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

// Helper for transposable lyrics matching SongDetail
function getTransposableLyrics(raw, amount) {
  if (!raw) return '';
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const isChord = (w) => /^[A-G][b#]?(m|maj|min|aug|dim|sus|add|M|2|4|5|6|7|9|11|13)*(?:\/[A-G][b#]?)?$/.test(w);

  return normalized.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);

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
        const wrapped = '[' + newChord + ']';
        
        // We replace the chord with the bracketed version
        // Pre-calculating padding is not needed if we are going into ChordProParser next,
        // but we want to maintain the relative visual position if possible.
        const before = newLine.substring(0, index + offset);
        const after = newLine.substring(index + offset + chord.length);
        
        newLine = before + wrapped + after;
        offset += (wrapped.length - chord.length);
      });
      return newLine;
    }
    return line;
  }).join('\n');
}

// Helper for display transposition labels
function transposeChord(chord, amount) {
  if (!chord) return 'C';
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flatMap = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

  return chord.replace(/[A-G][b#]?/g, (match) => {
    let note = match;
    if (note.endsWith('b')) note = flatMap[note] || note;
    const idx = notes.indexOf(note);
    if (idx === -1) return match;
    let newIdx = (idx + amount) % 12;
    while (newIdx < 0) newIdx += 12;
    return notes[newIdx];
  });
}

export default LiveWorshipMode;
