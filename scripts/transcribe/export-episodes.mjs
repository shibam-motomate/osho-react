// Usage: node export-episodes.mjs <series-id|--all> [en|hi]
// Writes manifest.json: a flat list of {seriesId, seriesName, episodeIndex, title, url, duration, lang}
import { writeFileSync } from 'fs';
import { OSHO_DATA } from '../../src/data/oshoData.js';

const seriesId = process.argv[2];
const lang = process.argv[3] || 'en';

if (!seriesId) {
  console.error('Usage: node export-episodes.mjs <series-id|--all> [en|hi]');
  process.exit(1);
}

const pool = OSHO_DATA[lang] || OSHO_DATA.en;
const series = seriesId === '--all' ? pool : pool.filter(s => s.i === seriesId);

if (!series.length) {
  console.error(`No series found for "${seriesId}" in lang "${lang}". Available ids:`);
  console.error(pool.map(s => s.i).join('\n'));
  process.exit(1);
}

const manifest = [];
for (const s of series) {
  s.e.forEach((ep, idx) => {
    manifest.push({
      seriesId: s.i,
      seriesName: s.n,
      episodeIndex: idx,
      title: ep.t,
      url: ep.u,
      duration: ep.d,
      lang,
    });
  });
}

writeFileSync(new URL('./manifest.json', import.meta.url), JSON.stringify(manifest, null, 2));
console.log(`Wrote ${manifest.length} episodes from ${series.length} series to manifest.json`);
