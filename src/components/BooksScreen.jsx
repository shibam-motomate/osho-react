import { useEffect, useMemo, useState } from 'react';
import { IcoBack, IcoSearch, IcoX } from './Icons.jsx';

/* Live search against archive.org's public catalog, filtered to Osho texts. CORS is
   open on advancedsearch.php so this can run straight from the browser. */
const SEARCH_URL = (() => {
  const params = new URLSearchParams();
  params.set('q', 'creator:"osho" AND mediatype:texts');
  ['identifier', 'title', 'year', 'creator'].forEach(f => params.append('fl[]', f));
  params.append('sort[]', 'downloads desc');
  params.set('rows', '300');
  params.set('output', 'json');
  return `https://archive.org/advancedsearch.php?${params.toString()}`;
})();

const coverUrl = id => `https://archive.org/services/img/${id}`;
const readerUrl = id => `https://archive.org/embed/${id}`;

/* ── Books Screen: live archive.org catalog + embedded reader ── */
export function BooksScreen({t, isDesktop}) {
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [search, setSearch] = useState('');
  const [openBook, setOpenBook] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(SEARCH_URL)
      .then(r => { if (!r.ok) throw new Error(`archive.org search failed: ${r.status}`); return r.json(); })
      .then(data => {
        if (cancelled) return;
        setBooks((data.response?.docs || []).filter(d => d.identifier && d.title));
        setStatus('ready');
      })
      .catch(err => { console.error('[archive.org] books search:', err); if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return books;
    const q = search.toLowerCase();
    return books.filter(b => b.title.toLowerCase().includes(q));
  }, [books, search]);

  if (openBook) {
    return (
      <div className="book-reader">
        <div className="back-bar">
          <button className="back-btn" onClick={() => setOpenBook(null)}><IcoBack/>{t.books}</button>
        </div>
        <div className="book-reader-title">{openBook.title}</div>
        <iframe
          className="book-reader-frame"
          src={readerUrl(openBook.identifier)}
          title={openBook.title}
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-wm">Osho<em>·</em></div>
      </div>

      <div className="desk-header">
        <h1>{t.books}<span className="desk-header-count">{filtered.length} {t.books.toLowerCase()}</span></h1>
      </div>

      <div className="screen-body">
        <div className="search-wrap">
          <div className="sbar">
            <span style={{color:'var(--muted)'}}><IcoSearch/></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchBooks}/>
            {search && <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',padding:0,display:'flex'}} onClick={() => setSearch('')}><IcoX/></button>}
          </div>
        </div>

        {!isDesktop && <div className="sec-lbl">{t.books}</div>}
        <div className="book-grid">
          {status === 'loading' ? (
            <div className="empty-state"><div className="loader-ring" style={{margin:'0 auto'}}/></div>
          ) : status === 'error' ? (
            <div className="empty-state">{t.booksError}</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">{t.noBooks}</div>
          ) : filtered.map(b => (
            <div key={b.identifier} className="book-card" onClick={() => setOpenBook(b)}>
              <div className="book-card-cover">
                <img src={coverUrl(b.identifier)} alt="" loading="lazy" onError={e => { e.currentTarget.style.visibility = 'hidden'; }}/>
              </div>
              <div className="book-card-info">
                <div className="book-title">{b.title}</div>
                {b.year && <div className="book-meta">{b.year}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-band">
        <div className="footer-wm">Osho<em>·</em></div>
        <div className="footer-attr">{t.footerBooksAttr}</div>
      </div>
    </>
  );
}
