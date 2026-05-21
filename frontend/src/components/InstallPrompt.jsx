import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted install prompt');
    } else {
      console.log('User dismissed install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-0 left-4 right-4 md:left-0 md:right-0 md:max-w-sm md:bottom-6 md:right-6 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl shadow-2xl p-4 text-white">
        <div className="flex items-start gap-3">
          <Download className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm md:text-base">Install G>/\V</h3>
            <p className="text-xs md:text-sm text-emerald-50 mt-1">Install our app on your device for the best experience</p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-emerald-50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-xs md:text-sm font-medium transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-3 py-2 rounded-lg bg-white text-emerald-600 hover:bg-emerald-50 text-xs md:text-sm font-bold transition-colors"
          >
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
}
