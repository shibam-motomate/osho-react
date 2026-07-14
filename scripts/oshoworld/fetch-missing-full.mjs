// Usage: node fetch-missing-full.mjs
// For every series in missing-series.json, fetches the FULL episode list
// (oshoworld's series pages cap the embedded list at 10 tracks). Beyond the
// first 10, each episode has its own detail page/API
// (/api/audio/detail/<episode-slug>) reachable by incrementing the index
// suffix on the first episode's slug, so we walk that instead of relying on
// the broken series-listing pagination.
import { readFileSync, writeFileSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const BASE = 'https://oshoworld.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const CONCURRENCY = 3;
const DELAY_MS = 500;
const MAX_RETRIES = 4;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { stdout } = await execFileAsync(
        'curl',
        ['-sS', '-L', '-A', UA, '--fail', '--connect-timeout', '10', '--max-time', '30', url],
        { maxBuffer: 20 * 1024 * 1024, timeout: 35000 },
      );
      return JSON.parse(stdout);
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) await sleep(1000 * 2 ** attempt);
    }
  }
  throw lastErr;
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = await fn(items[i]);
      } catch (err) {
        console.error(`  ! ${JSON.stringify(items[i])}: ${err.message}`);
        results[i] = { error: err.message, item: items[i] };
      }
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

function toMp3Url(file) {
  // file like "/wp-content/uploads/newAudios/A_Bird_(11)/A_Bird__01.mp3"
  return BASE + file.split('/').map(encodeURIComponent).join('/');
}

async function fetchFullSeries(missing) {
  const seriesResp = await fetchJson(`${BASE}/api/audio/series/${missing.slug}`);
  const listData = seriesResp.listData || [];
  if (!listData.length) throw new Error('empty listData');

  const total = missing.episodeCount ?? listData.length;
  const episodesByIndex = new Map(listData.map((e) => [e.audio_index, e]));

  const firstSlug = listData[0].slug;
  const m = firstSlug.match(/^(.*)-(\d+)$/);
  if (!m) throw new Error(`can't derive slug pattern from "${firstSlug}"`);
  const [, prefix, digitsStr] = m;
  const width = digitsStr.length;

  const missingIndices = [];
  for (let i = 1; i <= total; i++) {
    if (!episodesByIndex.has(i)) missingIndices.push(i);
  }

  if (missingIndices.length) {
    const extra = await mapWithConcurrency(missingIndices, CONCURRENCY, async (i) => {
      const slug = `${prefix}-${String(i).padStart(width, '0')}`;
      const detail = await fetchJson(`${BASE}/api/audio/detail/${slug}`);
      return detail.audioData;
    });
    for (const e of extra) {
      if (e && !e.error && e.audio_index != null) episodesByIndex.set(e.audio_index, e);
    }
  }

  const episodes = [...episodesByIndex.values()]
    .sort((a, b) => a.audio_index - b.audio_index)
    .map((e) => ({
      t: e.title,
      d: e.duration,
      u: toMp3Url(e.file || e.audioFile),
    }));

  return {
    slug: missing.slug,
    language: missing.language,
    title: missing.title,
    episodeCountClaimed: total,
    episodes,
  };
}

const missing = JSON.parse(readFileSync(new URL('./missing-series.json', import.meta.url)));
console.log(`Fetching full episode data for ${missing.length} missing series...`);

const results = await mapWithConcurrency(missing, 1, fetchFullSeries);
const ok = results.filter((r) => r && !r.error);
const failed = results.filter((r) => !r || r.error);

console.log(`\nDone. ${ok.length} series fully fetched, ${failed.length} failed.`);
for (const r of ok) {
  const short = r.episodes.length < r.episodeCountClaimed;
  console.log(`  ${short ? '⚠' : '✓'} ${r.title}: ${r.episodes.length}/${r.episodeCountClaimed} episodes`);
}
if (failed.length) {
  console.log('Failed:', failed.map((f) => f.item?.title));
}

writeFileSync(
  new URL('./full-missing-series.json', import.meta.url),
  JSON.stringify(ok, null, 2),
);
console.log('\nWrote full-missing-series.json');
