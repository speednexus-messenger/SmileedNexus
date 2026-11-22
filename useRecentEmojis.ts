import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'speednexus:recent-smileednexus';
const MAX_RECENT = 24;

export function useRecentEmojis() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {
    }
  }, []);

  const push = useCallback((emojiChar: string) => {
    setRecent(prev => {
      const next = [emojiChar, ...prev.filter(c => c !== emojiChar)].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
      }
      return next;
    });
  }, []);

  return { recent, push };
}