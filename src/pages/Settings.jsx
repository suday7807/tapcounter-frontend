import { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Moon, Sun, Volume2, VolumeX, 
  Vibrate, VibrateOff, Keyboard, 
  Hand, Volume1, Info, 
  Download, AlertTriangle,
  Send, Globe, Share2, PlusSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';

function Toggle({ enabled, onChange, label }) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer group">
      <span className="text-base">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`w-12 h-7 rounded-full transition-all duration-300 ${
          enabled ? 'bg-primary' : 'bg-[var(--text-secondary)]/30'
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 22 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-5 h-5 bg-white rounded-full shadow-md"
        />
      </button>
    </label>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex rounded-xl overflow-hidden bg-[var(--background)] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
            value === option.value
              ? 'bg-primary text-white shadow-sm'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Settings() {
  const { 
    settings, 
    updateSettings, 
    exportData, 
    importData,
    resetDailyCount,
    resetLifetimeCount,
    resetAllData,
    shareApp,
    counters
  } = useApp();
  const { t, language, setLanguage } = useI18n();
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetType, setResetType] = useState('');
  const [confirmReset, setConfirmReset] = useState('');
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleExport = () => {
    exportData();
  };

  const handleShare = async () => {
    const shareUrl = window.location.origin + '/counters';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TapCounter',
          text: 'Check out this beautiful TapCounter app - a peaceful, minimal counter for your daily practice.',
          url: shareUrl
        });
      } catch (e) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText('Check out TapCounter - ' + shareUrl);
    }
  };

  const handleAddToHomeScreen = () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      alert('App is already installed on your home screen!');
      return;
    }
    
    // Trigger the browser's install prompt
    const installPromptEvent = window.deferredPrompt;
    if (installPromptEvent) {
      installPromptEvent.prompt();
      installPromptEvent.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        }
        window.deferredPrompt = null;
      });
    } else {
      // For iOS Safari - guide user to add manually
      alert('To add to home screen:\n\niOS: Tap Share button → "Add to Home Screen"\n\nAndroid: Tap menu (⋮) → "Add to Home Screen"');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError('');

    try {
      await importData(file);
    } catch (error) {
      setImportError('Failed to import. Make sure the file is valid.');
    }

    setImporting(false);
    e.target.value = '';
  };

  const handleReset = async () => {
    if (confirmReset !== resetType) return;
    
    setResetting(true);
    try {
      if (resetType === 'daily') {
        for (const c of counters) {
          await resetDailyCount(c._id);
        }
      } else if (resetType === 'lifetime') {
        for (const c of counters) {
          await resetLifetimeCount(c._id);
        }
      } else if (resetType === 'all') {
        await resetAllData();
      }
      setShowReset(false);
      setResetType('');
      setConfirmReset('');
    } catch (e) {}
    setResetting(false);
  };

  const handleInputModeChange = (mode) => {
    updateSettings('inputMode', mode);
    if (mode !== 'keyboard') {
      updateSettings('keyboardSpace', true);
      updateSettings('keyboardBackspace', true);
    }
    if (mode !== 'volume') {
      updateSettings('volumeButtons', false);
    }
    if (mode !== 'tap') {
      updateSettings('sound', true);
      updateSettings('vibration', true);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    try {
      await axios.post('/api/feedback', {
        feedback: feedback,
        language: language
      });
    } catch (error) {
      console.log('Feedback saved locally (backend may not be running)');
    }
    setFeedback('');
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 2500);
  };

  const inputModeOptions = [
    { value: 'tap', label: t('tap') },
    { value: 'keyboard', label: t('keyboard') }
  ];

  return (
    <div className="p-4 max-w-md mx-auto pb-28">
      <h1 className="text-2xl font-semibold mb-5">{t('settings')}</h1>

      <div className="bg-[var(--surface)] rounded-2xl p-4 mb-4">
        <h2 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('appearance')}</h2>
        
        <div className="flex items-center justify-between py-2">
          <span className="text-base">{t('language')}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                language === 'en' ? 'bg-primary text-white' : 'bg-[var(--background)] text-[var(--text-secondary)]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                language === 'hi' ? 'bg-primary text-white' : 'bg-[var(--background)] text-[var(--text-secondary)]'
              }`}
            >
              हिं
            </button>
          </div>
        </div>
        <div className="h-px bg-[var(--text-secondary)]/10 my-2" />
        
        <Toggle
          label={t('darkMode')}
          enabled={settings.darkMode}
          onChange={v => updateSettings('darkMode', v)}
        />
      </div>

      <div className="bg-[var(--surface)] rounded-2xl p-4 mb-4">
        <h2 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('inputMode')}</h2>
        
        <div className="mb-3">
          <SegmentedControl
            options={inputModeOptions}
            value={settings.inputMode}
            onChange={handleInputModeChange}
          />
        </div>
        
        {settings.inputMode === 'keyboard' && (
          <div className="mt-3 pt-3 border-t border-[var(--text-secondary)]/10 space-y-2">
            <p className="text-xs text-[var(--text-secondary)] mb-2">{t('keyboardShortcuts')}:</p>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[var(--text-secondary)]">{t('spaceIncrement')}</span>
              <button
                onClick={() => updateSettings('keyboardSpace', !settings.keyboardSpace)}
                className={`w-10 h-6 rounded-full transition-all ${settings.keyboardSpace ? 'bg-primary' : 'bg-[var(--text-secondary)]/30'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.keyboardSpace ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[var(--text-secondary)]">{t('backspaceDecrement')}</span>
              <button
                onClick={() => updateSettings('keyboardBackspace', !settings.keyboardBackspace)}
                className={`w-10 h-6 rounded-full transition-all ${settings.keyboardBackspace ? 'bg-primary' : 'bg-[var(--text-secondary)]/30'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.keyboardBackspace ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}
        
        {settings.inputMode === 'volume' && (
          <div className="mt-2 p-2 bg-amber-500/10 rounded-lg">
            <p className="text-xs text-amber-600">
              Note: Volume button detection works on some Android browsers (Chrome). May not work on iOS or all devices.
            </p>
          </div>
        )}
      </div>

      <div className="bg-[var(--surface)] rounded-2xl p-4 mb-4">
        <h2 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('soundHaptic')}</h2>
        <Toggle
          label={t('tapSound')}
          enabled={settings.sound}
          onChange={v => updateSettings('sound', v)}
        />
        <div className="h-px bg-[var(--text-secondary)]/10" />
        <Toggle
          label={t('vibrateTap')}
          enabled={settings.vibration}
          onChange={v => updateSettings('vibration', v)}
        />
        <div className="h-px bg-[var(--text-secondary)]/10" />
        <Toggle
          label={t('longVibration')}
          enabled={settings.longVibration}
          onChange={v => updateSettings('longVibration', v)}
        />
        <div className="h-px bg-[var(--text-secondary)]/10" />
        <Toggle
          label={t('cycleSound')}
          enabled={settings.cycleSound}
          onChange={v => updateSettings('cycleSound', v)}
        />
      </div>

      <div className="bg-[var(--surface)] rounded-2xl p-4 mb-4">
        <h2 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('backup')}</h2>
        <div className="space-y-2">
          <button
            onClick={handleShare}
            className="w-full py-2.5 rounded-xl bg-primary/10 text-primary font-medium flex items-center justify-center gap-2 text-sm"
          >
            <Share2 className="w-4 h-4" />
            Share App
          </button>
          <button
            onClick={handleAddToHomeScreen}
            className="w-full py-2.5 rounded-xl bg-[var(--background)] font-medium flex items-center justify-center gap-2 text-sm"
          >
            <PlusSquare className="w-4 h-4" />
            Add to Home Screen
          </button>
          <button
            onClick={handleExport}
            className="w-full py-2.5 rounded-xl bg-[var(--background)] font-medium flex items-center justify-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            {t('exportData')}
          </button>
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl p-4 mb-4">
        <h2 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('about')}</h2>
        <button
          onClick={() => setShowAbout(true)}
          className="w-full flex items-center justify-between py-2"
        >
          <span className="font-medium">{t('aboutTapCounter')}</span>
          <Info className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl p-4 mb-4">
        <h2 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('feedback')}</h2>
        {feedbackSubmitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center"
          >
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-xl">✓</span>
            </div>
            <p className="text-sm font-medium text-emerald-600">{t('submitted')}</p>
          </motion.div>
        ) : (
          <>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t('feedbackPlaceholder')}
              className="w-full bg-[var(--background)] rounded-xl px-3 py-2.5 text-sm resize-none h-20"
            />
            <button
              onClick={handleSubmitFeedback}
              disabled={!feedback.trim()}
              className="w-full mt-2 py-2 rounded-xl bg-primary text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {t('submit')}
            </button>
          </>
        )}
      </div>

      <div className="bg-[var(--surface)] rounded-2xl p-4 mb-4">
        <h2 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">Data Management</h2>
        
        <button
          onClick={() => setShowReset(true)}
          className="w-full py-3 rounded-xl border border-rose-500/30 text-rose-500 font-medium flex items-center justify-center gap-2 text-sm hover:bg-rose-500/5 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          {t('resetData')}
        </button>
      </div>

      <p className="text-center text-sm text-[var(--text-secondary)] mb-2">
        {t('madeInBharat')}
      </p>
      <p className="text-center text-xs text-[var(--text-secondary)]">
        TapCounter {t('version')}
      </p>

      <AnimatePresence>
        {showAbout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAbout(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--surface)] w-full max-w-sm rounded-3xl p-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">☯️</span>
              </div>
              <h2 className="text-xl font-semibold mb-1">TapCounter</h2>
              <p className="text-xs text-[var(--text-secondary)] mb-4">{t('version')}</p>
              
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {t('appDescription')}
              </p>
              
              <p className="text-sm text-[var(--text-secondary)] mb-5">
                {t('madeBy')}
              </p>

              <button
                onClick={() => setShowAbout(false)}
                className="w-full py-2.5 rounded-xl bg-[var(--background)] font-medium text-sm"
              >
                {t('close')}
              </button>
            </motion.div>
          </motion.div>
        )}

        {showReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => { setShowReset(false); setResetType(''); setConfirmReset(''); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--surface)] w-full max-w-sm rounded-3xl p-5"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">{t('resetData')}</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">Choose what to reset:</p>
              
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => setResetType('daily')}
                  className={`w-full py-2.5 rounded-xl text-left px-4 text-sm transition-all ${
                    resetType === 'daily' 
                      ? 'bg-primary text-white' 
                      : 'bg-[var(--background)]'
                  }`}
                >
                  {t('resetDaily')}
                </button>
                <button
                  onClick={() => setResetType('lifetime')}
                  className={`w-full py-2.5 rounded-xl text-left px-4 text-sm transition-all ${
                    resetType === 'lifetime' 
                      ? 'bg-primary text-white' 
                      : 'bg-[var(--background)]'
                  }`}
                >
                  {t('resetLifetime')}
                </button>
                <button
                  onClick={() => setResetType('all')}
                  className={`w-full py-2.5 rounded-xl text-left px-4 text-sm transition-all ${
                    resetType === 'all' 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {t('deleteEverything')}
                </button>
              </div>

              {resetType && (
                <div className="mb-4">
                  <p className="text-xs text-[var(--text-secondary)] mb-2">
                    {t('typeToConfirm')} <span className="font-medium">{resetType}</span>
                  </p>
                  <input
                    type="text"
                    value={confirmReset}
                    onChange={(e) => setConfirmReset(e.target.value.toLowerCase())}
                    placeholder={`Type "${resetType}"`}
                    className="w-full bg-[var(--background)] rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowReset(false); setResetType(''); setConfirmReset(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--background)] font-medium text-sm"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleReset}
                  disabled={confirmReset !== resetType || !resetType || resetting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-medium text-sm disabled:opacity-50"
                >
                  {resetting ? t('resetting') : t('resetData')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Settings;