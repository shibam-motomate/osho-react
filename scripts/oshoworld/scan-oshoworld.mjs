// Usage: node scan-oshoworld.mjs
// Walks oshoworld.com's sitemap for audio-series pages, fetches each one's
// embedded Next.js data blob, and writes the full episode listing (title,
// duration, mp3 path) to oshoworld-manifest.json for later diffing against
// our existing archive.org-sourced dataset.
import { writeFileSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const BASE = 'https://oshoworld.com';
const SITEMAP_URL = `${BASE}/sitemap.xml`;
// oshoworld.com's Cloudflare bot protection rejects Node's fetch (undici)
// outright regardless of headers, but allows curl with a browser UA. Shell
// out to curl instead of using fetch.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const CONCURRENCY = 3;
const DELAY_MS = 500;
const MAX_RETRIES = 4;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Their bot protection intermittently resets connections under sustained
// crawling even for legitimate pages, so retry with backoff before giving up.
async function fetchText(url) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // --max-time bounds the whole request; without it a stalled connection
      // (no RST, just silence) hangs curl forever and wedges a worker slot.
      const { stdout } = await execFileAsync(
        'curl',
        ['-sS', '-L', '-A', UA, '--fail', '--connect-timeout', '10', '--max-time', '30', url],
        { maxBuffer: 20 * 1024 * 1024, timeout: 35000 },
      );
      return stdout;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) await sleep(1000 * 2 ** attempt);
    }
  }
  throw lastErr;
}

function extractSlugs(sitemapXml) {
  const locs = [...sitemapXml.matchAll(/<loc>(https:\/\/oshoworld\.com\/+[^<]+)<\/loc>/g)].map((m) => m[1]);
  const slugs = new Set();
  for (const loc of locs) {
    const slug = loc.replace(/^https:\/\/oshoworld\.com\/+/, '').trim();
    if (!slug || slug.includes('/')) continue;
    if (slug.startsWith('audio-detail-') || slug.startsWith('video-detail-')) continue;
    // Series slugs end in "-<start>-<count>", e.g. "a-bird-on-the-wing-01-11".
    // Cap both numbers at 3 digits to reject unrelated matches like event-date slugs.
    if (!/-\d{1,3}-\d{1,3}$/.test(slug)) continue;
    slugs.add(slug);
  }
  return [...slugs];
}

function extractNextData(html) {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

async function fetchSeries(slug) {
  const html = await fetchText(`${BASE}/${slug}`);
  const data = extractNextData(html);
  const pageData = data?.props?.pageProps?.data?.pageData;
  const cat = pageData?.categoryData;
  if (!cat || cat.category_type !== 'series' || !Array.isArray(pageData.listData)) {
    return null;
  }
  return {
    slug,
    language: cat.language,
    title: cat.title,
    episodeCount: pageData.total ?? pageData.listData.length,
    episodes: pageData.listData.map((ep) => ({
      title: ep.title,
      duration: ep.duration,
      file: ep.file,
    })),
  };
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
        console.error(`  ! ${items[i]}: ${err.message}`);
        results[i] = { slug: items[i], error: err.message };
      }
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

console.log('Fetching sitemap...');
const sitemapXml = await fetchText(SITEMAP_URL);
const slugs = extractSlugs(sitemapXml);
console.log(`Found ${slugs.length} candidate series slugs. Fetching each series page...`);

const results = await mapWithConcurrency(slugs, CONCURRENCY, fetchSeries);
const series = results.filter((r) => r && !r.error && r.episodes.length);
const errors = results.filter((r) => r && r.error);
const skipped = results.length - series.length - errors.length;

const byLang = series.reduce((acc, s) => {
  acc[s.language] = (acc[s.language] || 0) + 1;
  return acc;
}, {});

console.log(`\nDone. ${series.length} valid series, ${skipped} skipped (not a series page), ${errors.length} errors.`);
console.log('By language:', byLang);

writeFileSync(
  new URL('./oshoworld-manifest.json', import.meta.url),
  JSON.stringify({ scannedAt: new Date().toISOString(), series, errors }, null, 2),
);
console.log('Wrote oshoworld-manifest.json');
