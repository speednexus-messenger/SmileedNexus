import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { optimize } from 'svgo';
import { loadSvg, mapPool, normalize, root, toCode } from './twemoji.mjs';

const SYMBOL_ID_PREFIX = 'sn-';
const CONCURRENCY = 16;

async function readChars() {
  const source = await readFile(join(root, 'emojiData.ts'), 'utf8');
  const chars = new Map();
  const add = (raw) => {
    const key = normalize(raw);
    if (!chars.has(key)) chars.set(key, raw);
  };
  for (const line of source.split('\n')) {
    if (!line.startsWith('  [')) continue;
    const row = JSON.parse(line.trim().replace(/,$/, ''));
    add(row[0]);
    if (row[5]) row[5].forEach(add);
  }
  for (const match of source.matchAll(/\bicon: "((?:[^"\\]|\\.)+)"/g)) add(JSON.parse(`"${match[1]}"`));
  return [...chars.values()];
}

function svgBody(code, svg) {
  const match = svg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/i);
  if (!match) throw new Error(`Некорректный SVG для ${code}`);
  return match[1].replace(/>\s+</g, '><').trim();
}

function minify(code, svg) {
  const result = optimize(svg, {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: { overrides: { removeViewBox: false, cleanupIds: false } },
      },
      'removeDimensions',
    ],
  });
  return svgBody(code, result.data);
}

const chars = await readChars();

const results = await mapPool(chars, CONCURRENCY, async (char) => {
  const code = toCode(char);
  const svg = await loadSvg(char);
  if (!svg) return { char, code, body: null };
  return { char, code, body: minify(code, svg) };
});

const failed = results.filter((item) => !item.body);
if (failed.length) {
  console.error(`Не найден SVG для ${failed.length} эмодзи:`);
  for (const item of failed) console.error(`  ${item.char} (${item.code})`);
  process.exit(1);
}

const TONE = /[\u{1F3FB}-\u{1F3FF}]/u;

const toSvg = (item) =>
  `<svg data-emoji="${item.char}" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">${item.body}</svg>`;

const render = (name, list) => `export const ${name} = ${JSON.stringify(list.map(toSvg).join('\n'))};\n`;

const sorted = results.sort((a, b) => (a.code < b.code ? -1 : 1));
const skins = sorted.filter((item) => TONE.test(item.char));
const base = sorted.filter((item) => !TONE.test(item.char));

const baseOutput = render('EMOJI_SPRITE', base);
const skinsOutput = render('EMOJI_SPRITE_SKINS', skins);

await writeFile(join(root, 'emojiSprite.ts'), baseOutput, 'utf8');
await writeFile(join(root, 'emojiSkins.ts'), skinsOutput, 'utf8');

const kb = (text) => `${(Buffer.byteLength(text) / 1024).toFixed(0)} КБ`;
console.log(`emojiSprite.ts: ${base.length} эмодзи, ${kb(baseOutput)}`);
console.log(`emojiSkins.ts: ${skins.length} эмодзи, ${kb(skinsOutput)}`);