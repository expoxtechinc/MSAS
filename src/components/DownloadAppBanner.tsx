import { useState, useEffect } from 'react';
import { Download, Sparkles, X, Share, PlusSquare, Monitor, Smartphone, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DownloadAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [isSuccessfullyInstalled, setIsSuccessfullyInstalled] = useState(false);

  useEffect(() => {
    // Detect if already running in standalone PWA mode
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isPwa) {
      return;
    }

    // Check if dismissed previously in this session
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    if (isDismissed) {
      return;
    }

    // Capture standard install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show banner automatically after 4 seconds for maximum visibility
    const timer = setTimeout(() => {
      if (!isDismissed && !isPwa) {
        setIsVisible(true);
      }
    }, 4050);

    // Track successful install
    const handleAppInstalled = () => {
      setIsSuccessfullyInstalled(true);
      setIsVisible(false);
      setTimeout(() => setIsSuccessfullyInstalled(false), 5000);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsVisible(false);
      }
    } else {
      // Auto detect OS for customized PWA installation helper instructions
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
        setActiveTab('ios');
      } else if (/android/i.test(userAgent)) {
        setActiveTab('android');
      } else {
        setActiveTab('desktop');
      }
      setShowInstructions(true);
    }
  };

  const dismissBanner = () => {
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
    setIsVisible(false);
  };

  return (
    <>
      {/* Installed Toast Notification */}
      <AnimatePresence>
        {isSuccessfullyInstalled && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 font-medium text-sm"
          >
            <Check className="bg-emerald-500 rounded-full p-0.5 text-white" size={18} />
            <span>Success! The School of Excellence Portal App was loaded successfully to your device layout.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Installation Banner */}
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-45 bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col gap-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="w-14 h-14 bg-blue-50 p-1 rounded-2xl shadow-inner border flex items-center justify-center shrink-0">
                  <img 
                    src="https://www.image2url.com/r2/default/images/1780845091129-72ef205c-ec0e-4094-ab80-0cd92282f531.jpg" 
                    alt="App Icon" 
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="bg-blue-105 text-blue-600 font-mono text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md">PWA Certified</span>
                    <span className="flex text-amber-500 font-bold text-xs">★★★★★</span>
                  </div>
                  <h4 className="font-display font-extrabold text-slate-800 text-sm leading-tight mt-0.5">
                    DASBMSE Portal App
                  </h4>
                  <p className="text-xs text-slate-500 leading-normal mt-0.5">
                    Add the world's most advanced, lightweight high school portal immediately to your device.
                  </p>
                </div>
              </div>

              <button 
                onClick={dismissBanner}
                className="p-1 px-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-50 mt-1">
              <button 
                onClick={triggerInstall}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Download size={14} />
                <span>Download & Install App</span>
              </button>
              <button 
                onClick={() => {
                  setShowInstructions(true);
                }}
                className="px-3.5 py-2.5 bg-slate-105 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Setup Guide
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Details Installation Overlay Helper Guide */}
      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 overflow-hidden space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-blue-600 animate-pulse" size={18} />
                    <span className="text-[10px] text-blue-600 font-mono font-bold uppercase tracking-widest">Instant App Setup</span>
                  </div>
                  <h3 className="font-display font-extrabold text-slate-900 text-xl md:text-2xl">
                    Get the Portal on Your Screen
                  </h3>
                  <p className="text-xs text-slate-500">
                    No App Store or Google Play required. Install directly with full support.
                  </p>
                </div>
                <button 
                  onClick={() => setShowInstructions(false)}
                  className="p-1 px-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Responsive App Showcase */}
              <div className="bg-slate-50 rounded-2xl p-4 flex gap-4 items-center border">
                <div className="w-16 h-16 bg-white p-1 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm">
                  <img 
                    src="https://www.image2url.com/r2/default/images/1780845091129-72ef205c-ec0e-4094-ab80-0cd92282f531.jpg" 
                    alt="School Crest" 
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-slate-800">Dr. Abraham S. Borbor Memorial School</h4>
                  <p className="text-[11px] text-slate-500">Grade 1 to 12 Academic GPA & Bulletins System</p>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 font-mono">
                    Official App • PWA STANDALONE • OFFLINE COMPATIBLE
                  </span>
                </div>
              </div>

              {/* Guides Tabs Selector */}
              <div className="flex border-b border-slate-100">
                <button 
                  onClick={() => setActiveTab('ios')}
                  className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'ios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>iPhone / iOS</span>
                </button>
                <button 
                  onClick={() => setActiveTab('android')}
                  className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'android' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>Android OS</span>
                </button>
                <button 
                  onClick={() => setActiveTab('desktop')}
                  className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'desktop' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                  }`}
                >
                  <Monitor size={14} />
                  <span>macOS / Windows</span>
                </button>
              </div>

              {/* Instructions rendering according to selected tab */}
              <div className="space-y-4 text-sm text-slate-700 min-h-[160px] flex flex-col justify-center">
                {activeTab === 'ios' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600">
                      Apple Safari requires a manual launcher hook. Follow these 3 simple steps to add:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-xs md:text-sm">
                      <li className="font-medium">
                        Open this website in your native <strong className="text-blue-600">Safari Browser</strong>.
                      </li>
                      <li className="flex items-center gap-2 flex-wrap">
                        Tap the <span className="bg-slate-100 p-1 px-2.5 rounded-lg border flex items-center gap-1 font-semibold text-slate-700"><Share size={12} /> Share</span> button at the bottom of Safari options.
                      </li>
                      <li className="flex items-center gap-2 flex-wrap">
                        Scroll down and select <span className="bg-slate-100 p-1 px-2.5 rounded-lg border flex items-center gap-1 font-semibold text-slate-700"><PlusSquare size={12} /> Add to Home Screen</span>.
                      </li>
                    </ol>
                    <div className="bg-blue-50 p-3 rounded-xl border text-xs text-blue-700 font-medium">
                      The icon will launch as a fully autonomous app with zero browser utility bars.
                    </div>
                  </div>
                )}

                {activeTab === 'android' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600">
                      On Google Chrome or Android browsers, installing is fully automated:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-xs md:text-sm">
                      <li className="font-medium">
                        Tap the "Install" prompt in your Chrome options menu.
                      </li>
                      <li>
                        If you missed the prompt, look for the <strong>"Add to Home screen"</strong> option directly in your Chrome settings menu (three dots in top-right corner).
                      </li>
                      <li>
                        Confirm the prompt, and Android will create a native app in your App Drawer.
                      </li>
                    </ol>
                    <button 
                      onClick={triggerInstall}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download size={14} />
                      Launch Automatic Installer
                    </button>
                  </div>
                )}

                {activeTab === 'desktop' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600">
                      Run this high school engine like a native app on your desktop computer:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-xs md:text-sm">
                      <li className="font-medium">
                        Look at the right side of your Chrome/Edge browser address bar.
                      </li>
                      <li>
                        Click the small <strong>Monitor icon</strong> or the <strong>Install App icon</strong> (resembles three squares and a plus icon).
                      </li>
                      <li>
                        Click "Install" to create a dedicated launch icon on your Desktop taskbar.
                      </li>
                    </ol>
                    <button 
                      onClick={triggerInstall}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Monitor size={14} />
                      Install to Desktop Device
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => setShowInstructions(false)}
                  className="px-5 py-2 text-xs font-semibold border rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Close Setup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
