/* Rebuilds public/art/NN-sm.webp and NN-lg.webp from the original photos.
   1. Download each URL in sources.txt, in order, as 01.jpg, 02.jpg … 34.jpg into a folder.
   2. In a scratch folder: npm i sharp
   3. node resize.cjs <folder-with-jpgs> <path-to>/public/art
   sm = 240 px on the short side (list rows, mini player); lg = 1080 px (hero, cover, player). */
const sharp = require('sharp'), fs = require('fs'), path = require('path');
const [src, out] = process.argv.slice(2);
(async () => {
  let sm = 0, lg = 0;
  for (const f of fs.readdirSync(src).filter(f => f.endsWith('.jpg')).sort()) {
    const n = f.replace('.jpg', '');
    const img = () => sharp(path.join(src, f)).rotate();
    const meta = await img().metadata();
    const portrait = (meta.orientation >= 5 ? meta.width > meta.height : meta.height > meta.width);
    const fit = s => portrait ? {width: s} : {height: s};
    await img().resize({...fit(240), withoutEnlargement: true}).webp({quality: 72, effort: 6}).toFile(`${out}/${n}-sm.webp`);
    await img().resize({...fit(1080), withoutEnlargement: true}).webp({quality: 70, effort: 6}).toFile(`${out}/${n}-lg.webp`);
    sm += fs.statSync(`${out}/${n}-sm.webp`).size; lg += fs.statSync(`${out}/${n}-lg.webp`).size;
  }
  console.log('sm total KB', Math.round(sm/1024), 'lg total KB', Math.round(lg/1024));
})();
