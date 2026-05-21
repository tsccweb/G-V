import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { joinByCode } from '../services/worshipFlowService';
import { Radio, Hash, ArrowRight, Music2, Camera, X, ChevronLeft } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

function JoinSession() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const joinMutation = useMutation({
    mutationFn: (sessionCode) => joinByCode(sessionCode),
    onSuccess: (session) => {
      navigate(`/live/${session.id}`);
    },
    onError: () => {
      setError('Session not found or has ended. Please check the code.');
    }
  });

  // Auto-join when code is present in URL query params (from QR scan)
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && /^\d{6}$/.test(urlCode)) {
      setCode(urlCode);
      joinMutation.mutate(urlCode);
    }
  }, [searchParams]);

  // Extract 6-digit code from scanned text
  const extractCode = (text) => {
    // Check if it's a URL with ?code=123456
    try {
      const url = new URL(text);
      const codeParam = url.searchParams.get('code');
      if (codeParam && /^\d{6}$/.test(codeParam)) return codeParam;
    } catch {}
    // Check if the text itself is 6 digits
    const match = text.match(/(\d{6})/);
    return match ? match[1] : null;
  };

  // Start scanner
  const startScanner = async () => {
    setScannerError('');
    setScannerOpen(true);

    // Wait for DOM element to render
    await new Promise(r => setTimeout(r, 300));

    if (!scannerRef.current) return;

    const html5QrCode = new Html5Qrcode('qr-reader');
    html5QrCodeRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          const sessionCode = extractCode(decodedText);
          if (sessionCode) {
            setCode(sessionCode);
            stopScanner();
            joinMutation.mutate(sessionCode);
          }
        },
        () => {} // Ignore scan failures
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setScannerError('Could not access camera. Please allow camera permissions.');
      setScannerOpen(false);
    }
  };

  // Stop scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {}
      html5QrCodeRef.current = null;
    }
    setScannerOpen(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try { html5QrCodeRef.current.stop(); } catch {}
      }
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setError('');
    joinMutation.mutate(code);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors z-20"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="w-full max-w-md space-y-8 mt-12 md:mt-0">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-[2rem] flex items-center justify-center mx-auto">
            <Music2 size={40} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Join Worship</h1>
            <p className="text-zinc-500 mt-2">Enter the session code to join the live worship flow</p>
          </div>
        </div>

        {/* Code Input */}
        <form onSubmit={handleJoin} className="space-y-6">
          <div className="relative">
            <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={24} />
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              placeholder="000000"
              className="w-full pl-14 pr-6 py-6 bg-zinc-900 border border-zinc-800 rounded-3xl text-center text-3xl font-mono font-black tracking-[0.5em] text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-800"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-2xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={code.length !== 6 || joinMutation.isPending}
            className="w-full py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-xl shadow-blue-500/20"
          >
            {joinMutation.isPending ? (
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white" />
            ) : (
              <>
                <Radio size={20} />
                <span>Join Session</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-xs font-bold">OR SCAN QR CODE</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* QR Scanner */}
        <div className="text-center space-y-4">
          {!scannerOpen ? (
            <button
              onClick={startScanner}
              className="w-48 h-48 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-3xl flex flex-col items-center justify-center mx-auto gap-3 hover:border-blue-500/50 hover:bg-zinc-900/80 transition-all group cursor-pointer"
            >
              <Camera size={32} className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
              <p className="text-zinc-500 text-sm font-bold group-hover:text-blue-400 transition-colors">Tap to Scan</p>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-3xl overflow-hidden border border-zinc-700 mx-auto max-w-[280px]">
                <div id="qr-reader" ref={scannerRef} className="w-full" />
                <button
                  onClick={stopScanner}
                  className="absolute top-3 right-3 z-10 p-2 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-red-500/80 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-zinc-600 text-xs">Point your camera at the QR code</p>
            </div>
          )}

          {scannerError && (
            <p className="text-red-400 text-xs mt-2">{scannerError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default JoinSession;
