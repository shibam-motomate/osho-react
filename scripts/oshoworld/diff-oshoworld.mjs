// Usage: node diff-oshoworld.mjs
// Compares oshoworld-manifest.json (from scan-oshoworld.mjs) against our
// existing archive.org-sourced dataset and reports oshoworld series that
// don't appear to exist in our data yet.
import { readFileSync, writeFileSync } from 'fs';
import { OSHO_DATA_EN } from '../../src/data/oshoData.en.js';
import { OSHO_DATA_HI } from '../../src/data/oshoData.hi.js';

function normalize(title) {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const manifest = JSON.parse(readFileSync(new URL('./oshoworld-manifest.json', import.meta.url)));

const existingByLang = {
  english: new Set(OSHO_DATA_EN.map((s) => normalize(s.n))),
  hindi: new Set(OSHO_DATA_HI.map((s) => normalize(s.n))),
};

const missing = [];
const matched = [];
for (const s of manifest.series) {
  const set = existingByLang[s.language];
  if (!set) continue; // unrecognized language bucket, skip
  const key = normalize(s.title);
  if (set.has(key)) {
    matched.push(s);
  } else {
    missing.push(s);
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
console.log('\nWrote missing-series.json');
console.log('\nSample missing titles:');
for (const [lang, list] of Object.entries(missingByLang)) {
  console.log(`-- ${lang} --`);
  for (const s of list.slice(0, 15)) {
    console.log(`  ${s.title} (${s.episodes.length} eps) [${s.slug}]`);
  }
}
