import './SmileedNexus.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EMOJIS, CATEGORIES } from './emojiData';
import { useRecentEmojis } from './useRecentEmojis';
import { EmojiSvg } from './EmojiSvg';
import { resolveLabels, type PartialLabels } from './labels';

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  labels?: PartialLabels;
}

export default function SmileedNexus({ onSelect, onClose, labels }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { recent, push } = useRecentEmojis();
  const [activeCategory, setActiveCategory] = useState<string>('people');
  const [query, setQuery] = useState('');

  const L = resolveLabels(labels);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 0);
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const visibleEmojis = useMemo(() => {
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return EMOJIS.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.keywords.some((k) => k.toLowerCase().includes(q)) ||
          (e.keywordsEn?.some((k) => k.toLowerCase().includes(q)) ?? false),
      );
    }
    if (activeCategory === 'frequent') {
      return recent.map((char) => EMOJIS.find((e) => e.char === char)).filter(Boolean) as typeof EMOJIS;
    }
    return EMOJIS.filter((e) => e.category === activeCategory);
  }, [query, activeCategory, recent]);

  function handleEmojiClick(char: string) {
    push(char);
    onSelect(char);
  }

  const isSearching = query.trim().length > 0;

  return (
    <div className="smileed-nexus" ref={containerRef}>
      <div className="smileed-nexus-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder={L.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!isSearching && (
        <div className="smileed-nexus-tabs">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`smileed-nexus-tab${activeCategory === c.id ? ' active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
              title={L.categories[c.id] ?? c.label}
            >
              {c.icon}
            </button>
          ))}
        </div>
      )}

      <div className="smileed-nexus-body">
        {visibleEmojis.length === 0 ? (
          <div className="smileed-nexus-empty">
            {activeCategory === 'frequent' && !query.trim() ? L.recentEmpty : L.empty}
          </div>
        ) : (
          <div className="smileed-nexus-grid">
            {visibleEmojis.map((e, i) => (
              <button
                key={`${e.char}-${i}`}
                type="button"
                className="smileed-nexus-cell"
                title={e.name}
                onClick={() => handleEmojiClick(e.char)}
              >
                <EmojiSvg char={e.char} className="smileed-nexus-emoji" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { SmileedNexus };
export { EmojiSvg, getEmojiHtml } from './EmojiSvg';
export { EmojiText } from './EmojiText';
export type { EmojiTextProps } from './EmojiText';
export { useRecentEmojis } from './useRecentEmojis';
export type { Labels, PartialLabels } from './labels';