/* ── UI i18n ── */
export const LANGS = {en:'English',hi:'हिन्दी',bn:'বাংলা'};
const T_RAW = {
  en:{talks:n=>`${n.toLocaleString('en-IN')} talk${n===1?'':'s'}`,minLeft:m=>`${m} min left`,continueBtn:'Continue',continueTalk:n=>`Continue talk ${n}`,playFromStart:'Play from start',finished:'Finished',startHere:'Try this series',upNext:'Up next',speed:'Speed',sleep:'Sleep timer',saveBtn:'Save',savedBtn:'Saved',home:'Home',savedTab:'Library',showAll:n=>`Show all ${n}`,showLess:'Show less',clearHistory:'Clear',accountTab:'Account',historyTab:'History',topics:'Topics',allTopics:'All topics',recentlyPlayed:'Recently played',appearance:'Appearance',dark:'Dark',light:'Light',textSize:'Text size',textNormal:'Normal',textLarge:'Large',textXLarge:'Extra large',homeScreen:'Add to Home Screen',signIn:'Sign in',createAccount:'Create account',findTalk:'Find a talk',talksLbl:'Talks',library:'Library',preferences:'Preferences',search:'Search series, discourses…',continueListening:'Continue listening',exploreTopic:'Browse by topic',allSeries:'All series',all:'All',episodes:n=>`${n} ep`,searchEp:'Search episodes…',nowPlaying:'Now playing',back:'Series',left:'left',discEn:'English',discHi:'Hindi',discourseLang:'Discourses in',noSeries:'No series match your filters.',noEpisodes:'No episodes match your search.',linkCopied:'Link copied',footerNote:'Free to listen. No ads, and no account needed.',footerAttribution:'Recordings and photos come from the Osho World archive.',discoursesTab:'Discourses',videosTab:'Videos',booksTab:'Books',searchVideos:'Search video discourses…',searchBooks:'Search books, authors…',videosIn:'Videos in',noVideos:'No videos match your filters.',noBooks:'No books match your filters.',allBooks:'Books',format:'Format',readComingSoon:'Reading in-app is coming soon',savedBooksEmpty:'No saved books yet. Tap the heart on a book to keep it here.',genres:{zen:'Zen',meditation:'Meditation',tantra:'Tantra',sufism:'Sufism',yoga:'Yoga',buddha:'Buddha',kabir:'Kabir',tao:'Tao',upanishads:'Upanishads',western:'Western Mystics',baul:'Baul Mystics',jewish:'Jewish Mystics',jesus:'Jesus',responses:'Q & A',talks:'Talks',indianmystics:'Indian Mystics',misc:'Other'}},
  hi:{finished:'पूरा हुआ',search:'श्रृंखला खोजें…',continueListening:'सुनना जारी रखें',exploreTopic:'विषय के अनुसार',allSeries:'सभी श्रृंखलाएं',all:'सभी',episodes:n=>`${n} प्रवचन`,searchEp:'प्रवचन खोजें…',nowPlaying:'अभी चल रहा है',back:'श्रृंखला',left:'शेष',discEn:'अंग्रेज़ी',discHi:'हिन्दी',discourseLang:'प्रवचन भाषा',noSeries:'आपके फ़िल्टर से कोई श्रृंखला मेल नहीं खाती।',noEpisodes:'आपकी खोज से कोई प्रवचन मेल नहीं खाता।',linkCopied:'लिंक कॉपी हुआ',footerNote:'सुनना निःशुल्क है। कोई विज्ञापन नहीं, खाते की ज़रूरत नहीं।',footerAttribution:'ऑडियो और छवियाँ ओशो के सार्वजनिक संग्रह से प्राप्त हैं।',discoursesTab:'प्रवचन',videosTab:'वीडियो',booksTab:'पुस्तकें',searchVideos:'वीडियो प्रवचन खोजें…',searchBooks:'पुस्तकें खोजें…',videosIn:'वीडियो भाषा',noVideos:'आपके फ़िल्टर से कोई वीडियो मेल नहीं खाता।',noBooks:'आपके फ़िल्टर से कोई पुस्तक मेल नहीं खाती।',allBooks:'पुस्तकें',format:'प्रारूप',readComingSoon:'पढ़ने की सुविधा जल्द ही उपलब्ध होगी',savedBooksEmpty:'अभी तक कोई पुस्तक सहेजी नहीं गई — किसी भी पुस्तक पर दिल के निशान पर टैप करें।',genres:{zen:'ज़ेन',meditation:'ध्यान',tantra:'तंत्र',sufism:'सूफ़ीवाद',yoga:'योग',buddha:'बुद्ध',kabir:'कबीर',tao:'ताओ',upanishads:'उपनिषद',western:'पश्चिमी रहस्यवाद',baul:'बाउल संत',jewish:'यहूदी रहस्यवाद',jesus:'यीशु',responses:'प्रश्न-उत्तर',talks:'वार्ता',indianmystics:'भारतीय रहस्यवादी',misc:'अन्य'}},
  bn:{finished:'শেষ হয়েছে',search:'সিরিজ খুঁজুন…',continueListening:'শোনা চালিয়ে যান',exploreTopic:'বিষয় অনুযায়ী',allSeries:'সব সিরিজ',all:'সব',episodes:n=>`${n} টি`,searchEp:'প্রবচন খুঁজুন…',nowPlaying:'এখন বাজছে',back:'সিরিজ',left:'বাকি',discEn:'ইংরেজি',discHi:'হিন্দি',discourseLang:'প্রবচন ভাষা',noSeries:'আপনার ফিল্টারের সাথে কোনো সিরিজ মেলেনি।',noEpisodes:'আপনার খোঁজার সাথে কোনো আলোচনা মেলেনি।',linkCopied:'লিঙ্ক কপি হয়েছে',footerNote:'শোনা বিনামূল্যে। কোনো বিজ্ঞাপন নেই, অ্যাকাউন্টের দরকার নেই।',footerAttribution:'অডিও এবং ছবি ওশোর সর্বজনীন আর্কাইভ থেকে নেওয়া।',discoursesTab:'প্রবচন',videosTab:'ভিডিও',booksTab:'বই',searchVideos:'ভিডিও প্রবচন খুঁজুন…',searchBooks:'বই খুঁজুন…',videosIn:'ভিডিও ভাষা',noVideos:'আপনার ফিল্টারের সাথে কোনো ভিডিও মেলেনি।',noBooks:'আপনার ফিল্টারের সাথে কোনো বই মেলেনি।',allBooks:'বই',format:'ফরম্যাট',readComingSoon:'পড়ার সুবিধা শীঘ্রই আসছে',savedBooksEmpty:'এখনও কোনো বই সংরক্ষণ করা হয়নি — যেকোনো বইয়ের হৃদয় আইকনে ট্যাপ করুন।',genres:{zen:'জেন',meditation:'ধ্যান',tantra:'তন্ত্র',sufism:'সুফিবাদ',yoga:'যোগ',buddha:'বুদ্ধ',kabir:'কবির',tao:'তাও',upanishads:'উপনিষদ',western:'পশ্চিমা রহস্যবাদ',baul:'বাউল সাধক',jewish:'ইহুদি রহস্যবাদ',jesus:'যিশু',responses:'প্রশ্নোত্তর',talks:'আলোচনা',indianmystics:'ভারতীয় রহস্যবাদী',misc:'অন্যান্য'}},
};


