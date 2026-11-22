import { useEffect, useReducer } from 'react';
import { EMOJI_SPRITE } from './emojiSprite';
import { EMOJI_SPRITE_SKINS } from './emojiSkins';

const EMOJI_MAP = new Map<string, string>();
const TONE_PATTERN = /[\u{1F3FB}-\u{1F3FF}]/u;
const skinListeners = new Set<() => void>();
let skinsState: 'idle' | 'ready' = 'idle';

const stripVariation = (char: string) => char.replace(/\uFE0F/g, '');

function register(sprite: string) {
  if (typeof document === 'undefined') return;
  const temp = document.createElement('div');
  temp.innerHTML = sprite;
  temp.querySelectorAll('svg[data-emoji]').forEach((el) => {
    const char = el.getAttribute('data-emoji');
    if (!char) return;
    const html = el.outerHTML;
    EMOJI_MAP.set(char, html);
    EMOJI_MAP.set(stripVariation(char), html);
  });
}

function lookup(char: string): string | undefined {
  return EMOJI_MAP.get(char) ?? EMOJI_MAP.get(stripVariation(char));
}

register(EMOJI_SPRITE);
register(EMOJI_SPRITE_SKINS);

export function loadEmojiSkins(): Promise<void> {
  if (skinsState === 'ready') return Promise.resolve();
  skinsState = 'ready';
  skinListeners.forEach((listener) => listener());
  return Promise.resolve();
}

export function toCode(char: string): string {
  return Array.from(char)
    .map((ch) => ch.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-');
}

export function isEmojiInSprite(_char: string): boolean {
  return true;
}

export function getEmojiHtml(char: string): string | null {
  return lookup(char) ?? null;
}

interface Props {
  char: string;
  className?: string;
}

export function EmojiSvg({ char, className = 'emoji-svg' }: Props) {
  const [, update] = useReducer((n: number) => n + 1, 0);
  const html = lookup(char);

  useEffect(() => {
    if (html || !TONE_PATTERN.test(char)) return;
    const listener = () => update();
    skinListeners.add(listener);
    void loadEmojiSkins();
    return () => {
      skinListeners.delete(listener);
    };
  }, [char, html]);

  if (!html) {
    return <span className={className}>{char}</span>;
  }
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', width: '1.2em', height: '1.2em', verticalAlign: '-0.2em' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}