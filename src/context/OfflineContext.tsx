import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getCache, setCache, getQueue, clearQueue } from '@/lib/cache';
import type { Exercise } from '@/types';

interface OfflineContextType {
  isOffline: boolean;
  getCachedExercises: () => Exercise[];
  refreshCache: () => Promise<void>;
  syncQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const getCachedExercises = useCallback((): Exercise[] => {
    return getCache<Exercise[]>('exercises') || [];
  }, []);

  const refreshCache = useCallback(async () => {
    try {
      const { data } = await supabase.from('exercises').select('*');
      if (data) {
        setCache('exercises', data, 4320);
        const areas = [...new Set(data.map(e => e.area))];
        setCache('areas', areas, 4320);
      }
      const { data: exams } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (exams) setCache('exams', exams, 1440);
    } catch (e) {
      console.warn('Cache refresh failed (offline?):', e);
    }
  }, []);

  const syncQueue = useCallback(async () => {
    const queue = getQueue();
    if (queue.length === 0) return;
    const remaining: any[] = [];
    for (const entry of queue) {
      try {
        if (entry.type === 'practice') {
          await supabase.from('practice_stats').insert(entry.data);
        } else if (entry.type === 'exam') {
          await supabase.from('exams').insert(entry.data);
        } else if (entry.type === 'exam_answers') {
          await supabase.from('exam_answers').insert(entry.data);
        }
      } catch {
        remaining.push(entry);
      }
    }
    if (remaining.length === 0) {
      clearQueue();
    } else {
      localStorage.setItem('preuni_cache_sync_queue', JSON.stringify(remaining));
    }
  }, []);

  useEffect(() => {
    if (isOffline) return;
    const interval = setInterval(syncQueue, 30000);
    syncQueue();
    return () => clearInterval(interval);
  }, [isOffline, syncQueue]);

  useEffect(() => {
    refreshCache();
  }, [refreshCache]);

  return (
    <OfflineContext.Provider value={{ isOffline, getCachedExercises, refreshCache, syncQueue }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used within OfflineProvider');
  return ctx;
};
