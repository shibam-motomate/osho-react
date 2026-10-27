"""Trim the self-hosted Latin fonts to what the app uses (run with fonttools + brotli installed):
   python scripts/subset-fonts.py <unicodes.txt>
- Instrument Sans: width axis pinned to 100 (only normal width is used), weight kept 400–700.
- Fraunces: weight limited to 400–600 (the weights used); optical size kept, so titles look the same.
- Characters: Basic Latin, Latin-1 and the punctuation/symbols found in the app and catalogue.
Glyphs outside the subset fall back to the system font. Re-run from the originals in git history
if new characters (for example a new accented name) need covering."""
import sys, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

unicodes = [int(u[2:], 16) for u in open(sys.argv[1]).read().split(',')]
jobs = {
    'InstrumentSans-Variable.woff2': {'wdth': 100, 'wght': (400, 700)},
    'InstrumentSans-Italic-Variable.woff2': {'wdth': 100, 'wght': (400, 700)},
    'Fraunces-Variable-latin.woff2': {'wght': (400, 600)},
    'Fraunces-Italic-Variable-latin.woff2': {'wght': (400, 600)},
}
for name, axes in jobs.items():
    path = os.path.join('public/fonts', name)
    before = os.path.getsize(path)
    font = TTFont(path, lazy=False)
    font = instancer.instantiateVariableFont(font, axes)
    # round-trip through memory so every table is fully decoded before subsetting
    from io import BytesIO
    buf = BytesIO(); font.flavor = None; font.save(buf); buf.seek(0)
    font = TTFont(buf, lazy=False)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']      # keep kerning, ligatures and other typographic features
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=unicodes)
    sub.subset(font)
    font.flavor = 'woff2'
    font.save(path)
    print(f'{name}: {before // 1024} KB -> {os.path.getsize(path) // 1024} KB')
