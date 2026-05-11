import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, GripVertical, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';

const COLORS = [
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Cyan', value: '#06B6D4' }
];

const EMOJIS = ['🧘', '📿', '🚶', '💧', '📚', '💪', '🧠', '😴', '🍎', '💊', '🎯', '✨'];

function Home() {
  const { counters, loading, createCounter, reorderCounters, exportData, dismissBackupReminder } = useApp();
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🧘');
  const [color, setColor] = useState('#6366F1');
  const [cycleSize, setCycleSize] = useState(108);
  const [saving, setSaving] = useState(false);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleDragStart = (e, position) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e, position) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const newOrder = [...counters.map(c => c._id)];
    const draggedItemIndex = dragItem.current;
    const droppedItemIndex = dragOverItem.current;

    const [removed] = newOrder.splice(draggedItemIndex, 1);
    newOrder.splice(droppedItemIndex, 0, removed);

    reorderCounters(newOrder);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const finalCycleSize = Math.max(1, cycleSize);
      await createCounter(title.trim(), emoji, color, finalCycleSize);
      setShowModal(false);
      setTitle('');
      setEmoji('🧘');
      setColor('#6366F1');
      setCycleSize(108);
    } catch (e) {}
    setSaving(false);
  };

  if (loading) {
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

  return (
    <div className="h-full flex flex-col p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{t('myCounters')}</h1>
        <motion.button
          onClick={() => setShowModal(true)}
          whileTap={{ scale: 0.9 }}
          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-violet-500 text-white flex items-center justify-center shadow-lg shadow-primary/30"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="flex-1 overflow-hidden">
        {counters.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium mb-1">{t('noCounters')}</p>
            <p className="text-sm text-[var(--text-secondary)]">{t('tapToCreate')}</p>
          </motion.div>
        ) : (
          <div className="space-y-2 overflow-y-auto pb-4">
            {counters.map((counter, idx) => {
              const cycleSize = counter.cycleSize || 108;
              const cycleProgress = cycleSize > 0 ? counter.currentCount % cycleSize : null;
              
              return (
                <motion.div
                  key={counter._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragEnter={(e) => handleDragEnter(e, idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="touch-manipulation"
                >
                  <Link
                    to={`/counter/${counter._id}`}
                    className="block bg-[var(--surface)] rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="drag-handle text-[var(--text-secondary)] opacity-40">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner"
                      style={{ backgroundColor: `${counter.color}12` }}
                    >
                      {counter.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base truncate">{counter.title}</h3>
                      {cycleSize > 0 && cycleProgress !== null && (
                        <p className="text-xs text-[var(--text-secondary)]">
                          {cycleProgress}/{cycleSize} · {Math.floor(counter.currentCount / cycleSize)} cycles
                        </p>
                      )}
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: counter.color }}
                    >
                      {counter.currentCount}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[var(--surface)] w-full max-w-md rounded-3xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">{t('newCounter')}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-[var(--background)] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--text-secondary)] block mb-2">{t('name')}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Meditation"
                    className="w-full bg-[var(--background)] rounded-xl px-4 py-2.5 text-base"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm text-[var(--text-secondary)] block mb-2">{t('icon')}</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(e => (
                      <motion.button
                        key={e}
                        onClick={() => setEmoji(e)}
                        whileTap={{ scale: 0.9 }}
                        className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${
                          emoji === e 
                            ? 'bg-primary/20 ring-2 ring-primary scale-105' 
                            : 'bg-[var(--background)]'
                        }`}
                      >
                        {e}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[var(--text-secondary)] block mb-2">{t('color')}</label>
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <motion.button
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        whileTap={{ scale: 0.9 }}
                        className={`w-9 h-9 rounded-full transition-all ${
                          color === c.value ? 'scale-110 ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-primary' : ''
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[var(--text-secondary)] block mb-2">{t('cycle')}</label>
                  <input
                    type="number"
                    value={cycleSize}
                    onChange={e => setCycleSize(Math.max(1, parseInt(e.target.value) || 108))}
                    className="w-full bg-[var(--background)] rounded-xl px-4 py-2.5 text-base"
                    min="1"
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Common: 108 (mantras), 100 (walking), 50 (exercise)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--background)] font-medium text-sm"
                >
                  {t('cancel')}
                </button>
                <motion.button
                  onClick={handleCreate}
                  disabled={!title.trim() || saving}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium text-sm disabled:opacity-50"
                >
                  {saving ? t('creating') : t('create')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Home;