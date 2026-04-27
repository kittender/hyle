// pages.jsx — Landing, SearchPage, DetailPage, DocsPage

const { useState, useEffect, useRef } = React;

// ── MostPulledSection ────────────────────────────────────────────────
const PULL_FILTERS = [
  { id:'month', label:'This month', key:'month' },
  { id:'half',  label:'Last 6 months', key:'half' },
  { id:'year',  label:'This year', key:'year' },
  { id:'all',   label:'All time', key:'all' },
];

function MostPulledSection({ navigate }) {
  const [filter, setFilter] = useState('month');
  const key = PULL_FILTERS.find(f=>f.id===filter).key;
  const sorted = [...(window.PRINTS||[])].filter(p=>p.pulls).sort((a,b)=>(b.pulls[key]||0)-(a.pulls[key]||0)).slice(0,4);

  return (
    <div style={{ marginTop:48 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <h2 className="section-heading">Most pulled</h2>
        <div style={{ display:'flex', gap:4 }}>
          {PULL_FILTERS.map(f => (
            <button key={f.id} onClick={()=>setFilter(f.id)}
              style={{ padding:'4px 11px', fontSize:12, fontWeight: filter===f.id ? 600 : 400, borderRadius:20, border:'1px solid', borderColor: filter===f.id ? 'var(--gold)' : 'var(--border)', background: filter===f.id ? 'rgba(196,152,42,0.1)' : 'transparent', color: filter===f.id ? 'var(--gold)' : 'var(--muted-text)', cursor:'pointer', transition:'all 0.15s' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:1, background:'var(--border)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
        {sorted.map((p,i) => (
          <div key={p.id} onClick={()=>navigate(`/print/${p.id}`)}
            style={{ background:'var(--surface)', padding:'12px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, transition:'background 0.1s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#fdfcf9'}
            onMouseLeave={e=>e.currentTarget.style.background='var(--surface)'}>
            <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--muted)', minWidth:20, textAlign:'right', flexShrink:0 }}>#{i+1}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                <span style={{ color:'var(--muted)' }}>{p.author}/</span><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                {p.verified && <VerifiedBadge/>}{p.community && <CommunityBadge/>}
              </div>
              <p style={{ fontSize:12, color:'var(--muted)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.description}</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted)' }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{opacity:0.6}}><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
                {(p.pulls[key]||0).toLocaleString()} pulls
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TeamPicksSection ─────────────────────────────────────────────────
function TeamPicksSection({ navigate }) {
  const picks = (window.TEAM_PICKS||[]).map(id=>(window.PRINTS||[]).find(p=>p.id===id)).filter(Boolean);

  return (
    <div style={{ marginTop:48 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <h2 className="section-heading">Hylé team picks</h2>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'2px 8px', background:'rgba(196,152,42,0.12)', border:'1px solid rgba(196,152,42,0.3)', borderRadius:20, color:'var(--gold)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>
            Curated
          </span>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {picks.map(p => (
          <div key={p.id} onClick={()=>navigate(`/print/${p.id}`)}
            style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px 20px', cursor:'pointer', display:'flex', gap:16, alignItems:'flex-start', transition:'border-color 0.12s, box-shadow 0.12s', position:'relative' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='#c8b895'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow=''; }}>
            {(p.verified || p.community) && (
              <div style={{ position:'absolute', top:14, right:16 }}>
                {p.verified && <VerifiedLabel/>}
                {p.community && <CommunityLabel/>}
              </div>
            )}
            {/* Team pick accent stripe */}
            <div style={{ width:3, borderRadius:2, background:'linear-gradient(180deg,var(--gold) 0%,rgba(196,152,42,0.2) 100%)', alignSelf:'stretch', flexShrink:0 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:500, marginBottom:5, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span><span style={{ color:'var(--muted)' }}>{p.author}/</span>{p.name}</span>
                {p.verified && <VerifiedBadge/>}{p.community && <CommunityBadge/>}
                <span style={{ display:'flex', gap:3 }}>
                  {p.tags.slice(0,3).map(t=><Tag key={t} label={t}/>)}
                </span>
              </div>
              <p style={{ fontSize:13, color:'var(--muted-text)', margin:'0 0 10px', lineHeight:1.55 }}>{p.description}</p>
              <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                <LangDot lang={p.language}/>
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted)' }}>
                  <Icon name="star" size={12}/>{p.stars.toLocaleString()}
                </span>
                <span style={{ fontSize:12, color:'var(--muted)' }}>{p.license}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Landing Page ─────────────────────────────────────────────────────
function Landing({ navigate }) {
  const [query, setQuery] = useState('');
  const featured = window.PRINTS.slice(0, 4);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    else navigate('/search?q=');
  };

  return (
    <div>
      {/* Hero */}
      <div className="hero">


        <div className="hero-inner">
          <div className="hero-badge">hylé registry</div>
          <p className="hero-sub">
            A community-driven registry of AI-ready project substrates — templates for scaffolding, boilerplating, and structuring projects with agent-driven workflows.
          </p>
          <form onSubmit={handleSearch} className="hero-search-wrap">
            <span className="hero-search-icon"><Icon name="search" size={16}/></span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by language, tags, or author…"
              className="hero-search"
              autoFocus
            />
            <button type="submit" className="hero-search-btn">Search</button>
          </form>
          <div className="hero-stats">
            <span><strong>{window.PRINTS.length}</strong> prints</span>
            <span className="dot">·</span>
            <span><strong>{window.PRINTS.reduce((a,p) => a + p.stars, 0).toLocaleString()}</strong> stars</span>
            <span className="dot">·</span>
            <span>Updated daily</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40, paddingTop: 48, paddingBottom: 64 }}>
        {/* Featured */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <h2 className="section-heading">Featured prints</h2>
            <button className="link-btn" onClick={() => navigate('/search?q=')}>Browse all →</button>
          </div>
          <div className="featured-grid">
            {featured.map(p => <PrintCard key={p.id} print={p} navigate={navigate}/>)}
          </div>

          {/* Most pulled */}
          <MostPulledSection navigate={navigate}/>

          {/* Team picks */}
          <TeamPicksSection navigate={navigate}/>

          {/* Folder anatomy */}
          <div style={{ marginTop: 48 }}>
            <h2 className="section-heading" style={{ marginBottom: 16 }}>Anatomy of a print</h2>
            <div className="anatomy-grid">
              {[
                { folder: 'ontology', color: '#8b6914', desc: 'Source material — PDFs, specs, docs, domain glossaries, data models. The epistemic foundation.' },
                { folder: 'identities', color: '#1a4d2e', desc: 'Agent definitions, role hierarchies, delegation chains, and scope boundaries.' },
                { folder: 'craft', color: '#5a7a3a', desc: 'Boilerplate code, conventions, naming rules, git workflow, and step-by-step examples.' },
                { folder: 'ethics', color: '#c4982a', desc: 'Policies, GDPR rules, invariant constraints, and governance rules enforced at runtime.' },
              ].map(({ folder, color, desc }) => (
                <div key={folder} className="anatomy-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }}/>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500 }}>{folder}/</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <QuickstartPanel/>
          <div style={{ marginTop: 24 }}>
            <div className="qs-title" style={{ marginBottom: 12 }}>Configure</div>
            <div className="qs-cmd">
              <span className="qs-label">Edit substrate config</span>
              <div className="qs-row">
                <code className="qs-code">edit hyle.yaml</code>
                <CopyButton text="edit hyle.yaml"/>
              </div>
            </div>
            <div className="qs-cmd" style={{ marginTop: 8 }}>
              <span className="qs-label">Check topology</span>
              <div className="qs-row">
                <code className="qs-code">hyle topology check</code>
                <CopyButton text="hyle topology check"/>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <div className="qs-title" style={{ marginBottom: 12 }}>Resources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['CLI Reference', '/docs#cli'], ['Publishing a print', '/docs#publishing'], ['Philosophy', '/docs#philosophy']].map(([label, path]) => (
                <button key={label} className="link-btn" style={{ textAlign: 'left', padding: '5px 0' }} onClick={() => navigate(path)}>
                  {label} →
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Official CLI GitHub banner */}
      <div style={{ borderTop:'1px solid var(--border)', background:'var(--surface)', marginTop:0 }}>
        <div className="container" style={{ paddingTop:40, paddingBottom:48 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <div style={{ width:48, height:48, borderRadius:10, background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid #30363d' }}>
                <svg width="24" height="24" viewBox="0 0 16 16" fill="#c9d1d9"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontFamily:'var(--mono)', fontSize:15, fontWeight:600, color:'var(--text)' }}>hyle-org/hyle-cli</span>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', background:'rgba(196,152,42,0.1)', border:'1px solid rgba(196,152,42,0.3)', borderRadius:20, color:'var(--gold)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Official</span>
                </div>
                <p style={{ fontSize:13, color:'var(--muted)', margin:'0 0 10px', maxWidth:520, lineHeight:1.6 }}>The official Hylé CLI — pull, push and manage prints, run agent sessions, and scaffold projects from your terminal. Open source, MIT licensed.</p>
                <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>
                    3,241 stars
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
                    418 forks
                  </span>
                  <span style={{ fontSize:12, color:'var(--muted)' }}>TypeScript</span>
                  <span style={{ fontSize:12, color:'var(--muted)' }}>MIT License</span>
                  <span style={{ fontSize:12, color:'var(--muted)' }}>Last updated 3 days ago</span>
                </div>
              </div>
            </div>
            <a href="https://github.com/hyle-org/hyle-cli" target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:8, height:38, padding:'0 18px', background:'#0d1117', border:'1px solid #30363d', borderRadius:7, color:'#c9d1d9', fontSize:13, fontWeight:500, textDecoration:'none', flexShrink:0, transition:'border-color 0.15s, background 0.15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.background='#161b22'; e.currentTarget.style.borderColor='#8b949e'; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='#0d1117'; e.currentTarget.style.borderColor='#30363d'; }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="#c9d1d9"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Search Page ───────────────────────────────────────────────────────
function SearchPage({ navigate, initialQuery }) {
  const [query, setQuery] = useState(initialQuery || '');
  const [inputVal, setInputVal] = useState(initialQuery || '');
  const [sort, setSort] = useState('stars');
  const [filters, setFilters] = useState({ language: [], license: [] });

  useEffect(() => { setQuery(initialQuery || ''); setInputVal(initialQuery || ''); }, [initialQuery]);

  const languages = [...new Set(window.PRINTS.map(p => p.language))].sort();
  const licenses = [...new Set(window.PRINTS.map(p => p.license))].sort();

  const toggleFilter = (type, val) => {
    setFilters(f => ({
      ...f,
      [type]: f[type].includes(val) ? f[type].filter(v => v !== val) : [...f[type], val],
    }));
  };

  const results = window.PRINTS
    .filter(p => {
      if (filters.language.length && !filters.language.includes(p.language)) return false;
      if (filters.license.length && !filters.license.includes(p.license)) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return p.name.includes(q) || p.author.includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.includes(q)) || p.language.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'stars') return b.stars - a.stars;
      if (sort === 'recent') return new Date(b.updated) - new Date(a.updated);
      if (sort === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const handleSearch = (e) => { e.preventDefault(); setQuery(inputVal); };

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
        <div style={{ position: 'relative', maxWidth: 560 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
            <Icon name="search" size={15}/>
          </span>
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Search prints…"
            className="search-input"
          />
        </div>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40 }}>
        {/* Filters */}
        <div>
          <div className="filter-section">
            <div className="filter-heading">Language</div>
            {languages.map(l => (
              <label key={l} className="filter-item">
                <input type="checkbox" checked={filters.language.includes(l)} onChange={() => toggleFilter('language', l)}/>
                <span>{l}</span>
                <span className="filter-count">{window.PRINTS.filter(p => p.language === l).length}</span>
              </label>
            ))}
          </div>
          <div className="filter-section" style={{ marginTop: 24 }}>
            <div className="filter-heading">License</div>
            {licenses.map(l => (
              <label key={l} className="filter-item">
                <input type="checkbox" checked={filters.license.includes(l)} onChange={() => toggleFilter('license', l)}/>
                <span>{l}</span>
                <span className="filter-count">{window.PRINTS.filter(p => p.license === l).length}</span>
              </label>
            ))}
          </div>
          {(filters.language.length || filters.license.length) ? (
            <button className="link-btn" style={{ marginTop: 16, fontSize: 12 }} onClick={() => setFilters({ language: [], license: [] })}>
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Results */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
              {query ? <span> for <strong style={{ color: 'var(--text)' }}>"{query}"</strong></span> : ''}
            </span>
            <select value={sort} onChange={e => setSort(e.target.value)} className="sort-select">
              <option value="stars">Most starred</option>
              <option value="recent">Recently updated</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {results.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                No prints found. <button className="link-btn" onClick={() => { setQuery(''); setInputVal(''); setFilters({ language: [], license: [] }); }}>Clear search</button>
              </div>
            ) : results.map(p => (
              <div key={p.id} className="result-row" style={{ position:'relative' }} onClick={() => navigate(`/print/${p.id}`)}>
                {(p.verified || p.community) && (
                  <div style={{ position:'absolute', top:14, right:16 }}>
                    {p.verified && <VerifiedLabel/>}
                    {p.community && <CommunityLabel/>}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0, paddingRight: (p.verified || p.community) ? 80 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500, flexShrink: 0, display:'flex', alignItems:'center', gap:5 }}>
                      <span><span style={{ color: 'var(--muted)' }}>{p.author}/</span>{p.name}</span>
                      {p.verified && <VerifiedBadge/>}{p.community && <CommunityBadge/>}
                    </span>
                    <span style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {p.tags.slice(0, 3).map(t => <Tag key={t} label={t}/>)}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 8px', lineHeight: 1.5 }}>{p.description}</p>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <LangDot lang={p.language}/>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
                      <Icon name="star" size={12}/>{p.stars.toLocaleString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
                      <Icon name="fork" size={12}/>{p.forks}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{p.license}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Updated {p.updated}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail Page ───────────────────────────────────────────────────────
function DetailPage({ navigate, printId }) {
  const print = window.PRINTS.find(p => p.id === printId);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tab, setTab] = useState('readme');
  const [diffV1, setDiffV1] = useState(null);
  const [diffV2, setDiffV2] = useState(null);
  const [releasesOpen, setReleasesOpen] = useState(true);
  useEffect(() => {
    if (print) {
      setDiffV1(print.versions[print.versions.length - 1]?.tag);
      setDiffV2(print.versions[0]?.tag);
    }
  }, [printId]);

  if (!print) return (
    <div className="container" style={{ paddingTop: 64, textAlign: 'center', color: 'var(--muted)' }}>
      <p>Print not found.</p>
      <button className="link-btn" onClick={() => navigate('/search?q=')}>Browse all prints</button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="detail-header">
        <div className="container">
          <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--muted-light)' }}>
            <button className="link-btn-light" onClick={() => navigate('/')}>Home</button>
            <span style={{ margin: '0 6px' }}>/</span>
            <button className="link-btn-light" onClick={() => navigate('/search?q=')}>{print.author}</button>
            <span style={{ margin: '0 6px' }}>/</span>
            <span style={{ color: '#fff' }}>{print.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, color: '#fff', margin: '0 0 8px', display:'flex', alignItems:'center', gap:10 }}>
                <span><span style={{ opacity: 0.6 }}>{print.author}/</span>{print.name}</span>
                {print.verified && <VerifiedBadge/>}
                {print.community && <CommunityBadge/>}
              </h1>
              {(print.verified || print.community) && (
                <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                  {print.verified && <VerifiedLabel/>}
                  {print.community && <CommunityLabel/>}
                </div>
              )}
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 14px', maxWidth: 600 }}>{print.description}</p>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  <Icon name="star" size={13}/>{print.stars.toLocaleString()} stars
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  <Icon name="fork" size={13}/>{print.forks} forks
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{print.license}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{print.language}</span>
                {print.tags.map(t => <span key={t} className="tag tag-light">{t}</span>)}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pull this print</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>hyle pull {print.id}</code>
                  <CopyButton text={`hyle pull ${print.id}`} style={{ color: 'rgba(255,255,255,0.5)' }}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <div className="container">
          {[['readme','README'],['files','Files'],['versions',`Versions (${print.versions.length})`],['diff','Compare']].map(([id,label]) => (
            <button key={id} className={`detail-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {tab === 'files' && (
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 0, paddingTop: 0, paddingBottom: 0, minHeight: 'calc(100vh - 280px)' }}>
          <div style={{ borderRight: '1px solid var(--border)', paddingTop: 16, paddingBottom: 16 }}>
            <FileTree tree={print.tree} selectedFile={selectedFile} onSelect={setSelectedFile} printId={print.id}/>
          </div>
          <div style={{ minHeight: 500, borderRight: '1px solid var(--border)' }}>
            <FileViewer filePath={selectedFile}/>
          </div>
          <div style={{ padding: '20px 20px' }}>
            <QuickstartPanel printId={print.id} compact/>
            <div style={{ marginTop: 24 }}>
              <div className="qs-title" style={{ marginBottom: 10 }}>Latest version</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{print.versions[0]?.tag}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{print.versions[0]?.date}</div>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{print.versions[0]?.notes}</p>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button className="link-btn" style={{ fontSize: 12 }} onClick={() => setTab('versions')}>All releases →</button>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>·</span>
                <button className="link-btn" style={{ fontSize: 12 }} onClick={() => setTab('diff')}>Compare →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'versions' && (
        <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
          {/* Top bar: heading + view toggle + compare */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Releases</h3>
            {/* List / Grid toggle */}
            <div style={{ display: 'flex', gap: 1, background: 'var(--border)', borderRadius: 5, padding: 1, marginLeft: 4 }}>
              {[
                { mode: 'list', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="1" width="14" height="2" rx="1"/><rect x="0" y="6" width="14" height="2" rx="1"/><rect x="0" y="11" width="14" height="2" rx="1"/></svg> },
                { mode: 'grid', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="0" width="6" height="6" rx="1"/><rect x="8" y="0" width="6" height="6" rx="1"/><rect x="0" y="8" width="6" height="6" rx="1"/><rect x="8" y="8" width="6" height="6" rx="1"/></svg> },
              ].map(({ mode, icon }) => (
                <button key={mode} onClick={() => setReleasesOpen(mode === 'list')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 26, borderRadius: 4, border: 'none', cursor: 'pointer', background: releasesOpen === (mode === 'list') ? 'var(--surface)' : 'transparent', color: releasesOpen === (mode === 'list') ? 'var(--text)' : 'var(--muted)', transition: 'all 0.12s' }}>
                  {icon}
                </button>
              ))}
            </div>
            {/* Compare selectors — right side */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Compare</span>
              <select value={diffV1 || print.versions[print.versions.length-1]?.tag} onChange={e => setDiffV1(e.target.value)} className="sort-select" style={{ fontSize: 12 }}>
                {print.versions.map(v => <option key={v.tag} value={v.tag}>{v.tag}</option>)}
              </select>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>→</span>
              <select value={diffV2 || print.versions[0]?.tag} onChange={e => setDiffV2(e.target.value)} className="sort-select" style={{ fontSize: 12 }}>
                {print.versions.map(v => <option key={v.tag} value={v.tag}>{v.tag}</option>)}
              </select>
              <button className="btn-primary" style={{ height: 26, fontSize: 12, padding: '0 10px' }} onClick={() => setTab('diff')}>View diff</button>
            </div>
          </div>

          {/* List view */}
          {releasesOpen ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {print.versions.map((v, i) => (
                <div key={v.tag} className={`version-row ${i === 0 ? 'latest' : ''}`} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, width: 80 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>{v.tag}</div>
                    {i === 0 && <span className="badge-latest" style={{ marginTop: 4, display: 'inline-block' }}>latest</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 8px', lineHeight: 1.5 }}>{v.notes}</p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--subtle)', padding: '2px 8px', borderRadius: 4, color: 'var(--muted)' }}>
                        hyle pull {print.id}@{v.tag}
                      </code>
                      <CopyButton text={`hyle pull ${print.id}@${v.tag}`}/>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{v.date}</div>
                    <button className="link-btn" style={{ fontSize: 12 }} onClick={() => { setDiffV2(v.tag); setTab('diff'); }}>diff →</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Grid / badge view */
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {print.versions.map((v, i) => (
                <div key={v.tag} style={{ padding: '10px 16px', background: 'var(--surface)', border: `1px solid ${i === 0 ? 'rgba(196,152,42,0.4)' : 'var(--border)'}`, borderRadius: 8, minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>{v.tag}</span>
                    {i === 0 && <span className="badge-latest">latest</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{v.date}</div>
                  <button className="link-btn" style={{ fontSize: 11 }} onClick={() => { setDiffV2(v.tag); setTab('diff'); }}>diff →</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'diff' && (
        <div className="container diff-tab-wrap">
          <div className="version-select-bar">
            <span className="version-select-label">Compare</span>
            <select value={diffV1 || print.versions[print.versions.length-1]?.tag} onChange={e => setDiffV1(e.target.value)} className="sort-select">
              {print.versions.map(v => <option key={v.tag} value={v.tag}>{v.tag}</option>)}
            </select>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>→</span>
            <select value={diffV2 || print.versions[0]?.tag} onChange={e => setDiffV2(e.target.value)} className="sort-select">
              {print.versions.map(v => <option key={v.tag} value={v.tag}>{v.tag}</option>)}
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>Showing: identities/roles.yaml</span>
          </div>
          <DiffView
            left={window.DIFF_EXAMPLE.left}
            right={window.DIFF_EXAMPLE.right}
            leftLabel={`identities/roles.yaml @ ${diffV1 || print.versions[print.versions.length-1]?.tag}`}
            rightLabel={`identities/roles.yaml @ ${diffV2 || print.versions[0]?.tag}`}
          />
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
            Tip: select a file in the <button className="link-btn" style={{ fontSize: 12 }} onClick={() => setTab('files')}>Files</button> tab then use the version selectors in the sidebar to compare.
          </p>
        </div>
      )}

      {tab === 'readme' && (
        <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 780 }}>
          <div className="readme-body">
            <h1>{print.name}</h1>
            <p>{print.longDesc}</p>
            <h2>Folders</h2>
            <ul>
              <li><code>ontology/</code> — Source material and domain knowledge</li>
              <li><code>identities/</code> — Agent roles, hierarchy, and delegation</li>
              <li><code>craft/</code> — Code conventions, examples, and workflows</li>
              <li><code>ethics/</code> — Policies, constraints, and compliance rules</li>
            </ul>
            <h2>Usage</h2>
            <pre><code>{`hyle pull ${print.id}\ncd my-project\nhyle init ${print.id}\nhyle prompt "scaffold a new feature"`}</code></pre>
            <h2>License</h2>
            <p>Released under the {print.license} license.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Docs Page ─────────────────────────────────────────────────────────
const DOC_SECTIONS = [
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'installation', label: 'Installation' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'cli', label: 'CLI Reference' },
  { id: 'best-practices', label: 'Best Practices' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'philosophy', label: 'Philosophy' },
];

const CLI_GROUPS = [
  { label: 'Initialization', cmds: [['hyle init','Initialize a substrate interactively'],['hyle init <name>','Initialize from a named registry substrate'],['hyle init --yes','Initialize blank without prompts'],['hyle init --force','Re-initialize, overwriting existing substrate']] },
  { label: 'Work Sessions', cmds: [['hyle prompt "<text>"','Start a work session'],['hyle prompt "<text>" --scope <id>','With a named scope (data access perimeter)'],['hyle prompt "<text>" --agent <label>','With a declared agent identity'],['hyle prompt "<text>" --dry-run','Preview what the Epitomator would inject'],['hyle done','Close the active instance manually']] },
  { label: 'Substrate Lifecycle', cmds: [['hyle substrate list','List local substrate library'],['hyle substrate pull <name>','Clone from registry'],['hyle substrate commit <name>','Promote .hyle/ to local library'],['hyle substrate publish <name>','Publish local substrate to registry'],['hyle substrate tag <version>','Freeze weights + create reproducibility snapshot'],['hyle substrate diff <v1> <v2>','What changed between two tags'],['hyle substrate test','Run substrate.test.yml regression suite']] },
  { label: 'Index Management', cmds: [['hyle index update','Sync index from filesystem'],['hyle index verify','Check index vs filesystem consistency'],['hyle index rollback [timestamp]','Restore a prior index snapshot'],['hyle index approve <path>','Approve a quarantined document'],['hyle index lineage <path>','Show provenance chain of a synthesis']] },
  { label: 'Scopes', cmds: [['hyle scope list','List all scopes with document counts'],['hyle scope show <id>','Documents accessible in this scope'],['hyle scope add <id> <path>','Assign a document to a scope'],['hyle scope check <id>','Validate: no forbidden data_category leakage'],['hyle scope check <id> --strict','Exit non-zero on violation (CI/CD)']] },
  { label: 'Governance & Topology', cmds: [['hyle governance show','List all active ethics constraints'],['hyle governance check "<prompt>"','Detect conflicts before execution'],['hyle topology show','ASCII delegation graph'],['hyle topology check','Validate consistency + update topology_hash'],['hyle topology trace <agent> <doc>','Can this agent access this document?']] },
  { label: 'Audit & Status', cmds: [['hyle status','Overview: tokens + substrate + budget'],['hyle audit verify','Verify audit.log hash-chain integrity'],['hyle security log','Display security.log'],['hyle analyze','Quantitative + qualitative maintenance report']] },
];

function DocsPage({ navigate, anchor }) {
  const [active, setActive] = useState(anchor || 'quickstart');
  const contentRef = useRef();

  useEffect(() => { if (anchor) setActive(anchor); }, [anchor]);
  useEffect(() => { if (contentRef.current) contentRef.current.scrollTop = 0; }, [active]);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 52px)' }}>
      {/* Sidebar */}
      <div className="docs-sidebar">
        <div className="docs-sidebar-label">Documentation</div>
        {DOC_SECTIONS.map(s => (
          <button key={s.id} className={`docs-nav-item ${active === s.id ? 'active' : ''}`} onClick={() => setActive(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="docs-content" ref={contentRef}>
        {active === 'quickstart' && <DocsSection title="Quickstart">
          <p>Get up and running with Hylé in under 5 minutes.</p>
          <h3>1. Install Hylé <span style={{fontSize:11,fontFamily:'var(--mono)',fontWeight:400,color:'var(--muted)',background:'var(--subtle)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 7px',letterSpacing:'0.02em'}}>(macOS detected)</span></h3>
          <CodeBlock lang="bash">{`brew install hyle\n# or\nnpm install --global hyle`}</CodeBlock>
          <h3>2. Pull a substrate</h3>
          <CodeBlock lang="bash">{`cd my-project/\nhyle pull hyle-org/starter`}</CodeBlock>
          <h3>3. Start working</h3>
          <CodeBlock lang="bash">{`hyle prompt "generate a REST CRUD boilerplate"\nhyle done`}</CodeBlock>
          <Callout>Use <code>hyle prompt --dry-run</code> to preview what context the Epitomator will inject before running.</Callout>
        </DocsSection>}

        {active === 'installation' && <DocsSection title="Installation">
          <h3>Homebrew (macOS / Linux)</h3>
          <CodeBlock lang="bash">{`brew install hyle`}</CodeBlock>
          <h3>npm (global)</h3>
          <CodeBlock lang="bash">{`npm install --global hyle`}</CodeBlock>
          <h3>Verify</h3>
          <CodeBlock lang="bash">{`hyle --version\nhyle status`}</CodeBlock>
          <Callout>Hylé requires Node ≥ 20 or a compatible runtime. No other runtime dependencies.</Callout>
        </DocsSection>}

        {active === 'configuration' && <DocsSection title="Configuration">
          <p>All configuration lives in <code>.hyle/hyle.yaml</code> at the root of your project.</p>
          <CodeBlock lang="yaml">{`# .hyle/hyle.yaml\nsubstrate:\n  name: my-project\n  version: 1.0.0\n  registry: hyle-org/starter\n\nbudget:\n  max_tokens_per_session: 50000\n  warn_at: 80\n\nscopes:\n  - id: public\n    description: All non-sensitive documents\n  - id: internal\n    description: Internal specs only\n\ngovernance:\n  ethics_path: ethics/policies.yaml\n  strict: true`}</CodeBlock>
          <h3>Key fields</h3>
          <table className="docs-table">
            <thead><tr><th>Field</th><th>Description</th></tr></thead>
            <tbody>
              {[['substrate.name','Project identifier used in audit logs'],['budget.max_tokens_per_session','Hard cap on token usage per hyle prompt call'],['governance.strict','Exit non-zero on any ethics violation'],['scopes','Named data access perimeters for agents']].map(([f,d]) => (
                <tr key={f}><td><code>{f}</code></td><td>{d}</td></tr>
              ))}
            </tbody>
          </table>
        </DocsSection>}

        {active === 'cli' && <DocsSection title="CLI Reference">
          {CLI_GROUPS.map(g => (
            <div key={g.label} style={{ marginBottom: 32 }}>
              <h3>{g.label}</h3>
              <table className="docs-table">
                <thead><tr><th>Command</th><th>Description</th></tr></thead>
                <tbody>{g.cmds.map(([cmd, desc]) => (
                  <tr key={cmd}><td><code>{cmd}</code></td><td>{desc}</td></tr>
                ))}</tbody>
              </table>
            </div>
          ))}
        </DocsSection>}

        {active === 'best-practices' && <DocsSection title="Best Practices">
          <h3>Structure your ontology first</h3>
          <p>Before prompting agents, ensure <code>ontology/</code> contains high-weight anchor documents. The Epitomator weights documents during injection — sparse ontologies lead to unfocused output.</p>
          <h3>Use scopes for data isolation</h3>
          <CodeBlock lang="bash">{`hyle scope add internal ontology/specs/secret-api.md\nhyle prompt "generate client code" --scope public`}</CodeBlock>
          <h3>Run governance checks in CI</h3>
          <CodeBlock lang="bash">{`hyle scope check all --strict\nhyle topology check\nhyle substrate check-anchors --strict`}</CodeBlock>
          <h3>Tag before publishing</h3>
          <p>Always run <code>hyle substrate tag &lt;version&gt;</code> before publishing. Tags freeze model weights and create a reproducibility snapshot, allowing other users to replay prompts with identical conditions.</p>
          <Callout>Use <code>hyle substrate reproduce &lt;tag&gt; "your prompt"</code> to verify reproducibility before releasing a new version.</Callout>
        </DocsSection>}

        {active === 'publishing' && <DocsSection title="Publishing a Print">
          <p>Anyone can publish a print to the Hylé Prints registry. Prints are backed by public GitHub repositories.</p>
          <h3>1. Author your substrate</h3>
          <CodeBlock lang="bash">{`mkdir my-print && cd my-print\nhyle init --yes\n# populate ontology/, identities/, craft/, ethics/`}</CodeBlock>
          <h3>2. Test it</h3>
          <CodeBlock lang="bash">{`hyle substrate test\nhyle substrate check-anchors --strict\nhyle governance check "scaffold a feature"`}</CodeBlock>
          <h3>3. Tag and publish</h3>
          <CodeBlock lang="bash">{`hyle substrate tag 1.0.0\nhyle substrate publish myuser/my-print`}</CodeBlock>
          <h3>4. Push new versions</h3>
          <CodeBlock lang="bash">{`# after making changes:\nhyle substrate tag 1.1.0\nhyle substrate publish myuser/my-print`}</CodeBlock>
          <Callout>The registry links directly to the GitHub repository. Ensure your repo is public before publishing.</Callout>
        </DocsSection>}

        {active === 'philosophy' && <DocsSection title="Philosophy">
          <p>Hylé (from the Greek ὕλη, <em>matter</em> or <em>material</em>) is built on the idea that AI agents should work <em>within</em> structure, not instead of it.</p>
          <h3>Substrates over prompts</h3>
          <p>A one-off prompt is ephemeral. A substrate is persistent, versioned, and reviewable. Hylé treats the agent's working context as a first-class artifact — one that can be audited, diffed, and reproduced.</p>
          <h3>The four folders</h3>
          <p>Every print is structured around four orthogonal concerns: <strong>ontology</strong> (what the agent knows), <strong>identities</strong> (who the agent is), <strong>craft</strong> (how the agent works), and <strong>ethics</strong> (what the agent must never do). This separation makes prints composable and auditable.</p>
          <h3>Reproducibility</h3>
          <p>Model outputs are non-deterministic, but the <em>context</em> fed to the model need not be. Hylé's weight system and snapshot tags allow any prompt to be replayed under identical conditions, making AI-assisted development auditable in regulated environments.</p>
        </DocsSection>}
      </div>
    </div>
  );
}

function DocsSection({ title, children }) {
  return <div><h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>{title}</h1>{children}</div>;
}
function CodeBlock({ children, lang }) {
  const ref = useRef();
  useEffect(() => { if (ref.current && window.Prism) window.Prism.highlightElement(ref.current); }, [children]);
  return <pre className="docs-code"><code ref={ref} className={`language-${lang || 'bash'}`}>{children}</code></pre>;
}
function Callout({ children }) {
  return <div className="callout">{children}</div>;
}

// ── Auth shared styles ───────────────────────────────────────────────
const authFieldStyle = { width:'100%', height:40, padding:'0 12px', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:14, fontFamily:'var(--font)', outline:'none', background:'var(--surface)', color:'var(--text)', transition:'border-color 0.15s' };
const authLabelStyle = { display:'block', fontSize:13, fontWeight:500, color:'var(--muted-text)', marginBottom:6 };

// ── LoginPage ────────────────────────────────────────────────────────
function LoginPage({ navigate, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setTimeout(() => {
      // Mock: any login succeeds, username derived from email
      const username = email.split('@')[0].replace(/[^a-z0-9-]/gi, '-').toLowerCase();
      onLogin({ name: 'Andrej Kirskyn', username: 'andrej-kirskyn', email, avatar: null });
      setLoading(false);
      navigate('/');
    }, 800);
  };

  return (
    <div style={{ minHeight:'calc(100vh - 52px)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'40px 16px' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'var(--script)', fontSize:36, color:'var(--gold)', marginBottom:8 }}>Welcome back</div>
          <p style={{ fontSize:14, color:'var(--muted)' }}>Log in to your Hylé account</p>
        </div>
        <form onSubmit={submit} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:28 }}>
          {error && <div style={{ background:'#fff5f5', border:'1px solid #fca5a5', borderRadius:5, padding:'9px 12px', fontSize:13, color:'#c0392b', marginBottom:18 }}>{error}</div>}
          <div style={{ marginBottom:18 }}>
            <label style={authLabelStyle}>Email address</label>
            <input style={authFieldStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoFocus
              onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={authLabelStyle}>Password</label>
            <input style={authFieldStyle} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
              onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
          </div>
          <div style={{ textAlign:'right', marginBottom:22 }}>
            <button type="button" className="link-btn" onClick={() => navigate('/forgot-password')} style={{ fontSize:12 }}>Forgot password?</button>
          </div>
          <button type="submit" disabled={loading} style={{ width:'100%', height:40, background:'var(--gold)', color:'#0b1f12', fontWeight:600, fontSize:14, borderRadius:'var(--radius-sm)', border:'none', cursor:'pointer', opacity: loading?0.7:1, transition:'opacity 0.15s' }}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p style={{ textAlign:'center', fontSize:13, color:'var(--muted)', marginTop:20 }}>
          Don't have an account?{' '}
          <button className="link-btn" onClick={() => navigate('/register')}>Create one</button>
        </p>
      </div>
    </div>
  );
}

// ── RegisterPage ─────────────────────────────────────────────────────
function RegisterPage({ navigate, onLogin }) {
  const [form, setForm] = useState({ name:'', username:'', email:'', password:'', confirm:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.username || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setTimeout(() => {
      onLogin({ name: form.name, username: form.username, email: form.email, avatar: null });
      setLoading(false);
      navigate('/');
    }, 900);
  };

  const fields = [
    { key:'name', label:'Full name', type:'text', placeholder:'Andrej Kirskyn' },
    { key:'username', label:'Username', type:'text', placeholder:'andrej-kirskyn' },
    { key:'email', label:'Email address', type:'email', placeholder:'you@example.com' },
    { key:'password', label:'Password', type:'password', placeholder:'Min. 8 characters' },
    { key:'confirm', label:'Confirm password', type:'password', placeholder:'••••••••' },
  ];

  return (
    <div style={{ minHeight:'calc(100vh - 52px)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'40px 16px' }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'var(--script)', fontSize:36, color:'var(--gold)', marginBottom:8 }}>Create an account</div>
          <p style={{ fontSize:14, color:'var(--muted)' }}>Join the community, share your recipes and save your favourites.</p>
        </div>
        <form onSubmit={submit} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:28 }}>
          {error && <div style={{ background:'#fff5f5', border:'1px solid #fca5a5', borderRadius:5, padding:'9px 12px', fontSize:13, color:'#c0392b', marginBottom:18 }}>{error}</div>}
          {fields.map((f,i) => (
            <div key={f.key} style={{ marginBottom: i === fields.length-1 ? 22 : 16 }}>
              <label style={authLabelStyle}>{f.label}</label>
              <input style={authFieldStyle} type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                autoFocus={i===0}
                onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
            </div>
          ))}
          <button type="submit" disabled={loading} style={{ width:'100%', height:40, background:'var(--gold)', color:'#0b1f12', fontWeight:600, fontSize:14, borderRadius:'var(--radius-sm)', border:'none', cursor:'pointer', opacity:loading?0.7:1, transition:'opacity 0.15s' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p style={{ textAlign:'center', fontSize:13, color:'var(--muted)', marginTop:20 }}>
          Already have an account?{' '}
          <button className="link-btn" onClick={() => navigate('/login')}>Log in</button>
        </p>
      </div>
    </div>
  );
}

// ── ForgotPasswordPage ───────────────────────────────────────────────
function ForgotPasswordPage({ navigate }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => { setSent(true); setLoading(false); }, 700);
  };

  return (
    <div style={{ minHeight:'calc(100vh - 52px)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'40px 16px' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'var(--script)', fontSize:36, color:'var(--gold)', marginBottom:8 }}>Reset password</div>
          <p style={{ fontSize:14, color:'var(--muted)' }}>We'll send you a link to reset it</p>
        </div>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:28 }}>
          {sent ? (
            <div style={{ textAlign:'center', padding:'12px 0' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📬</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:8 }}>Check your inbox</div>
              <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>We sent a reset link to <strong>{email}</strong>. It expires in 30 minutes.</p>
              <button className="link-btn" onClick={() => navigate('/login')} style={{ marginTop:20, fontSize:13 }}>Back to login</button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div style={{ marginBottom:22 }}>
                <label style={authLabelStyle}>Email address</label>
                <input style={authFieldStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoFocus
                  onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
              </div>
              <button type="submit" disabled={loading} style={{ width:'100%', height:40, background:'var(--gold)', color:'#0b1f12', fontWeight:600, fontSize:14, borderRadius:'var(--radius-sm)', border:'none', cursor:'pointer', opacity:loading?0.7:1, transition:'opacity 0.15s' }}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
        {!sent && (
          <p style={{ textAlign:'center', fontSize:13, color:'var(--muted)', marginTop:20 }}>
            <button className="link-btn" onClick={() => navigate('/login')}>← Back to login</button>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Social link icons ────────────────────────────────────────────────
const SOCIAL_DEFS = [
  { key:'github',    label:'GitHub',    color:'#c9d1d9', bg:'rgba(36,41,46,0.55)', icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg> },
  { key:'linkedin',  label:'LinkedIn',  color:'#0077b5', bg:'rgba(0,119,181,0.4)', icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 01.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg> },
  { key:'x',         label:'X',         color:'#e7e7e7', bg:'rgba(20,20,20,0.65)',    icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/></svg> },
  { key:'mastodon',  label:'Mastodon',  color:'#a6a7ff', bg:'rgba(99,100,255,0.35)', icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.19 12.195c2.016-.24 3.77-1.475 3.99-2.603.348-1.778.32-4.339.32-4.339 0-3.47-2.286-4.488-2.286-4.488C11.89.786 9.976.55 8 .52c-1.974.03-3.885.266-5.214.845 0 0-2.285 1.017-2.285 4.488l-.002.662c-.004.64-.007 1.35.011 2.091.083 3.394.626 6.74 3.78 7.57 1.454.383 2.703.463 3.709.408 1.823-.1 2.847-.647 2.847-.647l-.06-1.317s-1.303.41-2.767.36c-1.45-.05-2.98-.156-3.215-1.928a3.614 3.614 0 01-.033-.496s1.424.346 3.228.428c1.103.05 2.137-.064 3.188-.189zm1.613-2.47H11.13v-4.08c0-.859-.364-1.295-1.091-1.295-.804 0-1.207.517-1.207 1.541v2.233H7.168V5.89c0-1.024-.403-1.541-1.207-1.541-.727 0-1.091.436-1.091 1.296v4.079H3.197V5.522c0-.859.22-1.541.66-2.046.456-.505 1.052-.764 1.793-.764.856 0 1.504.328 1.933.983l.417.695.417-.695c.429-.655 1.077-.983 1.934-.983.74 0 1.336.259 1.791.764.442.505.661 1.187.661 2.046v4.203z"/></svg> },
  { key:'bluesky',   label:'Bluesky',   color:'#6dc4ff', bg:'rgba(0,133,255,0.35)', icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8S4.41 14.5 8 14.5 14.5 11.59 14.5 8 11.59 1.5 8 1.5zm0 1.5a5 5 0 110 10A5 5 0 018 3zm-.5 2v3.29l-2.15 1.24.5.87L8 9.21l2.15 1.19.5-.87L8.5 8.29V5h-1z"/></svg> },
  { key:'instagram', label:'Instagram', color:'#f78fb3', bg:'rgba(225,48,108,0.35)', icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 00-1.417.923A3.927 3.927 0 00.42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 001.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 00-.923-1.417A3.911 3.911 0 0013.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 01-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 01-.92-.598 2.48 2.48 0 01-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 100 1.92.96.96 0 000-1.92zm-4.27 1.122a4.109 4.109 0 100 8.217 4.109 4.109 0 000-8.217zm0 1.441a2.667 2.667 0 110 5.334 2.667 2.667 0 010-5.334z"/></svg> },
  { key:'facebook',  label:'Facebook',  color:'#74a9f9', bg:'rgba(24,119,242,0.35)', icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/></svg> },
];

// ── ProfilePage ──────────────────────────────────────────────────────
const MOCK_STARRED = window.PRINTS ? window.PRINTS.slice(1, 4) : [];
const MOCK_ACTIVITY = [
  { type:'verified', print:'andrej-kirskyn/good-java', version:'1.3.1', date:'2026-04-25', note:'🎉 Congratulations! andrej-kirskyn/good-java @1.3.1 has been verified by the Hylé team.' },
  { type:'pull', print:'hyle-org/starter', version:'1.0.4', date:'2026-04-26', note:'Pulled to project findr-api' },
  { type:'push', print:'andrej-kirskyn/good-java', version:'1.3.1', date:'2026-04-22', note:'Released patch: dependency updates' },
  { type:'community', print:'andrej-kirskyn/good-java', version:'', date:'2026-03-20', note:'⭐ You reached 100+ pulls on andrej-kirskyn/good-java which has no community red flags, a 6+ months existence and more than 50 stars. It\'s now tagged as "Community" verified.' },
  { type:'pull', print:'justbob/python-sub', version:'2.1.0', date:'2026-04-19', note:'Pulled to project ml-pipeline' },
  { type:'push', print:'andrej-kirskyn/good-java', version:'1.3.0', date:'2026-04-10', note:'Added Spring Security identity patterns' },
  { type:'pull', print:'hyle-org/starter', version:'1.0.3', date:'2026-03-28', note:'Pulled to project data-service' },
  { type:'pull', print:'renaud-duteil/swisstools', version:'0.9.2', date:'2026-03-15', note:'Pulled to project cli-toolkit' },
  { type:'push', print:'andrej-kirskyn/good-java', version:'1.2.2', date:'2026-02-10', note:'Minor documentation fix' },
];

// Print card colors for public profile
const CARD_ACCENTS = [
  { bg:'linear-gradient(135deg,#0e2318 0%,#1a3a24 100%)', border:'rgba(196,152,42,0.25)', tag:'rgba(196,152,42,0.18)', tagText:'#e8c96a' },
  { bg:'linear-gradient(135deg,#0d1f35 0%,#1a3050 100%)', border:'rgba(96,165,250,0.25)', tag:'rgba(96,165,250,0.15)', tagText:'#93c5fd' },
  { bg:'linear-gradient(135deg,#1a1035 0%,#2d1f50 100%)', border:'rgba(167,139,250,0.25)', tag:'rgba(167,139,250,0.15)', tagText:'#c4b5fd' },
  { bg:'linear-gradient(135deg,#1e1a10 0%,#332d0e 100%)', border:'rgba(251,191,36,0.25)', tag:'rgba(251,191,36,0.15)', tagText:'#fde68a' },
];

function PublicPrintCard({ print, navigate, idx }) {
  const acc = CARD_ACCENTS[idx % CARD_ACCENTS.length];
  const totalStars = print.stars;
  const starsK = totalStars >= 1000 ? (totalStars/1000).toFixed(1).replace(/\.0$/,'') + 'k' : totalStars;
  return (
    <div onClick={() => navigate(`/print/${print.id}`)} style={{ background: acc.bg, border:`1px solid ${acc.border}`, borderRadius:10, padding:'20px 22px', cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s', position:'relative', overflow:'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,0.18)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
      {/* Star badge */}
      <div style={{ position:'absolute', top:16, right:16, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.08)', border:`1px solid ${acc.border}`, borderRadius:20, padding:'3px 10px' }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill={acc.tagText}><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>
          <span style={{ fontSize:12, fontWeight:600, color: acc.tagText }}>{starsK}</span>
        </div>
        {print.verified && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', background:'rgba(20,83,45,0.5)', border:'1px solid rgba(34,197,94,0.4)', borderRadius:20, color:'#86efac', letterSpacing:'0.05em' }}>Verified</span>}
        {print.community && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', background:'rgba(120,53,15,0.5)', border:'1px solid rgba(196,152,42,0.45)', borderRadius:20, color:'#fde68a', letterSpacing:'0.05em' }}>Community</span>}
      </div>
      <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.5)', marginBottom:4, display:'flex', alignItems:'center', gap:5 }}>{print.author}/ {print.verified && <VerifiedBadge/>}{print.community && <CommunityBadge/>}</div>
      <div style={{ fontFamily:'var(--mono)', fontSize:17, fontWeight:600, color:'#fff', marginBottom:10, letterSpacing:'-0.01em' }}>{print.name}</div>
      <p style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.55, margin:'0 0 14px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{print.description}</p>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {print.tags.slice(0,4).map(t => (
          <span key={t} style={{ fontSize:11, padding:'2px 8px', background: acc.tag, border:`1px solid ${acc.border}`, borderRadius:20, color: acc.tagText, fontFamily:'var(--mono)' }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ navigate, authUser, isPublic }) {
  const myPrints = (window.PRINTS || []).filter(p => p.author === authUser.username);
  const [tab, setTab] = useState('published');
  const [bio, setBio] = useState('Senior engineer. Loves clean code and well-structured AI workflows. Building the future of substrate-driven development.');
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(bio);
  const [socials, setSocials] = useState({ github:'andrej-kirskyn', linkedin:'andrej-kirskyn', x:'andrej_dev', mastodon:'', bluesky:'', instagram:'', facebook:'' });
  const [editingSocials, setEditingSocials] = useState(false);
  const [socialsDraft, setSocialsDraft] = useState(socials);
  const [copied, setCopied] = useState(false);

  const tabs = isPublic
    ? [{ id:'published', label:'Published' }]
    : [{ id:'published', label:'Published' }, { id:'starred', label:'Starred' }, { id:'activity', label:'Activity' }];

  const totalStars = myPrints.reduce((a,p)=>a+p.stars,0);
  const starsDisplay = totalStars >= 1000 ? (totalStars/1000).toFixed(1).replace(/\.0$/,'')+'k' : totalStars;

  const activityIcon = (type) => {
    if (type === 'push') return <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', background:'rgba(22,163,74,0.12)', color:'#16a34a', borderRadius:20, border:'1px solid rgba(22,163,74,0.2)', letterSpacing:'0.04em' }}>PUSH</span>;
    if (type === 'verified') return <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', background:'rgba(20,83,45,0.15)', color:'#166534', borderRadius:20, border:'1px solid rgba(34,197,94,0.35)', letterSpacing:'0.04em', display:'flex', alignItems:'center', gap:4 }}><svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7.5" fill="#166534"/><path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>VERIFIED</span>;
    if (type === 'community') return <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', background:'rgba(120,53,15,0.12)', color:'#92400e', borderRadius:20, border:'1px solid rgba(196,152,42,0.35)', letterSpacing:'0.04em', display:'flex', alignItems:'center', gap:4 }}><svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7.5" fill="#92400e"/><path d="M8 4l1.1 2.2 2.4.35-1.75 1.7.41 2.4L8 9.5l-2.16 1.15.41-2.4L4.5 6.55l2.4-.35L8 4z" fill="#fde68a"/></svg>COMMUNITY</span>;
    return <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', background:'rgba(196,152,42,0.12)', color:'var(--gold)', borderRadius:20, border:'1px solid rgba(196,152,42,0.25)', letterSpacing:'0.04em' }}>PULL</span>;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  const activeSocials = SOCIAL_DEFS.filter(s => socials[s.key]);

  return (
    <div style={{ minHeight:'calc(100vh - 52px)', background:'var(--bg)' }}>
      {/* Header */}
      <div style={{ background:'var(--nav-bg)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'32px 0 28px' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'flex-start', gap:20 }}>
            {/* Avatar */}
            <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#c4982a 0%,#5a7a3a 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontWeight:700, color:'#fff', flexShrink:0, border:'3px solid rgba(196,152,42,0.3)' }}>
              {authUser.name.charAt(0).toUpperCase()}
            </div>
            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff', letterSpacing:'-0.02em' }}>{authUser.name}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:2, fontFamily:'var(--mono)' }}>@{authUser.username}</div>
              {!isPublic && <div style={{ fontSize:12, color:'rgba(255,255,255,0.28)', marginTop:3 }}>{authUser.email}</div>}

              {/* Bio */}
              <div style={{ marginTop:12, maxWidth:560 }}>
                {editingBio && !isPublic ? (
                  <div>
                    <textarea value={bioDraft} onChange={e=>setBioDraft(e.target.value)}
                      style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'8px 10px', color:'rgba(255,255,255,0.8)', fontSize:13, lineHeight:1.6, resize:'vertical', minHeight:72, fontFamily:'var(--font)', outline:'none' }}
                      autoFocus/>
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <button onClick={()=>{ setBio(bioDraft); setEditingBio(false); }} style={{ padding:'4px 12px', background:'var(--gold)', color:'#0b1f12', borderRadius:4, fontSize:12, fontWeight:600, border:'none', cursor:'pointer' }}>Save</button>
                      <button onClick={()=>{ setBioDraft(bio); setEditingBio(false); }} style={{ padding:'4px 10px', background:'transparent', color:'rgba(255,255,255,0.4)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:4, fontSize:12, cursor:'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.65, margin:0 }}>{bio}</p>
                    {!isPublic && <button onClick={()=>setEditingBio(true)} style={{ flexShrink:0, fontSize:11, color:'rgba(255,255,255,0.3)', background:'none', border:'none', cursor:'pointer', marginTop:1, padding:'0 4px' }}>Edit</button>}
                  </div>
                )}
              </div>

              {/* Social links */}
              <div style={{ marginTop:12 }}>
                {editingSocials && !isPublic ? (
                  <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'14px 16px', maxWidth:460 }}>
                    <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.35)', marginBottom:12 }}>Social links</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px' }}>
                      {SOCIAL_DEFS.map(s => (
                        <div key={s.key} style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <span style={{ color:s.color, display:'flex', flexShrink:0 }}>{s.icon}</span>
                          <input value={socialsDraft[s.key]} onChange={e=>setSocialsDraft(d=>({...d,[s.key]:e.target.value}))}
                            placeholder={s.label} style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:4, padding:'4px 8px', color:'rgba(255,255,255,0.8)', fontSize:12, fontFamily:'var(--mono)', outline:'none', width:'100%' }}/>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:12 }}>
                      <button onClick={()=>{ setSocials(socialsDraft); setEditingSocials(false); }} style={{ padding:'4px 12px', background:'var(--gold)', color:'#0b1f12', borderRadius:4, fontSize:12, fontWeight:600, border:'none', cursor:'pointer' }}>Save</button>
                      <button onClick={()=>{ setSocialsDraft(socials); setEditingSocials(false); }} style={{ padding:'4px 10px', background:'transparent', color:'rgba(255,255,255,0.4)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:4, fontSize:12, cursor:'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    {activeSocials.map(s => (
                      <a key={s.key} href={`https://${s.key === 'x' ? 'x.com' : s.key === 'mastodon' ? 'mastodon.social/@' : s.key+'.com/'}${socials[s.key]}`}
                        target="_blank" rel="noreferrer"
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background: s.bg, border:`1px solid ${s.color}55`, borderRadius:20, color: s.color, fontSize:12, textDecoration:'none', transition:'filter 0.15s', fontWeight:500 }}
                        onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.15)'}
                        onMouseLeave={e=>e.currentTarget.style.filter=''}>
                        <span style={{ display:'flex' }}>{s.icon}</span>
                        {socials[s.key]}
                      </a>
                    ))}
                    {!isPublic && (
                      <button onClick={()=>setEditingSocials(true)} style={{ fontSize:11, color:'rgba(255,255,255,0.3)', background:'none', border:'1px dashed rgba(255,255,255,0.15)', borderRadius:20, padding:'3px 9px', cursor:'pointer' }}>
                        {activeSocials.length ? 'Edit links' : '+ Add social links'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right actions */}
            <div style={{ display:'flex', gap:8, flexShrink:0, marginTop:4 }}>
              {isPublic
                ? <button className="btn-secondary" onClick={() => navigate('/profile')} style={{ fontSize:12, height:32 }}>← Private view</button>
                : <button className="btn-secondary" onClick={() => navigate('/profile/public')} style={{ fontSize:12, height:32 }}>Public profile</button>
              }
            </div>
          </div>

          {/* Stats bar */}
          <div style={{ display:'flex', gap:0, marginTop:24, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, overflow:'hidden', alignSelf:'flex-start', width:'fit-content' }}>
            {[
              { label:'Prints', value: myPrints.length, icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="rgba(255,255,255,0.5)"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0113.25 16h-9.5A1.75 1.75 0 012 14.25zm1.75-.25a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 00.25-.25V6h-2.75A1.75 1.75 0 019 4.25V1.5zm6.75.062V4.25c0 .138.112.25.25.25h2.688z"/></svg> },
              { label:'Stars', value: starsDisplay, icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="rgba(255,255,255,0.5)"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg> },
              { label:'Starred', value: MOCK_STARRED.length, icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="rgba(255,100,100,0.7)"><path d="M8 13.7l-1.1-1C2.9 8.9 0 6.3 0 3.1 0 1.4 1.4 0 3.1 0c1 0 2 .5 2.6 1.2L8 3.7l2.3-2.5C10.9.5 11.9 0 12.9 0 14.6 0 16 1.4 16 3.1c0 3.2-2.9 5.8-6.9 9.6L8 13.7z"/></svg> },
            ].map((s,i) => (
              <div key={s.label} style={{ padding:'10px 24px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none', textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--gold-light)', letterSpacing:'-0.02em', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:3, letterSpacing:'0.04em', textTransform:'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs — private only */}
      {!isPublic && (
        <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)' }}>
          <div className="container" style={{ display:'flex', padding:0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`detail-tab ${tab===t.id?'active':''}`}>{t.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="container" style={{ paddingTop:32, paddingBottom:64 }}>
        {isPublic && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em', margin:0 }}>Published prints</h2>
            <button onClick={handleShare} style={{ display:'flex', alignItems:'center', gap:6, height:32, padding:'0 14px', background: copied ? 'rgba(22,163,74,0.08)' : 'var(--subtle)', border: copied ? '1px solid rgba(22,163,74,0.3)' : '1px solid var(--border)', borderRadius:6, color: copied ? '#16a34a' : 'var(--muted-text)', fontSize:13, cursor:'pointer', transition:'all 0.15s' }}>
              {copied
                ? <><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg> Copied!</>
                : <><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M7.776 4.553l1.552-1.552a3.5 3.5 0 114.95 4.95l-1.552 1.552a.75.75 0 01-1.06-1.06l1.552-1.553a2 2 0 00-2.828-2.828L8.837 5.613a.75.75 0 01-1.06-1.06zM6.5 7.25a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0v-4a.75.75 0 01.75-.75zm-.837 1.553L4.11 10.355a2 2 0 002.829 2.828l1.552-1.552a.75.75 0 011.06 1.061l-1.552 1.552a3.5 3.5 0 11-4.95-4.95l1.553-1.553a.75.75 0 011.06 1.061z"/></svg> Share profile</>
              }
            </button>
          </div>
        )}
        {tab === 'published' && (
          myPrints.length === 0
            ? <p style={{ fontSize:14, color:'var(--muted)', textAlign:'center', marginTop:48 }}>No published prints yet.</p>
            : isPublic
              ? <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
                  {myPrints.map((p,i) => <PublicPrintCard key={p.id} print={p} navigate={navigate} idx={i}/>)}
                </div>
              : <div style={{ maxWidth:800 }}>
                  {myPrints.map(p => (
                    <div key={p.id} className="result-row" style={{ position:'relative' }} onClick={() => navigate(`/print/${p.id}`)}>
                      {(p.verified || p.community) && <div style={{ position:'absolute', top:12, right:14 }}>{p.verified && <VerifiedLabel/>}{p.community && <CommunityLabel/>}</div>}
                      <div style={{ flex:1, minWidth:0, paddingRight:(p.verified||p.community)?80:0 }}>
                        <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:500, marginBottom:4, display:'flex', alignItems:'center', gap:5 }}>
                          <span><span style={{ color:'var(--muted)' }}>{p.author}/</span>{p.name}</span>
                          {p.verified && <VerifiedBadge/>}{p.community && <CommunityBadge/>}
                        </div>
                        <p style={{ fontSize:13, color:'var(--muted)', margin:'0 0 10px', lineHeight:1.5 }}>{p.description}</p>
                        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                          <LangDot lang={p.language}/>
                          <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted)' }}><Icon name="star" size={12}/>{p.stars.toLocaleString()}</span>
                          <span style={{ fontSize:12, color:'var(--muted)' }}>Updated {p.updated}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
        )}

        {tab === 'starred' && (
          <div style={{ maxWidth:800 }}>
            {MOCK_STARRED.map(p => (
              <div key={p.id} className="result-row" style={{ position:'relative' }} onClick={() => navigate(`/print/${p.id}`)}>
                {(p.verified || p.community) && <div style={{ position:'absolute', top:12, right:14 }}>{p.verified && <VerifiedLabel/>}{p.community && <CommunityLabel/>}</div>}
                <div style={{ flex:1, minWidth:0, paddingRight:(p.verified||p.community)?80:0 }}>
                  <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:500, marginBottom:4, display:'flex', alignItems:'center', gap:5 }}>
                    <span><span style={{ color:'var(--muted)' }}>{p.author}/</span>{p.name}</span>
                    {p.verified && <VerifiedBadge/>}{p.community && <CommunityBadge/>}
                  </div>
                  <p style={{ fontSize:13, color:'var(--muted)', margin:'0 0 10px', lineHeight:1.5 }}>{p.description}</p>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <LangDot lang={p.language}/>
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted)' }}><Icon name="star" size={12}/>{p.stars.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'activity' && (
          <div style={{ maxWidth:800 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, padding:'9px 14px', background:'rgba(196,152,42,0.06)', border:'1px solid rgba(196,152,42,0.2)', borderRadius:'var(--radius)', fontSize:12, color:'var(--muted-text)' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--gold)"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 9H7V4h2v5zm0 3H7v-2h2v2z"/></svg>
              This activity log is private and only visible to you.
            </div>
            {MOCK_ACTIVITY.map((a, i) => {
              const isSpecial = a.type === 'verified' || a.type === 'community';
              const specialBg = a.type === 'verified' ? 'rgba(20,83,45,0.06)' : 'rgba(120,53,15,0.06)';
              const specialBorder = a.type === 'verified' ? 'rgba(34,197,94,0.2)' : 'rgba(196,152,42,0.2)';
              return (
                <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start', padding:'13px 12px', borderBottom:'1px solid var(--border)', borderRadius: isSpecial ? 6 : 0, background: isSpecial ? specialBg : 'transparent', border: isSpecial ? `1px solid ${specialBorder}` : undefined, marginBottom: isSpecial ? 4 : 0 }}>
                  <div style={{ marginTop:1 }}>{activityIcon(a.type)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color: isSpecial ? 'var(--text)' : 'var(--muted)', lineHeight:1.6 }}>
                      {isSpecial ? a.note : (
                        <>
                          <button className="link-btn" onClick={() => navigate(`/print/${a.print}`)} style={{ fontFamily:'var(--mono)', fontSize:13 }}>{a.print}</button>
                          {a.version && <>{' '}<span style={{ color:'var(--muted)', fontSize:12, fontFamily:'var(--mono)' }}>@{a.version}</span></>}
                          {' — '}{a.note}
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted)', whiteSpace:'nowrap' }}>{a.date}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Landing, SearchPage, DetailPage, DocsPage, LoginPage, RegisterPage, ForgotPasswordPage, ProfilePage });
