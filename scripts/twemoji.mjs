import { access, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const cacheDir = join(root, 'scripts', '.cache');

const TWEMOJI_TAG = 'v16.0.1';
const LOCAL_DIR = process.env.TWEMOJI_DIR ? resolve(process.env.TWEMOJI_DIR) : null;
const TIMEOUT_MS = 10000;
const ATTEMPTS = 3;

const sources = [
  (name) => `https://raw.githubusercontent.com/jdecked/twemoji/${TWEMOJI_TAG}/assets/svg/${name}.svg`,
];

export const normalize = (char) => char.replace(/\uFE0F/g, '');

export const toCode = (char) =>
  Array.from(normalize(char), (ch) => ch.codePointAt(0).toString(16)).join('-');

const rawCodeOf = (char) =>
  Array.from(char, (ch) => ch.codePointAt(0).toString(16)).join('-');

export async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function fileCandidates(rawCode) {
  const stripped = rawCode.replace(/-fe0f/g, '');
  return rawCode.includes('-200d') ? [rawCode, stripped] : [stripped, rawCode];
}

async function download(url) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.status === 404) return null;
      if (response.ok) return await response.text();
    } catch {
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function loadSvg(char) {
  const code = toCode(char);
  await mkdir(cacheDir, { recursive: true });
  const cached = join(cacheDir, `${code}.svg`);
  if (await exists(cached)) return readFile(cached, 'utf8');

  for (const name of fileCandidates(rawCodeOf(char))) {
    if (LOCAL_DIR) {
      const local = join(LOCAL_DIR, `${name}.svg`);
      if (await exists(local)) {
        const svg = await readFile(local, 'utf8');
        await writeFile(cached, svg, 'utf8');
        return svg;
      }
      continue;
    }
    for (const makeUrl of sources) {
      const svg = await download(makeUrl(name));
      if (svg) {
        await writeFile(cached, svg, 'utf8');
        return svg;
      }
    }
  }
  return null;
}

export async function mapPool(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function listFiles(dir) {
  return readdir(dir);
}
