/* ── Icons: Lucide (https://lucide.dev, ISC licence) via lucide-react; only the icons used are
   bundled. The app keeps its own names (IcoPlay, IcoHeart…) so screens don't import Lucide
   directly, and `s` is still the size of the icon's box in px.

   Lucide draws on a 24-unit grid with ~2 units of padding; the old icons filled their whole
   box. To keep every button and row looking the same size as before, the view is cropped to
   the inner 20 units (VIEW) and the stroke set so lines weigh what they did (STROKE). ── */
import {
  ALargeSmall, ArrowDownAZ, ArrowDownZA, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, Clock,
  EllipsisVertical, Gauge, Headphones, Heart, History, Languages, List, ListFilter, ListMusic, ListOrdered,
  LogOut, Maximize, MessageSquareText, Moon, Pause, PenLine, Play, Search, Share2, Shuffle, SkipBack,
  SkipForward, Smartphone, SquarePlus, Sun, SunMoon, Trash2, UserRound, Video, Volume1, Volume2, VolumeX, X,
} from 'lucide-react';

const VIEW = '2 2 20 20';
const STROKE = 1.65;

// Wrap a Lucide icon with the app's default size; `solid` fills the shape (play, pause…).
const icon = (Lucide, defaultSize, solid = false) => {
  const Ico = ({s = defaultSize}) => (
    <Lucide size={s} viewBox={VIEW} strokeWidth={STROKE} fill={solid ? 'currentColor' : 'none'}
      aria-hidden="true" focusable="false"/>
  );
  return Ico;
};

export const IcoSearch = icon(Search, 17);
export const IcoBack = icon(ChevronLeft, 22);
export const IcoChevronRight = icon(ChevronRight, 22);
export const IcoDown = icon(ChevronDown, 24);
export const IcoX = icon(X, 16);
export const IcoCheck = icon(Check, 14);
export const IcoShare = icon(Share2, 15);
export const IcoUser = icon(UserRound, 15);
export const IcoLogOut = icon(LogOut, 15);
export const IcoClock = icon(Clock, 17);
export const IcoVideo = icon(Video, 20);
export const IcoHeadphones = icon(Headphones, 20); // Discourses tab and saved talks: something to listen to
export const IcoBook = icon(BookOpen, 20);
export const IcoFullscreen = icon(Maximize, 19);
export const IcoSpeed = icon(Gauge, 16);
export const IcoMoon = icon(Moon, 16);
export const IcoMoonFill = icon(Moon, 18, true);
export const IcoSun = icon(Sun, 18);
export const IcoList = icon(List, 18);
export const IcoHistory = icon(History, 22);
export const IcoPlaylist = icon(ListMusic, 22);
export const IcoMoreVert = icon(EllipsisVertical, 16);
export const IcoPlusSquare = icon(SquarePlus, 16);
export const IcoPhone = icon(Smartphone, 22);
export const IcoTheme = icon(SunMoon, 20);
export const IcoTextSize = icon(ALargeSmall, 20);
export const IcoLanguages = icon(Languages, 20);
export const IcoMessage = icon(MessageSquareText, 20);
export const IcoPencil = icon(PenLine, 20);
export const IcoTrash = icon(Trash2, 20);
// Sorting the series list
export const IcoFilter = icon(ListFilter, 18);
export const IcoShuffle = icon(Shuffle, 20);
export const IcoSortAZ = icon(ArrowDownAZ, 20);
export const IcoSortZA = icon(ArrowDownZA, 20);
export const IcoSortCount = icon(ListOrdered, 20);
// Volume
export const IcoVolume = icon(Volume2, 20);
export const IcoVolumeLow = icon(Volume1, 20);
export const IcoVolumeMute = icon(VolumeX, 20);

// Transport: solid shapes. Lucide's play triangle already sits slightly right of centre
// (about 6 % of its width), which is what makes it look centred inside a round button.
export const IcoPlay = icon(Play, 24, true);
export const IcoPause = icon(Pause, 24, true);
export const IcoPrev = icon(SkipBack, 28, true);
export const IcoNext = icon(SkipForward, 28, true);

export const IcoHeart = ({s = 15, filled = false}) => (
  <Heart size={s} viewBox={VIEW} strokeWidth={STROKE} fill={filled ? 'currentColor' : 'none'}
    aria-hidden="true" focusable="false"/>
);

/* Skip back / forward N seconds: Lucide's rotate-ccw / rotate-cw arrow with the number inside
   (the standard podcast-app glyph — Lucide has no numbered version). */
const SkipGlyph = ({s, n, fwd}) => (
  <svg width={s} height={s} viewBox={VIEW} fill="none" stroke="currentColor" strokeWidth={STROKE}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {fwd
      ? <><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></>
      : <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></>}
    <text x="12" y="15.2" textAnchor="middle" fontSize="7.6" fontWeight="700" fill="currentColor" stroke="none"
      fontFamily="'Instrument Sans', system-ui, sans-serif">{n}</text>
  </svg>
);
export const IcoSkipBack = ({s = 34, n = 10}) => <SkipGlyph s={s} n={n}/>;
export const IcoSkipFwd = ({s = 34, n = 10}) => <SkipGlyph s={s} n={n} fwd/>;

/* "Now playing" bars (animated in CSS) — not an icon set glyph. */
export const Wave = () => <div className="wave"><b/><b/><b/></div>;
