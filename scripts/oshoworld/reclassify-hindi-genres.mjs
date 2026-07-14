// Usage: node reclassify-hindi-genres.mjs
// 121 of 163 Hindi series (74%) were tagged "misc" despite most having a
// description that names the actual subject (a saint, a practice, a Q&A
// format, etc.) - this reclassifies them into the existing genre taxonomy
// used by English. Series with no usable description are left as "misc"
// rather than guessed. Also fixes two pre-existing title mislabels found
// while reading through descriptions (both entries' "n" field didn't match
// their own "i" id or their actual content).
import { readFileSync, writeFileSync } from 'fs';
import { OSHO_DATA_HI } from '../../src/data/oshoData.hi.js';

// Index into OSHO_DATA_HI.filter(s => s.g === 'misc'), in that filtered
// order. null = leave as misc (no confident classification available).
const GENRE_BY_MISC_INDEX = [
  'indianmystics', 'indianmystics', 'responses', 'responses', 'meditation', // 0-4
  'talks', 'talks', 'talks', 'talks', 'talks', // 5-9
  'talks', 'talks', 'talks', 'sufism', 'zen', // 10-14
  'indianmystics', 'responses', 'talks', 'talks', 'talks', // 15-19
  'talks', 'zen', 'indianmystics', 'talks', 'responses', // 20-24
  'talks', 'buddha', 'indianmystics', 'talks', 'talks', // 25-29
  'indianmystics', 'talks', 'indianmystics', 'indianmystics', 'indianmystics', // 30-34
  'kabir', 'indianmystics', 'responses', 'responses', 'responses', // 35-39
  null, null, null, 'meditation', 'responses', // 40-44
  'responses', null, null, null, 'kabir', // 45-49
  'responses', null, 'responses', 'talks', 'talks', // 50-54
  'responses', 'tantra', 'meditation', 'responses', null, // 55-59
  'meditation', 'responses', 'kabir', 'indianmystics', 'indianmystics', // 60-64
  'meditation', 'meditation', 'meditation', 'talks', 'talks', // 65-69
  'talks', 'talks', 'talks', 'indianmystics', 'indianmystics', // 70-74
  null, 'responses', 'responses', 'responses', null, // 75-79
  'meditation', null, 'meditation', 'talks', null, // 80-84
  'talks', 'responses', 'responses', 'meditation', 'indianmystics', // 85-89
  null, 'zen', 'western', 'upanishads', null, // 90-94
  'responses', 'responses', 'meditation', 'meditation', 'meditation', // 95-99
  'talks', 'meditation', 'talks', 'talks', 'talks', // 100-104
  'kabir', null, 'responses', 'talks', 'talks', // 105-109
  'responses', null, null, 'responses', 'responses', // 110-114
  'talks', null, 'responses', 'responses', null, // 115-119
];

// Pre-existing "n" mislabels found while reading descriptions: both had a
// display title that didn't match their own id or their actual content
// (confirmed for the first via matching episode durations against
// OSHO World, and for the second via matching its OSHO World title/count).
const TITLE_FIXES = {
  '161ShikshaMainKranti0128OshoWorld': 'Shiksha Main Kranti',
  '164SatyaKiPyas0109OshoWorld': 'Satya Ki Pyas',
};

let i = 0;
let reclassified = 0;
const updated = OSHO_DATA_HI.map((s) => {
  let next = s;
  if (TITLE_FIXES[s.i] && s.n !== TITLE_FIXES[s.i]) {
    next = { ...next, n: TITLE_FIXES[s.i] };
  }
  if (s.g === 'misc') {
    const genre = GENRE_BY_MISC_INDEX[i++];
    if (genre) {
      next = { ...next, g: genre };
      reclassified++;
    }
  }
  return next;
});

console.log(`Reclassified ${reclassified} of ${i} misc series`);
console.log(`Fixed ${Object.keys(TITLE_FIXES).length} mislabeled titles`);

writeFileSync(
  new URL('../../src/data/oshoData.hi.js', import.meta.url),
  `export const OSHO_DATA_HI = ${JSON.stringify(updated)};\n`,
);

const counts = {};
for (const s of updated) counts[s.g] = (counts[s.g] || 0) + 1;
console.log('New genre distribution:', counts);
