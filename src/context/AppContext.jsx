import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AppContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'https://tapcounter-backend.onrender.com';

const getGuestId = () => {
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
};

const getSettings = () => {
  const saved = localStorage.getItem('tapcounter_settings');
  const defaults = {
    darkMode: true,
    sound: true,
    vibration: true,
    longVibration: true,
    cycleSound: true,
    inputMode: 'tap',
    keyboardSpace: true,
    keyboardBackspace: true,
    volumeButtons: false,
    lastBackupReminder: null
  };
  return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
};

const getStreak = () => {
  const saved = localStorage.getItem('tapcounter_streak');
  if (!saved) return { current: 0, lastActiveDate: null };
  return JSON.parse(saved);
};

const getCounterOrder = () => {
  const saved = localStorage.getItem('tapcounter_order');
  return saved ? JSON.parse(saved) : [];
};

export function AppProvider({ children }) {
  const [guestId] = useState(getGuestId);
  const [counters, setCounters] = useState([]);
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(getSettings);
  const [cycleComplete, setCycleComplete] = useState(null);
  const [streak, setStreak] = useState(getStreak);
  const [counterOrder, setCounterOrder] = useState(getCounterOrder);

  useEffect(() => {
    localStorage.setItem('tapcounter_settings', JSON.stringify(settings));
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('tapcounter_streak', JSON.stringify(streak));
  }, [streak]);

  useEffect(() => {
    localStorage.setItem('tapcounter_order', JSON.stringify(counterOrder));
  }, [counterOrder]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (streak.lastActiveDate !== today) {
      const lastActive = streak.lastActiveDate;
      if (lastActive) {
        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        const diffTime = todayDate - lastDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          setStreak({ current: 0, lastActiveDate: today });
        }
      }
    }
  }, [streak]);

  const updateStreak = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    if (streak.lastActiveDate !== today) {
      const lastActive = streak.lastActiveDate;
      let newStreak = 1;
      
      if (lastActive) {
        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        const diffTime = todayDate - lastDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak = streak.current + 1;
        }
      }
      
      setStreak({ current: newStreak, lastActiveDate: today });
    }
  }, [streak]);

  const fetchCounters = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/counters/${guestId}`);
      let fetchedCounters = res.data;
      
      if (counterOrder.length > 0) {
        fetchedCounters = fetchedCounters.sort((a, b) => {
          const orderA = counterOrder.indexOf(a._id);
          const orderB = counterOrder.indexOf(b._id);
          if (orderA === -1 && orderB === -1) return 0;
          if (orderA === -1) return 1;
          if (orderB === -1) return -1;
          return orderA - orderB;
        });
      }
      
      setCounters(fetchedCounters);
    } catch (error) {
      console.error('Failed to fetch counters:', error);
    }
  }, [guestId, counterOrder]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/history/all/${guestId}`);
      setHistory(res.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  }, [guestId]);

  const createCounter = async (title, emoji, color, cycleSize = 108) => {
    try {
      const res = await axios.post(`${API_URL}/counters`, { 
        guestId, 
        title, 
        emoji, 
        color,
        cycleSize 
      });
      setCounters(prev => {
        const newOrder = [res.data._id, ...counterOrder];
        setCounterOrder(newOrder);
        return [res.data, ...prev];
      });
      return res.data;
    } catch (error) {
      console.error('Failed to create counter:', error);
      throw error;
    }
  };

  const updateCounter = async (id, data) => {
    try {
      const res = await axios.put(`${API_URL}/counters/${id}`, data);
      setCounters(prev => prev.map(c => c._id === id ? res.data : c));
      return res.data;
    } catch (error) {
      console.error('Failed to update counter:', error);
      throw error;
    }
  };

  const deleteCounter = async (id) => {
    try {
      await axios.delete(`${API_URL}/counters/${id}`);
      setCounters(prev => prev.filter(c => c._id !== id));
      setCounterOrder(prev => prev.filter(oid => oid !== id));
    } catch (error) {
      console.error('Failed to delete counter:', error);
      throw error;
    }
  };

  const reorderCounters = (newOrder) => {
    setCounterOrder(newOrder);
    setCounters(prev => {
      return prev.sort((a, b) => {
        const orderA = newOrder.indexOf(a._id);
        const orderB = newOrder.indexOf(b._id);
        if (orderA === -1 && orderB === -1) return 0;
        if (orderA === -1) return 1;
        if (orderB === -1) return -1;
        return orderA - orderB;
      });
    });
  };

  const checkCycleComplete = (counter, newCount) => {
    if (!counter.cycleSize || counter.cycleSize <= 0) return false;
    return newCount % counter.cycleSize === 0 && newCount > 0;
  };

  const incrementCounter = async (counter) => {
    const newCount = counter.currentCount + 1;
    await updateCounter(counter._id, { currentCount: newCount });
    updateStreak();

    if (settings.vibration) {
      playVibration(50);
    }
    if (settings.sound) {
      await playTapSound();
    }

    if (checkCycleComplete(counter, newCount)) {
      setCycleComplete(counter._id);
      setTimeout(() => setCycleComplete(null), 2500);
      
      if (settings.cycleSound) {
        playCycleCompleteSound();
      }
      if (settings.longVibration) {
        playVibration(400);
      }
    }
  };

  const decrementCounter = async (counter) => {
    if (counter.currentCount > 0) {
      const newCount = counter.currentCount - 1;
      await updateCounter(counter._id, { currentCount: newCount });
      
      if (settings.vibration) {
        playVibration(30);
      }
    }
  };

  const updateCounterSettings = async (id, data) => {
    const updated = await updateCounter(id, data);
    return updated;
  };

  const playTapSound = async () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume AudioContext if suspended (required for mobile)
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      // Slightly louder and longer for better feedback
      const now = audioCtx.currentTime;
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      oscillator.start(now);
      oscillator.stop(now + 0.1);
    } catch (e) {
      console.log('Sound error:', e);
    }
  };

  const playCycleCompleteSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const notes = [659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = audioCtx.currentTime + i * 0.12;
        gainNode.gain.setValueAtTime(0.12, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      });
    } catch (e) {}
  };

  const playVibration = (duration) => {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  const exportData = () => {
    const data = { guestId, counters, history, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tapcounter-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    const today = new Date().toISOString().split('T')[0];
    setSettings(prev => ({ ...prev, lastBackupReminder: today }));
  };

  const importData = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.guestId || !data.counters) {
        throw new Error('Invalid backup file');
      }

      const mappedCounters = data.counters.map(c => ({
        title: c.title,
        emoji: c.emoji,
        color: c.color,
        currentCount: c.currentCount,
        lastResetDate: c.lastResetDate,
        cycleSize: c.cycleSize || 108
      }));

      const allHistory = [];
      Object.entries(data.history || {}).forEach(([date, items]) => {
        items.forEach(item => {
          if (item.counter) {
            allHistory.push({
              counterTitle: item.counter.title,
              date,
              count: item.count
            });
          }
        });
      });

      await axios.post(`${API_URL}/history/import`, {
        guestId,
        counters: mappedCounters,
        history: allHistory
      });

      await fetchCounters();
      await fetchHistory();
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  };

  const resetDailyCount = async (counterId) => {
    const counter = counters.find(c => c._id === counterId);
    if (counter) {
      await updateCounter(counterId, { currentCount: 0, lastResetDate: new Date().toISOString() });
    }
  };

  const resetLifetimeCount = async (counterId) => {
    const counter = counters.find(c => c._id === counterId);
    if (counter) {
      await updateCounter(counterId, { currentCount: 0, lastResetDate: new Date().toISOString() });
    }
  };

  const resetAllData = async () => {
    for (const counter of counters) {
      await deleteCounter(counter._id);
    }
    setCounters([]);
    setHistory({});
    setCounterOrder([]);
  };

  const shareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TapCounter',
          text: 'Check out this beautiful TapCounter app - a peaceful, minimal counter for your daily practice.',
          url: 'https://tapcounter.app'
        });
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText('Check out this beautiful TapCounter app - https://tapcounter.app');
    }
  };

  const updateSettings = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getLifetimeTotal = useCallback(() => {
    return counters.reduce((sum, c) => sum + (c.currentCount || 0), 0);
  }, [counters]);

  const getTotalCycles = useCallback(() => {
    return counters.reduce((sum, c) => {
      const cycleSize = c.cycleSize || 108;
      return sum + Math.floor((c.currentCount || 0) / cycleSize);
    }, 0);
  }, [counters]);

  const getLastActive = useCallback(() => {
    if (counters.length === 0) return null;
    const sorted = [...counters].sort((a, b) => 
      new Date(b.lastResetDate || 0) - new Date(a.lastResetDate || 0)
    );
    return sorted[0]?.lastResetDate;
  }, [counters]);

  const checkBackupReminder = useCallback(() => {
    const lastBackup = settings.lastBackupReminder;
    if (!lastBackup) return true;
    
    const today = new Date().toISOString().split('T')[0];
    const lastDate = new Date(lastBackup);
    const todayDate = new Date(today);
    const diffTime = todayDate - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 7;
  }, [settings.lastBackupReminder]);

  const dismissBackupReminder = () => {
    const today = new Date().toISOString().split('T')[0];
    setSettings(prev => ({ ...prev, lastBackupReminder: today }));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCounters(), fetchHistory()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCounters, fetchHistory]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputField = e.target.tagName === 'INPUT' || 
                           e.target.tagName === 'TEXTAREA' ||
                           e.target.isContentEditable;
      if (isInputField) return;
      
      if (settings.inputMode !== 'keyboard') return;
      
      if (e.code === 'Space' && settings.keyboardSpace) {
        e.preventDefault();
        const activeCounter = sessionStorage.getItem('activeCounter');
        if (activeCounter) {
          const counter = counters.find(c => c._id === activeCounter);
          if (counter) incrementCounter(counter);
        }
      }
      
      if (e.code === 'Backspace' && settings.keyboardBackspace) {
        e.preventDefault();
        const activeCounter = sessionStorage.getItem('activeCounter');
        if (activeCounter) {
          const counter = counters.find(c => c._id === activeCounter);
          if (counter) decrementCounter(counter);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, counters]);

  useEffect(() => {
    if (!settings.volumeButtons) return;

    let lastVolumeUpTime = 0;
    
    const handleVolumeButtons = (e) => {
      // Try to catch VolumeUp - works on some Android browsers
      if (e.key === 'VolumeUp' || e.code === 'VolumeUp') {
        e.preventDefault();
        e.stopPropagation();
        
        const now = Date.now();
        // Debounce to prevent double-triggering
        if (now - lastVolumeUpTime > 200) {
          lastVolumeUpTime = now;
          const activeCounter = sessionStorage.getItem('activeCounter');
          if (activeCounter) {
            const counter = counters.find(c => c._id === activeCounter);
            if (counter) {
              incrementCounter(counter);
              // Also trigger haptic feedback
              if (navigator.vibrate) {
                navigator.vibrate(30);
              }
            }
          }
        }
      }
    };

    // Use capture phase to catch events earlier
    window.addEventListener('keydown', handleVolumeButtons, { capture: true });
    
    return () => {
      window.removeEventListener('keydown', handleVolumeButtons, { capture: true });
    };
  }, [settings.volumeButtons, counters]);

  return (
    <AppContext.Provider value={{
      guestId,
      counters,
      history,
      loading,
      settings,
      cycleComplete,
      streak,
      createCounter,
      updateCounter,
      updateCounterSettings,
      deleteCounter,
      reorderCounters,
      incrementCounter,
      decrementCounter,
      fetchCounters,
      fetchHistory,
      exportData,
      importData,
      resetDailyCount,
      resetLifetimeCount,
      resetAllData,
      shareApp,
      updateSettings,
      getLifetimeTotal,
      getTotalCycles,
      getLastActive,
      checkBackupReminder,
      dismissBackupReminder
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);