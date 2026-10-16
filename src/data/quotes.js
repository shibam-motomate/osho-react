/* ── Osho quotes — shown on the first-load screen and at the foot of Home. ── */
export const OSHO_QUOTES = [
  'Life begins where fear ends.',
  "Be — don't try to become.",
  'The moment you accept yourself, you become beautiful.',
  'Love and awareness are two aspects of the same phenomenon.',
  'Drop the idea of becoming someone, because you are already a masterpiece.',
  'Truth is not something outside to be discovered, it is something inside to be realized.',
  'Be realistic: plan for a miracle.',
  'Creativity is the greatest rebellion in existence.',
  'To be creative means to be in love with life.',
  'Nobody can say anything about you. Whatsoever people say is about themselves.',
  'Only those who are ready to become nobodies are able to love.',
  "Don't move the way fear makes you move. Move the way love makes you move.",
  'Courage is a love affair with the unknown.',
  'Fools laugh at others. Wisdom laughs at itself.',
  "If you love a flower, don't pick it up.",
  'Life is not a problem to be solved; it is a mystery to be lived.',
  'Friendship is the purest love.',
  'Whatever you feel, you become. It is your responsibility.',
  'Sadness gives depth. Happiness gives height.',
  'The real question is not whether life exists after death. The real question is whether you are alive before death.',
  'Listen to your being. It is continuously giving you hints.',
  'Experience life in all possible ways: good and bad, bitter and sweet, dark and light, summer and winter.',
];

export const randomQuote = () => OSHO_QUOTES[Math.floor(Math.random() * OSHO_QUOTES.length)];
