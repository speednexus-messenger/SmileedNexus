import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { loadSvg, mapPool, root } from './twemoji.mjs';

const require = createRequire(import.meta.url);
const ru = require('emojibase-data/ru/data.json');
const en = require('emojibase-data/en/data.json');

const GROUPS = {
  0: 'people',
  1: 'people',
  3: 'nature',
  4: 'food',
  5: 'travel',
  6: 'activity',
  7: 'objects',
  8: 'symbols',
  9: 'flags',
};

const CATEGORIES = [
  { id: 'frequent', icon: '🕘', label: 'Недавние' },
  { id: 'people', icon: '😀', label: 'Смайлы' },
  { id: 'nature', icon: '🌿', label: 'Природа' },
  { id: 'food', icon: '🍔', label: 'Еда' },
  { id: 'activity', icon: '⚽', label: 'Активность' },
  { id: 'travel', icon: '🚗', label: 'Места' },
  { id: 'objects', icon: '💡', label: 'Объекты' },
  { id: 'symbols', icon: '❤️', label: 'Символы' },
  { id: 'flags', icon: '🏳️', label: 'Флаги' },
];

const normalizeChar = (char) => char.replace(/\uFE0F/g, '');

async function readExisting() {
  const result = new Map();
  let source = '';
  try {
    source = await readFile(join(root, 'emojiData.ts'), 'utf8');
  } catch {
    return result;
  }
  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith('],')) {
      const row = JSON.parse(trimmed.replace(/,$/, ''));
      result.set(normalizeChar(row[0]), { name: row[1], keywords: row[2] });
      continue;
    }
    const match = trimmed.match(/^\{ char: '([^']+)', name: '([^']*)', keywords: (\[[^\]]*\])/);
    if (match) {
      const keywords = new Function(`return ${match[3]}`)();
      result.set(normalizeChar(match[1]), { name: match[2], keywords });
    }
  }
  return result;
}

const existing = await readExisting();

const enByHex = new Map(en.map((item) => [item.hexcode, item]));
const unique = (list) => [...new Set(list.map((v) => v.trim()).filter(Boolean))];

const base = ru
  .filter((item) => item.group !== undefined && item.group !== 2 && GROUPS[item.group])
  .sort((a, b) => a.order - b.order);

const availability = await mapPool(base, 16, async (item) => {
  const svg = await loadSvg(item.emoji);
  if (!svg) return { item, ok: false, skins: null };
  const tones = (item.skins ?? [])
    .filter((skin) => typeof skin.tone === 'number')
    .sort((a, b) => a.tone - b.tone);
  if (tones.length !== 5) return { item, ok: true, skins: null };
  const found = await Promise.all(tones.map((skin) => loadSvg(skin.emoji)));
  return { item, ok: true, skins: found.every(Boolean) ? tones.map((skin) => skin.emoji) : null };
});

const missing = availability.filter((entry) => !entry.ok).map((entry) => entry.item.emoji);

const entries = availability
  .filter((entry) => entry.ok)
  .map(({ item, skins }) => {
    const english = enByHex.get(item.hexcode);
    const previous = existing.get(normalizeChar(item.emoji));
    const parts = {
      char: item.emoji,
      name: previous?.name ?? item.label,
      keywords: unique([...(previous?.keywords ?? []), item.label, ...(item.tags ?? [])]),
      keywordsEn: unique([english?.label ?? '', ...(english?.tags ?? [])]),
      category: GROUPS[item.group],
    };
    if (skins) parts.skins = skins;
    return parts;
  });

const lines = entries.map((entry) => {
  const row = [entry.char, entry.name, entry.keywords, entry.keywordsEn, entry.category];
  if (entry.skins) row.push(entry.skins);
  return `  ${JSON.stringify(row)},`;
});

const header = `export type CategoryId =
  | 'frequent'
  | 'people'
  | 'nature'
  | 'food'
  | 'activity'
  | 'travel'
  | 'objects'
  | 'symbols'
  | 'flags';

export interface EmojiEntry {
  char: string;
  name: string;
  keywords: string[];
  keywordsEn: string[];
  category: CategoryId;
  skins?: string[];
}

export interface EmojiCategory {
  id: CategoryId;
  icon: string;
  label: string;
}

export const CATEGORIES: EmojiCategory[] = ${JSON.stringify(CATEGORIES, null, 2).replace(/"(\w+)":/g, '$1:')};

type Row = [string, string, string[], string[], CategoryId, string[]?];

const ROWS: Row[] = [
${lines.join('\n')}
];

export const EMOJIS: EmojiEntry[] = ROWS.map(([char, name, keywords, keywordsEn, category, skins]) =>
  skins ? { char, name, keywords, keywordsEn, category, skins } : { char, name, keywords, keywordsEn, category },
);
`;

await writeFile(join(root, 'emojiData.ts'), header, 'utf8');

const withSkins = entries.filter((entry) => entry.skins).length;
console.log(`Эмодзи: ${entries.length}, с тонами кожи: ${withSkins}`);
if (missing.length) console.log(`Пропущены (нет в Twemoji ${missing.length}): ${missing.join(' ')}`);
