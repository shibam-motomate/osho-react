// Usage: node diff-oshoworld.mjs
// Compares oshoworld-manifest.json (from scan-oshoworld.mjs) against our
// existing archive.org-sourced dataset and reports oshoworld series that
// don't appear to exist in our data yet.
//
// Titles can't be compared with a straight normalized-equality check:
// oshoworld's Hindi titles carry a Devanagari gloss and an episode-range
// suffix our data doesn't have (e.g. "Adhyatam Upanishad (अध्यात्म उपनिषद्)
// # 1-17" vs our "Adhyatma Upanishad"), and transliteration spelling drifts
// between the two sources ("Ganwar" vs "Gawar"). So: strip the
// parenthetical/range noise, then fuzzy-match by edit-distance ratio and use
// episode count as a tie-breaker.
import { readFileSync, writeFileSync } from 'fs';
import { OSHO_DATA_EN } from '../../src/data/oshoData.en.js';
import { OSHO_DATA_HI } from '../../src/data/oshoData.hi.js';

const MATCH_THRESHOLD = 0.82;

function cleanTitle(title) {
  return title
    .replace(/\([^)]*\)/g, ' ') // parenthetical Devanagari/glosses
    .replace(/#?\s*\d{1,3}\s*-\s*\d{1,3}\s*$/g, ' ') // trailing "# 1-17" range
    .replace(/\bby\s+osho\b/gi, ' ')
    .replace(/\bvol(ume)?\.?\s*\d+\b/gi, ' ')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // combining diacritics
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function similarity(a, b) {
  if (!a.length && !b.length) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

function bestMatch(cleanedTitle, candidates) {
  let best = null;
  for (const c of candidates) {
    const score = similarity(cleanedTitle, c.clean);
    if (!best || score > best.score) best = { ...c, score };
  }
  return best;
}

const manifest = JSON.parse(readFileSync(new URL('./oshoworld-manifest.json', import.meta.url)));

const existingByLang = {
  english: OSHO_DATA_EN.map((s) => ({ title: s.n, clean: cleanTitle(s.n), episodeCount: s.e.length })),
  hindi: OSHO_DATA_HI.map((s) => ({ title: s.n, clean: cleanTitle(s.n), episodeCount: s.e.length })),
};

const missing = [];
const matched = [];
for (const s of manifest.series) {
  const candidates = existingByLang[s.language];
  if (!candidates) continue; // unrecognized language bucket, skip
  const clean = cleanTitle(s.title);
  const match = bestMatch(clean, candidates);
  if (match && match.score >= MATCH_THRESHOLD) {
    matched.push({ ...s, matchedTitle: match.title, matchScore: match.score.toFixed(2) });
  } else {
    missing.push({ ...s, closestExisting: match ? `${match.title} (${match.score.toFixed(2)})` : null });
  }
}

const missingByLang = missing.reduce((acc, s) => {
  (acc[s.language] ??= []).push(s);
  return acc;
}, {});

console.log(`Matched (already have): ${matched.length}`);
console.log(`Missing (on oshoworld, not in our data):`);
for (const [lang, list] of Object.entries(missingByLang)) {
  const episodeTotal = list.reduce((sum, s) => sum + s.episodes.length, 0);
  console.log(`  ${lang}: ${list.length} series, ${episodeTotal} episodes`);
}

writeFileSync(
  new URL('./missing-series.json', import.meta.url),
  JSON.stringify(missing, null, 2),
);
writeFileSync(
  new URL('./matched-series.json', import.meta.url),
  JSON.stringify(matched, null, 2),
);
console.log('\nWrote missing-series.json and matched-series.json');
console.log('\nSample missing titles (with closest existing match, for spot-checking):');
for (const [lang, list] of Object.entries(missingByLang)) {
  console.log(`-- ${lang} --`);
  for (const s of list.slice(0, 20)) {
    console.log(`  ${s.title} (${s.episodes.length} eps) [${s.slug}]  closest: ${s.closestExisting}`);
  }
}
