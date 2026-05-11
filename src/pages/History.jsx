import { motion } from 'framer-motion';
import { Clock, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';

function History() {
  const { history, loading, getLifetimeTotal, getLastActive } = useApp();
  const { t } = useI18n();

  const formatShortDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const getLastActiveFormatted = () => {
    const lastActive = getLastActive();
    if (!lastActive) return t('never');
    
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('today');
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatShortDate(lastActive);
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

  const dates = Object.keys(history).sort((a, b) => new Date(b) - new Date(a));
  const lifetimeTotal = getLifetimeTotal();
  const lastActive = getLastActiveFormatted();

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <h1 className="text-2xl font-semibold mb-6">{t('history')}</h1>

      <div className="grid grid-cols-1 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--surface)] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-[var(--text-secondary)]">{t('lifetime')}</span>
          </div>
          <p className="text-2xl font-bold text-gradient">{lifetimeTotal.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--surface)] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-[var(--text-secondary)]">{t('lastActive')}</span>
          </div>
          <p className="text-xl font-semibold text-emerald-500">{lastActive}</p>
        </motion.div>
      </div>

      {dates.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-secondary)]">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-lg">{t('noHistory')}</p>
          <p className="text-sm mt-2">{t('historyAppear')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((date, dateIdx) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dateIdx * 0.05 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-base font-medium">
                  {formatShortDate(date)}
                </span>
                {isToday(date) && (
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full font-medium">
                    {t('today')}
                  </span>
                )}
                <div className="flex-1 h-px bg-[var(--text-secondary)]/20" />
              </div>
              <div className="space-y-2">
                {history[date].map((item, idx) => (
                  item.counter && (
                    <motion.div
                      key={`${date}-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: dateIdx * 0.05 + idx * 0.03 }}
                      className="bg-[var(--surface)] rounded-2xl p-4 flex items-center gap-4"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${item.counter.color}20` }}
                      >
                        {item.counter.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.counter.title}</p>
                      </div>
                      <p
                        className="text-2xl font-bold"
                        style={{ color: item.counter.color }}
                      >
                        {item.count}
                      </p>
                    </motion.div>
                  )
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;