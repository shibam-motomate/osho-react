/* ── Icons: Streamline Core (https://www.streamlinehq.com), CC BY 4.0. Generated from the
   @iconify-json/streamline data; 14 px grid, stroke follows currentColor, `s` sets the size. ── */
const Svg = ({s, children, fillRule}) => <svg width={s} height={s} viewBox="0 0 14 14" strokeWidth="1.15" aria-hidden="true" focusable="false">{children}</svg>;

export const IcoSearch = ({s=17}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M6 11.5a5.5 5.5 0 1 0 0-11a5.5 5.5 0 0 0 0 11m7.5 2L10 10"/></Svg>;
export const IcoBack = ({s=22}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M10.15.5L4 6.65a.48.48 0 0 0 0 .7l6.15 6.15"/></Svg>;
/* Play / pause, drawn for round buttons. The triangle is nudged right of its box centre by
   about a tenth of its width (like Apple's play symbol): fully centred on its bounding box it
   looks left-heavy, centred on its centroid it looks pushed right on small phone buttons;
   the pause bars are slimmer than before so the two icons carry the same visual weight.
   The viewBox crops to the glyph area, so `s` stays roughly the glyph's size. */
export const IcoPlay = ({s=24}) => (
  <svg width={s} height={s} viewBox="3 3 18 18" aria-hidden="true" focusable="false">
    <path fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
      d="M7.55 5.6v12.8a.9.9 0 0 0 1.37.77l10.1-6.4a.9.9 0 0 0 0-1.54L8.92 4.83a.9.9 0 0 0-1.37.77z"/>
  </svg>
);
export const IcoPause = ({s=24}) => (
  <svg width={s} height={s} viewBox="3 3 18 18" aria-hidden="true" focusable="false">
    <rect x="6.5" y="5" width="4" height="14" rx="1.4" fill="currentColor"/>
    <rect x="13.5" y="5" width="4" height="14" rx="1.4" fill="currentColor"/>
  </svg>
);
export const IcoPrev = ({s=28}) => <Svg s={s}><path fill="currentColor" fillRule="evenodd" d="m4.238 6.056l7.819-5.4c.396-.25.878-.183 1.226.08c.269.201.458.519.467.897v10.705c0 .884-.979 1.456-1.693 1.004l-7.82-5.367c-.65-.439-.65-1.48 0-1.919M0 1.742a1 1 0 1 1 2 0v10.516a1 1 0 1 1-2 0z" clipRule="evenodd"/></Svg>;
export const IcoNext = ({s=28}) => <Svg s={s}><path fill="currentColor" fillRule="evenodd" d="M9.512 6.056L1.693.656C1.297.407.815.474.467.737A1.14 1.14 0 0 0 0 1.632v10.705c0 .884.979 1.456 1.693 1.004l7.82-5.367c.65-.439.65-1.48 0-1.919m4.238-4.314a1 1 0 1 0-2 0v10.516a1 1 0 0 0 2 0z" clipRule="evenodd"/></Svg>;
export const IcoX = ({s=16}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="m13.5.5l-13 13m0-13l13 13"/></Svg>;
export const IcoDown = ({s=24}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M.5 3.85L6.65 10a.48.48 0 0 0 .7 0l6.15-6.15"/></Svg>;
export const IcoCheck = ({s=14}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="m.5 8.55l2.73 3.51a1 1 0 0 0 1.56.03L13.5 1.55"/></Svg>;
export const IcoGlobe = ({s=15}) => <Svg s={s}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="6.5"/><path d="M1 9.5h1.75A1.75 1.75 0 0 0 4.5 7.75v-1.5A1.75 1.75 0 0 1 6.25 4.5A1.75 1.75 0 0 0 8 2.75V.57m5.5 6.33a3.56 3.56 0 0 0-1.62-.4H9.75a1.75 1.75 0 0 0 0 3.5A1.25 1.25 0 0 1 11 11.25v.87"/></g></Svg>;
export const IcoVolLo = ({s=14}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M10.5 5.5c.348.42.526.955.5 1.5a2.2 2.2 0 0 1-.5 1.5M3 5H1.5c-.545 0-1 .455-1 1v2c0 .545.455 1 1 1H3l3.91 2.81c.645.447 1.573-.024 1.59-.81V3A.954.954 0 0 0 7 2.19z"/></Svg>;
export const IcoVolHi = ({s=14}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M12.495 10.5a6.9 6.9 0 0 0 1-3.5a6.9 6.9 0 0 0-1-3.5m-1.995 2c.348.42.526.955.5 1.5a2.2 2.2 0 0 1-.5 1.5M3 5H1.5c-.545 0-1 .455-1 1v2c0 .545.455 1 1 1H3l3.91 2.81c.645.447 1.573-.024 1.59-.81V3A.954.954 0 0 0 7 2.19z"/></Svg>;
export const IcoShare = ({s=15}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M2.75 9.25a2.25 2.25 0 1 0 0-4.5a2.25 2.25 0 0 0 0 4.5m8.5 4.25a2.25 2.25 0 1 0 0-4.5a2.25 2.25 0 0 0 0 4.5m0-8.5a2.25 2.25 0 1 0 0-4.5a2.25 2.25 0 0 0 0 4.5M4.76 6l4.48-2.25M4.76 8l4.48 2.25"/></Svg>;
export const IcoChevronRight = ({s=22}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M3.85.5L10 6.65a.48.48 0 0 1 0 .7L3.85 13.5"/></Svg>;
export const IcoBack30 = ({s=26}) => <Svg s={s}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 10.28a.7.7 0 0 1-.37.62a.71.71 0 0 1-.73 0L7.32 7.58a.7.7 0 0 1 0-1.18l5.08-3.3a.71.71 0 0 1 .73 0a.7.7 0 0 1 .37.62z"/><path d="M7.003 10.28a.7.7 0 0 1-.37.62a.71.71 0 0 1-.73 0L.823 7.58a.7.7 0 0 1 0-1.18l5.08-3.3a.71.71 0 0 1 .73 0a.7.7 0 0 1 .37.6z"/></g></Svg>;
export const IcoFwd30 = ({s=26}) => <Svg s={s}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M.5 10.28a.7.7 0 0 0 .37.62a.71.71 0 0 0 .73 0l5.08-3.3a.7.7 0 0 0 0-1.18L1.6 3.1a.71.71 0 0 0-.73 0a.7.7 0 0 0-.37.62z"/><path d="M6.997 10.28a.7.7 0 0 0 .37.62a.71.71 0 0 0 .73 0l5.08-3.3a.7.7 0 0 0 0-1.18L8.097 3.1a.71.71 0 0 0-.73 0a.7.7 0 0 0-.37.6z"/></g></Svg>;
export const IcoHeart = ({s=15, filled=false}) => <Svg s={s}>{filled ? <><path fill="currentColor" fillRule="evenodd" d="M4.024 1.085c.98.071 2.002.55 2.98 1.517c.978-.968 1.999-1.445 2.978-1.514c1.106-.079 2.083.368 2.79 1.073c1.39 1.386 1.827 3.895.102 5.62l-.018.017l-5.516 4.997a.5.5 0 0 1-.672 0L1.152 7.798l-.018-.017c-1.734-1.734-1.3-4.243.095-5.628c.709-.704 1.688-1.148 2.795-1.068" clipRule="evenodd"/></> : <><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M7.004 12.383L1.53 7.424c-2.975-2.975 1.398-8.688 5.474-4.066c4.076-4.622 8.43 1.11 5.475 4.066z"/></>}</Svg>;
export const IcoSliders = ({s=15}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M13.5.5H.5l5 7v6l3-2v-4z"/></Svg>;
export const IcoUser = ({s=15}) => <Svg s={s}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M13.18 13.5a6.49 6.49 0 0 0-12.36 0z"/><path d="M7 9A4.232 4.232 0 1 0 7 .536A4.232 4.232 0 0 0 7 9"/><path d="M8.382 6.405s-.351.691-1.382.691s-1.382-.69-1.382-.69m5.537-2.444h-.028a4.12 4.12 0 0 1-3.09-1.392a4.12 4.12 0 0 1-3.091 1.392a4.1 4.1 0 0 1-1.973-.5a4.234 4.234 0 0 1 8.182.5"/></g></Svg>;
export const IcoLogOut = ({s=15}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M9.5 10.5v2a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v2M6.5 7h7m-2-2l2 2l-2 2"/></Svg>;
export const IcoClock = ({s=17}) => <Svg s={s}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13.5a6.5 6.5 0 1 0 0-13a6.5 6.5 0 0 0 0 13"/><path d="M7 4.5V7l2.54 2.96"/></g></Svg>;
export const IcoHome = ({s=20, filled=false}) => <Svg s={s}>{filled ? <><path fill="currentColor" fillRule="evenodd" d="M.318 6.045A1 1 0 0 0 0 6.776V12.5A1.5 1.5 0 0 0 1.5 14H6v-3a1 1 0 1 1 2 0v3h4.5a1.5 1.5 0 0 0 1.5-1.5V6.776a1 1 0 0 0-.318-.731L7.325.12a.5.5 0 0 0-.65 0z" clipRule="evenodd"/></> : <><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.94a1 1 0 0 0-.32-.74L7 .5L.82 6.2a1 1 0 0 0-.32.74v5.56a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1zM7 13.5v-4"/></>}</Svg>;
export const IcoVideo = ({s=20}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M3.5 6.5a3 3 0 1 0 0-6a3 3 0 0 0 0 6m7 0a2 2 0 1 0 0-4a2 2 0 0 0 0 4M10 9H4.5a1 1 0 0 0-1 1v2.5a1 1 0 0 0 1 1H10a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1m3.5 1v2.5"/></Svg>;
export const IcoHeadphones = ({s=20}) => <Svg s={s}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 6.5a2.5 2.5 0 0 1-5 0V3a2.5 2.5 0 0 1 5 0Z"/><path d="M12 7h0a4.49 4.49 0 0 1-4.5 4.5h-1A4.49 4.49 0 0 1 2 7h0m5 4.5v2"/></g></Svg>;
export const IcoBook = ({s=20}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M7 13.5a9.26 9.26 0 0 0-5.61-2.95a1 1 0 0 1-.89-1V1.5A1 1 0 0 1 .85.74a1 1 0 0 1 .79-.23A9.3 9.3 0 0 1 7 3.43Zm0 0a9.26 9.26 0 0 1 5.61-2.95a1 1 0 0 0 .89-1V1.5a1 1 0 0 0-.35-.76a1 1 0 0 0-.79-.23A9.3 9.3 0 0 0 7 3.43Z"/></Svg>;
export const IcoMinimize = ({s=24}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M10.15.5L4 6.65a.48.48 0 0 0 0 .7l6.15 6.15"/></Svg>;
export const IcoFullscreen = ({s=19}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M13.5 8v4.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1H6m4 0h3.5V4m0-3.5L7 7"/></Svg>;
export const IcoSpeed = ({s=16}) => <Svg s={s}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="6.5"/><path d="m10 4.5l-3 5m-6 0h12"/></g></Svg>;
export const IcoMoon = ({s=16}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M8 7a7 7 0 0 1 3.44-6A6.58 6.58 0 0 0 9 .5a6.5 6.5 0 0 0 0 13a6.58 6.58 0 0 0 2.47-.5A7 7 0 0 1 8 7Z"/></Svg>;
export const IcoLink = ({s=16}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M2.75 9.25a2.25 2.25 0 1 0 0-4.5a2.25 2.25 0 0 0 0 4.5m8.5 4.25a2.25 2.25 0 1 0 0-4.5a2.25 2.25 0 0 0 0 4.5m0-8.5a2.25 2.25 0 1 0 0-4.5a2.25 2.25 0 0 0 0 4.5M4.76 6l4.48-2.25M4.76 8l4.48 2.25"/></Svg>;
export const IcoShuffle = ({s=18}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="m.5 13.5l13-13m-4 0h4v4M9 9l4.5 4.5m-4 0h4v-4M5 5L.5.5"/></Svg>;
export const IcoRepeat = ({s=18}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M10.5 10a2.75 2.75 0 0 0 3-3a2.75 2.75 0 0 0-3-3c-2.75 0-4.25 6-7 6a2.75 2.75 0 0 1-3-3a2.75 2.75 0 0 1 3-3c2.75 0 4.25 6 7 6Z"/></Svg>;
export const IcoExpandDiag = ({s=18}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M11.5.5h1a1 1 0 0 1 1 1v1m-13 0v-1a1 1 0 0 1 1-1h1m3 0h3m5 5v3m-13-3v3m11 5h1a1 1 0 0 0 1-1v-1m-13 0v1a1 1 0 0 0 1 1h1m3 0h3M9 4H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1"/></Svg>;
export const IcoSun = ({s=18}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M7 8.998a1.998 1.998 0 1 0 0-3.996a1.998 1.998 0 0 0 0 3.996M7 .5v1m0 11v1M13.5 7h-1m-11 0h-1m11.1-4.6l-.71.71m-7.78 7.78l-.71.71m9.2 0l-.71-.71M3.11 3.11L2.4 2.4"/></Svg>;
export const IcoMoonFill = ({s=18}) => <Svg s={s}><path fill="currentColor" fillRule="evenodd" d="M9 0a7 7 0 0 0 0 14h.004a7.1 7.1 0 0 0 2.657-.538a.5.5 0 0 0 .061-.894A6.5 6.5 0 0 1 8.5 7a6.5 6.5 0 0 1 3.194-5.568a.5.5 0 0 0-.063-.893A7.1 7.1 0 0 0 9.006 0z" clipRule="evenodd"/></Svg>;
export const IcoList = ({s=18}) => <Svg s={s}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M1 3a.5.5 0 1 0 0-1a.5.5 0 0 0 0 1m3.5-.5h9M1 7.5a.5.5 0 1 0 0-1a.5.5 0 0 0 0 1M4.5 7h9M1 12a.5.5 0 1 0 0-1a.5.5 0 0 0 0 1m3.5-.5h9"/></Svg>;
export const IcoHistory = ({s=22}) => <Svg s={s}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M.5 7A6.5 6.5 0 1 0 7 .5a7.23 7.23 0 0 0-5 2"/><path d="m2.5.5l-.5 2L4 3m3 .5v4L4.4 8.8"/></g></Svg>;
export const IcoPlaylist = ({s=22}) => <Svg s={s}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5.5h-11a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-11a1 1 0 0 0-1-1"/><path d="M5.23 9.23V4.91a.41.41 0 0 1 .62-.35l3.7 2.15a.41.41 0 0 1 0 .71l-3.7 2.16a.41.41 0 0 1-.62-.35"/></g></Svg>;
export const Wave = () => <div className="wave"><b/><b/><b/></div>;
export const IcoMoreVert = ({s=16}) => <Svg s={s}><circle cx="7" cy="2" r="1.25" fill="currentColor"/><circle cx="7" cy="7" r="1.25" fill="currentColor"/><circle cx="7" cy="12" r="1.25" fill="currentColor"/></Svg>;
export const IcoPlusSquare = ({s=16}) => <Svg s={s}><rect x="1" y="1" width="12" height="12" rx="2" fill="none" stroke="currentColor"/><path fill="none" stroke="currentColor" strokeLinecap="round" d="M7 4v6M4 7h6"/></Svg>;
export const IcoPhone = ({s=22}) => <Svg s={s}><rect x="3" y="0.5" width="8" height="13" rx="1.6" fill="none" stroke="currentColor"/><path fill="none" stroke="currentColor" strokeLinecap="round" d="M6 11.25h2"/></Svg>;

/* Skip back / forward N seconds: circular arrow with the number inside (standard podcast-app
   glyph). Drawn on a 24-unit grid; the forward one mirrors the arrow but not the number. */
const SkipGlyph = ({s, n, fwd}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      transform={fwd ? 'translate(24 0) scale(-1 1)' : undefined}>
      <path d="M4.2 12a7.8 7.8 0 1 0 2.3-5.5"/>
      <path d="M6.5 2.6v3.9h3.9"/>
    </g>
    <text x="12" y="15.6" textAnchor="middle" fontSize="7.6" fontWeight="700" fill="currentColor"
      fontFamily="'Instrument Sans', system-ui, sans-serif">{n}</text>
  </svg>
);
export const IcoSkipBack = ({s=34, n=10}) => <SkipGlyph s={s} n={n}/>;
export const IcoSkipFwd = ({s=34, n=10}) => <SkipGlyph s={s} n={n} fwd/>;
