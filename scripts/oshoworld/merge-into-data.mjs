// Usage: node merge-into-data.mjs
// Appends a hand-picked, verified-non-duplicate subset of
// full-missing-series.json into src/data/oshoData.en.js / oshoData.hi.js,
// in the same shape as the existing hand-curated entries.
//
// Only series with NO title/substring overlap against the existing dataset
// are included here — see the investigation in this session's history for
// why the other 25 fetched series were excluded as likely duplicates
// already present under fuller titles (e.g. oshoworld's "From Bondage to
// Freedom" == our existing "From Bondage to Freedom: The Rajneesh Bible Vol
// 8", same 43 episodes).
import { readFileSync, writeFileSync } from 'fs';
import { OSHO_DATA_EN } from '../../src/data/oshoData.en.js';
import { OSHO_DATA_HI } from '../../src/data/oshoData.hi.js';

const ADDITIONS = {
  'Maha Geeta 01-91': { lang: 'hindi', genre: 'indianmystics' },
  'Nahin Ram Bin Thaon 01-16': { lang: 'hindi', genre: 'misc' },
  'Shiksha Main Kranti 01-28': { lang: 'hindi', genre: 'misc' },
  'A Sudden Clash of Thunder': { lang: 'english', genre: 'zen' },
  'Christianity and Zen': { lang: 'english', genre: 'zen' },
};

function cleanSeriesTitle(title) {
  return title.replace(/\s*\d{1,3}-\d{1,3}\s*$/, '').trim();
}

function toId(prefix, title) {
  const camel = title.replace(/[^a-zA-Z0-9]+/g, '');
  return prefix ? `${prefix}${camel}` : `${camel}OshoWorld`;
}

const full = JSON.parse(readFileSync(new URL('./full-missing-series.json', import.meta.url)));

let hiNextNum = Math.max(...OSHO_DATA_HI.map((s) => parseInt(s.i.match(/^\d+/)?.[0] || '0', 10))) + 1;

const newHi = [];
const newEn = [];

for (const s of full) {
  const spec = ADDITIONS[s.title];
  if (!spec) continue;
  const cleanTitle = cleanSeriesTitle(s.title);
  const entry = {
    i: spec.lang === 'hindi' ? toId(String(hiNextNum++).padStart(3, '0'), cleanTitle) : toId(null, cleanTitle),
    n: cleanTitle,
    g: spec.genre,
    x: `A series of Osho's discourses in ${spec.lang === 'hindi' ? 'Hindi' : 'English'} titled "${cleanTitle}", sourced from OSHO World.`,
    e: s.episodes,
  };
  if (spec.lang === 'hindi') newHi.push(entry);
  else newEn.push(entry);
}

console.log(`Adding ${newHi.length} Hindi series (${newHi.reduce((n, s) => n + s.e.length, 0)} episodes)`);
console.log(`Adding ${newEn.length} English series (${newEn.reduce((n, s) => n + s.e.length, 0)} episodes)`);

if (newHi.length) {
  const merged = [...OSHO_DATA_HI, ...newHi];
  writeFileSync(
    new URL('../../src/data/oshoData.hi.js', import.meta.url),
    `export const OSHO_DATA_HI = ${JSON.stringify(merged)};\n`,
  );
  console.log(`Wrote oshoData.hi.js: ${merged.length} total series`);
}

if (newEn.length) {
  const merged = [...OSHO_DATA_EN, ...newEn];
  writeFileSync(
    new URL('../../src/data/oshoData.en.js', import.meta.url),
    `export const OSHO_DATA_EN = ${JSON.stringify(merged)};\n`,
  );
  console.log(`Wrote oshoData.en.js: ${merged.length} total series`);
}
