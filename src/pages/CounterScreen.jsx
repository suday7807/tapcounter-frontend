import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';

function CounterScreen() {
  const { id } = useParams();
  const { 
    counters, 
    incrementCounter, 
    decrementCounter, 
    settings,
    updateCounterSettings,
    deleteCounter,
    cycleComplete,
    streak
  } = useApp();
  const { t } = useI18n();
  const [counter, setCounter] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [cycleSize, setCycleSize] = useState(108);
  const [animateKey, setAnimateKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);

  useEffect(() => {
    const found = counters.find(c => c._id === id);
    if (found) {
      setCounter(found);
      setCycleSize(found.cycleSize || 108);
      sessionStorage.setItem('activeCounter', found._id);
    }
  }, [id, counters]);

  const handleIncrement = useCallback(async () => {
    if (counter) {
      setCounter(prev => ({ ...prev, currentCount: prev.currentCount + 1 }));
      setAnimateKey(k => k + 1);
      await incrementCounter(counter);
    }
  }, [counter, incrementCounter]);

  const handleDecrement = useCallback(async () => {
    if (counter && counter.currentCount > 0) {
      setCounter(prev => ({ ...prev, currentCount: prev.currentCount - 1 }));
      setAnimateKey(k => k + 1);
      await decrementCounter(counter);
    }
  }, [counter, decrementCounter]);

  const handleSaveSettings = async () => {
    const newCycleSize = Math.max(1, cycleSize);
    await updateCounterSettings(id, { cycleSize: newCycleSize });
    setShowSettings(false);
  };

  const handleDelete = async () => {
    await deleteCounter(id);
    window.location.href = '/';
  };

  if (!counter) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const cycleProgress = cycleSize > 0 ? counter.currentCount % cycleSize : counter.currentCount;
  const completedCycles = cycleSize > 0 ? Math.floor(counter.currentCount / cycleSize) : 0;
  const showCycleCelebration = cycleComplete === id;

  return (
    <div className="h-screen flex flex-col gradient-bg overflow-hidden">
      <div className="flex justify-end p-4">
        <button
          onClick={() => { setDeleteStep(1); setShowDeleteConfirm(true); }}
          className="p-2 rounded-full hover:bg-white/10"
          title="Delete"
        >
          <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 -mt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2 shadow-lg"
            style={{ backgroundColor: `${counter.color}15` }}
          >
            {counter.emoji}
          </div>
          <h1
            className="text-lg font-semibold"
            style={{ color: counter.color }}
          >
            {counter.title}
          </h1>
        </motion.div>

        <div className="relative mb-6">
          <motion.div
            key={animateKey}
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`text-8xl font-bold tabular-nums number-pop ${
              showCycleCelebration ? 'cycle-glow' : ''
            }`}
            style={{ 
              color: counter.color,
              textShadow: showCycleCelebration 
                ? `0 0 40px ${counter.color}60, 0 0 80px ${counter.color}30`
                : `0 0 30px ${counter.color}30`
            }}
          >
            {counter.currentCount}
          </motion.div>
        </div>

        {cycleSize > 0 && (
          <div className="mb-6 flex flex-col items-center gap-2">
            {cycleSize > 0 && completedCycles > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-[var(--text-secondary)]"
              >
                {t('completedCycles')}: {completedCycles}
              </motion.p>
            )}
            
            {cycleSize > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <span 
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{ 
                    backgroundColor: `${counter.color}12`,
                    color: counter.color 
                  }}
                >
                  {cycleProgress} / {cycleSize}
                </span>
              </motion.div>
            )}
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          <motion.button
            onClick={handleDecrement}
            whileTap={{ scale: 0.92 }}
            disabled={counter.currentCount === 0}
            className="decrement-btn w-14 h-14 rounded-full flex items-center justify-center disabled:opacity-25"
          >
            <div className="decrement-btn-inner w-9 h-9 rounded-full" />
          </motion.button>

          <motion.button
            onClick={handleIncrement}
            whileTap={{ scale: 0.9 }}
            className={`w-72 h-72 rounded-full flex items-center justify-center shadow-2xl counter-btn ripple ${
              showCycleCelebration ? 'cycle-pulse glow-effect' : ''
            }`}
            style={{
              backgroundColor: counter.color,
              boxShadow: showCycleCelebration
                ? `0 20px 60px ${counter.color}60, 0 0 100px ${counter.color}40`
                : `0 20px 50px ${counter.color}50, 0 0 80px ${counter.color}25`
            }}
          >
            <div className="w-60 h-60 rounded-full bg-white/10" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--surface)] w-full max-w-sm rounded-3xl p-5 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">{t('counterSettings')}</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-[var(--text-secondary)] block mb-2">
                    {t('cycleSize')}
                  </label>
                  <input
                    type="number"
                    value={cycleSize}
                    onChange={e => setCycleSize(Math.max(1, parseInt(e.target.value) || 108))}
                    className="w-full bg-[var(--background)] rounded-xl px-4 py-2.5 text-base"
                    min="1"
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Enter any number (108, 100, 50, etc.)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--background)] font-medium text-sm"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm"
                  style={{ backgroundColor: counter.color }}
                >
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]"
            onClick={() => { setShowDeleteConfirm(false); setDeleteStep(0); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--surface)] w-full max-w-sm rounded-3xl p-5 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {deleteStep === 1 ? 'Delete Counter?' : 'Are you sure?'}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  {deleteStep === 1 
                    ? `"${counter.title}" will be permanently deleted.`
                    : 'This action cannot be undone. All data for this counter will be lost.'}
                </p>
                
                {deleteStep === 1 ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteStep(0); }}
                      className="flex-1 py-2.5 rounded-xl bg-[var(--background)] font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setDeleteStep(2)}
                      className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-medium text-sm"
                    >
                      Yes, Continue
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteStep(0); }}
                      className="flex-1 py-2.5 rounded-xl bg-[var(--background)] font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-medium text-sm"
                    >
                      Delete Forever
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CounterScreen;