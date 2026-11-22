import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from './twemoji.mjs';

let sprite = '';
for (const [file, name] of [
  ['emojiSprite.ts', 'EMOJI_SPRITE'],
  ['emojiSkins.ts', 'EMOJI_SPRITE_SKINS'],
]) {
  const source = await readFile(join(root, file), 'utf8');
  const match = source.match(new RegExp(`export const ${name} = (".*");`, 's'));
  sprite += `${JSON.parse(match[1])}\n`;
}

const empty = [...sprite.matchAll(/<svg data-emoji="([^"]+)"[^>]*>(.*?)<\/svg>/g)]
  .filter((item) => !/<(path|circle|ellipse|rect|polygon|polyline|g|use|line)\b/.test(item[2]))
  .map((item) => item[1]);

if (empty.length) {
  console.error(`Пустых эмодзи: ${empty.length}`);
  console.error(empty.join(' '));
  process.exit(1);
}
console.log('Пустых эмодзи нет');