/* Hindi and Bengali UI strings fall back to English for any label they do not define */
const withFallback = l => ({...T_RAW.en, ...l, genres: {...T_RAW.en.genres, ...(l.genres || {})}});
export const T = {en: T_RAW.en, hi: withFallback(T_RAW.hi), bn: withFallback(T_RAW.bn)};

/* ── Genre colours (warm neutral/rose tones, no green) ── */
export const GENRE_COLORS = {
  zen:'#C9BDBA',meditation:'#D3C0BD',tantra:'#C8AFAF',sufism:'#BFAEB8',
  yoga:'#B9AEA6',buddha:'#CBBFA0',kabir:'#C2AFBA',tao:'#B6A9A3',
  upanishads:'#CBB98A',western:'#BDB6B2',baul:'#C7A6AE',jewish:'#BDB0AC',
  jesus:'#CBBEB2',responses:'#BBADA9',talks:'#BFB4BC',indianmystics:'#C4A98F',misc:'#C2BAB4',
};

export const GENRE_LIST = ['all','zen','meditation','tantra','sufism','yoga','buddha','kabir','tao','upanishads','western','baul','jewish','jesus','talks','responses','indianmystics'];

/* ── Osho photos (originally from oshoworld.com), resized and self-hosted in public/art/ ──
   The originals are 1–11 MB camera scans; loading them for 72 px list rows cost ~130 MB on
   the first visit. NN-sm.webp (240 px short side, ~8 KB) is for list rows, the mini player
   and episode thumbnails; NN-lg.webp (1080 px, ~120 KB) for the hero, series cover, full
   player and lock-screen artwork. Sources and the resize script live in scripts/art/.
   photoFor hashes each series id onto this numbering, so keep PHOTO_COUNT and the file
   order stable or every series changes picture. */
export const PHOTO_COUNT = 34;
export const photoFor = (s, size = 'sm') => {
  const n = s.i.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % PHOTO_COUNT + 1;
  return `/art/${String(n).padStart(2, '0')}-${size}.webp`;
};

/* Total episode counts per discourse language, precomputed so the sidebar/topbar
   toggle labels don't force-load a dataset the user hasn't switched to yet */
export const EPISODE_COUNTS = {en: 2912, hi: 2390};

/* ── Book format chip colours ── */
export const BOOK_FORMAT_COLORS = {PDF:'#C8AFAF', EPUB:'#B9AEA6'};

/* Video series identifiers are prefixed 'Video' so audio/video pools never collide,
   and so the pool a saved/history entry belongs to can be derived without extra state */
export const isVideoId = id => id.startsWith('Video');

/* ── Duration helpers ── */
const parseDur = d => { const p = d.split(':').map(Number); return p.length === 3 ? p[0]*3600 + p[1]*60 + p[2] : p[0]*60 + p[1]; };
export const seriesTotalDuration = series => {
  const secs = series.e.reduce((a, e) => a + parseDur(e.d), 0);
  const h = Math.floor(secs / 3600), m = Math.round((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
