/* ── UI i18n ── */
export const LANGS = {en:'English',hi:'हिन्दी',bn:'বাংলা'};
export const T = {
  en:{search:'Search series, discourses…',continueListening:'Continue Listening',exploreTopic:'Explore by Topic',allSeries:'All Series',all:'All',episodes:n=>`${n} ep`,searchEp:'Search episodes…',nowPlaying:'Now Playing',back:'Series',left:'left',discEn:'English',discHi:'Hindi',discourseLang:'Discourses in',noSeries:'No series match your filters.',noEpisodes:'No episodes match your search.',linkCopied:'Link copied',footerNote:'Shared freely for the whole community — no cost, ever.',footerAttribution:'Audio and imagery are sourced from the Osho public archive.',genres:{zen:'Zen',meditation:'Meditation',tantra:'Tantra',sufism:'Sufism',yoga:'Yoga',buddha:'Buddha',kabir:'Kabir',tao:'Tao',upanishads:'Upanishads',western:'Western Mystics',baul:'Baul Mystics',jewish:'Jewish Mystics',jesus:'Jesus',responses:'Q & A',talks:'Talks',misc:'Other'}},
  hi:{search:'श्रृंखला खोजें…',continueListening:'सुनना जारी रखें',exploreTopic:'विषय के अनुसार',allSeries:'सभी श्रृंखलाएं',all:'सभी',episodes:n=>`${n} प्रवचन`,searchEp:'प्रवचन खोजें…',nowPlaying:'अभी चल रहा है',back:'श्रृंखला',left:'शेष',discEn:'अंग्रेज़ी',discHi:'हिन्दी',discourseLang:'प्रवचन भाषा',noSeries:'आपके फ़िल्टर से कोई श्रृंखला मेल नहीं खाती।',noEpisodes:'आपकी खोज से कोई प्रवचन मेल नहीं खाता।',linkCopied:'लिंक कॉपी हुआ',footerNote:'पूरे समुदाय के लिए निःशुल्क उपलब्ध — सदैव मुफ़्त।',footerAttribution:'ऑडियो और छवियाँ ओशो के सार्वजनिक संग्रह से प्राप्त हैं।',genres:{zen:'ज़ेन',meditation:'ध्यान',tantra:'तंत्र',sufism:'सूफ़ीवाद',yoga:'योग',buddha:'बुद्ध',kabir:'कबीर',tao:'ताओ',upanishads:'उपनिषद',western:'पश्चिमी रहस्यवाद',baul:'बाउल संत',jewish:'यहूदी रहस्यवाद',jesus:'यीशु',responses:'प्रश्न-उत्तर',talks:'वार्ता',misc:'अन्य'}},
  bn:{search:'সিরিজ খুঁজুন…',continueListening:'শোনা চালিয়ে যান',exploreTopic:'বিষয় অনুযায়ী',allSeries:'সব সিরিজ',all:'সব',episodes:n=>`${n} টি`,searchEp:'প্রবচন খুঁজুন…',nowPlaying:'এখন বাজছে',back:'সিরিজ',left:'বাকি',discEn:'ইংরেজি',discHi:'হিন্দি',discourseLang:'প্রবচন ভাষা',noSeries:'আপনার ফিল্টারের সাথে কোনো সিরিজ মেলেনি।',noEpisodes:'আপনার খোঁজার সাথে কোনো আলোচনা মেলেনি।',linkCopied:'লিঙ্ক কপি হয়েছে',footerNote:'সমগ্র সম্প্রদায়ের জন্য নিঃখরচায় উপলব্ধ — সবসময় বিনামূল্যে।',footerAttribution:'অডিও এবং ছবি ওশোর সর্বজনীন আর্কাইভ থেকে নেওয়া।',genres:{zen:'জেন',meditation:'ধ্যান',tantra:'তন্ত্র',sufism:'সুফিবাদ',yoga:'যোগ',buddha:'বুদ্ধ',kabir:'কবির',tao:'তাও',upanishads:'উপনিষদ',western:'পশ্চিমা রহস্যবাদ',baul:'বাউল সাধক',jewish:'ইহুদি রহস্যবাদ',jesus:'যিশু',responses:'প্রশ্নোত্তর',talks:'আলোচনা',misc:'অন্যান্য'}},
};

/* ── Genre colours (warm neutral/rose tones, no green) ── */
export const GENRE_COLORS = {
  zen:'#C9BDBA',meditation:'#D3C0BD',tantra:'#C8AFAF',sufism:'#BFAEB8',
  yoga:'#B9AEA6',buddha:'#CBBFA0',kabir:'#C2AFBA',tao:'#B6A9A3',
  upanishads:'#CBB98A',western:'#BDB6B2',baul:'#C7A6AE',jewish:'#BDB0AC',
  jesus:'#CBBEB2',responses:'#BBADA9',talks:'#BFB4BC',misc:'#C2BAB4',
};

export const GENRE_LIST = ['all','zen','meditation','tantra','sufism','yoga','buddha','kabir','tao','upanishads','western','baul','jewish','jesus','talks','responses'];

/* ── Osho photos from oshoworld.com ── */
export const OSHO_PHOTOS = [
  'https://oshoworld.com/uploads/01%20Early%20Days_0001.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0002.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0003.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0004.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0005.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0006.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0007.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0008.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0009.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0010.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0011.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0012.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0013.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0014.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0015.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0016.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0017.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0018.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0019.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0020.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0021.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0022.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0023.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0024.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0025.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0026.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0027.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0028.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0029.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0030.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0031.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0032.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0033.jpg',
  'https://oshoworld.com/uploads/01%20Early%20Days_0034.jpg',
];
/* Pick a consistent photo per series using the identifier as a stable hash */
export const photoFor = s => OSHO_PHOTOS[s.i.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % OSHO_PHOTOS.length];
