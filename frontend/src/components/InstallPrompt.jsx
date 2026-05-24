import { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user has already dismissed the prompt recently (7 days)
    const lastDismissed = localStorage.getItem('installPromptDismissed');
    if (lastDismissed && Date.now() - parseInt(lastDismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    if (ios) {
      setShowPrompt(true);
    } else {
      // Listen for beforeinstallprompt event (Android/Chrome)
      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // iOS doesn't have a programmatic prompt, so we just show the instructions
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      // install prompt accepted
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('installPromptDismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[9999] animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-5 text-white overflow-hidden relative">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        
        <div className="flex items-start gap-4">
          <img src="/logo-192.png" alt="G>/\V" className="w-12 h-12 rounded-xl shadow-md grayscale" />
          
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-bold text-base">Install G{'>'}/\\V</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              {isIOS 
                ? "Tap the share button and select 'Add to Home Screen' for the full experience."
                : "Add G{'>'}/\\V to your home screen for quick access and offline use."}
            </p>
          </div>
          
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-sm font-medium transition-all"
          >
            Not Now
          </button>
          
          {isIOS ? (
            <div className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20">
              <Share className="w-4 h-4" />
              <span>Tap Share</span>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="flex-[1.5] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              Install Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
