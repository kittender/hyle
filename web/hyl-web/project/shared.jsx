// shared.jsx — Nav, PrintCard, FileViewer, QuickstartPanel

const { useState, useEffect, useRef } = React;

// ── Icons (inline SVG) ──────────────────────────────────────────────
function Icon({ name, size = 16, style = {} }) {
  const icons = {
    star: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>,
    fork: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3" strokeLinecap="round"/></svg>,
    copy: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25z"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>,
    file: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0113.25 16h-9.5A1.75 1.75 0 012 14.25zm1.75-.25a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 00.25-.25V6h-2.75A1.75 1.75 0 019 4.25V1.5zm6.75.062V4.25c0 .138.112.25.25.25h2.688z"/></svg>,
    folder: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5a.25.25 0 01-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1z"/></svg>,
    folderOpen: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M.513 1.513A1.75 1.75 0 011.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 00.2.1H13a1.75 1.75 0 011.75 1.75v.5H.75v-.5A1.75 1.75 0 011.75 3zM0 7.25C0 6.284.784 5.5 1.75 5.5h12.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0114.25 14.5H1.75A1.75 1.75 0 010 12.75z"/></svg>,
    chevronRight: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"/></svg>,
    chevronDown: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M12.78 6.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 011.06-1.06L8 9.94l3.72-3.72a.75.75 0 011.06 0z"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/></svg>,
    book: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75A.75.75 0 01.75 1h4.253c1.227 0 2.317.59 3 1.501A3.744 3.744 0 0111.006 1h4.245a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-4.507a2.25 2.25 0 00-1.591.659l-.622.621a.75.75 0 01-1.06 0l-.622-.621A2.25 2.25 0 005.258 13H.75a.75.75 0 01-.75-.75zm7.251 10.324l.004-5.073-.002-2.253A2.25 2.25 0 005.003 2.5H1.5v9h3.757a3.75 3.75 0 011.994.574zM8.755 4.75l-.004 7.322a3.752 3.752 0 011.992-.572H14.5v-9h-3.495a2.25 2.25 0 00-2.25 2.25z"/></svg>,
    tag: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 7.775V2.75a.25.25 0 01.25-.25h5.025a.25.25 0 01.177.073l6.25 6.25a.25.25 0 010 .354l-5.025 5.025a.25.25 0 01-.354 0l-6.25-6.25a.25.25 0 01-.073-.177zm-1.5 0V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 010 2.474l-5.026 5.026a1.75 1.75 0 01-2.474 0l-6.25-6.25A1.75 1.75 0 011 7.775zM6 5a1 1 0 100 2 1 1 0 000-2z"/></svg>,
    external: <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M3.75 2h3.5a.75.75 0 010 1.5h-3.5a.25.25 0 00-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25v-3.5a.75.75 0 011.5 0v3.5A1.75 1.75 0 0112.25 14h-8.5A1.75 1.75 0 012 12.25v-8.5C2 2.784 2.784 2 3.75 2zm6.854-1h4.146a.25.25 0 01.25.25v4.146a.25.25 0 01-.427.177L13.03 4.03 9.28 7.78a.75.75 0 01-1.06-1.06l3.75-3.75-1.543-1.543A.25.25 0 0110.604 1z"/></svg>,
    logo: <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#0a0a0a"/><path d="M10 22V14l6-4 6 4v8l-6 3-6-3z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/><path d="M16 10v12M10 14l6 4 6-4" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  };
  return <span style={{ display: 'inline-flex', alignItems: 'center', ...style }}>{icons[name] || null}</span>;
}

// ── Copy button ──────────────────────────────────────────────────────
function CopyButton({ text, style = {} }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className="copy-btn" style={style}>
      {copied ? <Icon name="check" size={13}/> : <Icon name="copy" size={13}/>}
    </button>
  );
}

// ── Tag ──────────────────────────────────────────────────────────────
function Tag({ label }) {
  return <span className="tag">{label}</span>;
}

// ── Language dot ─────────────────────────────────────────────────────
function LangDot({ lang }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
    <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--text)', display: 'inline-block', opacity: 0.7 }}/>
    {lang}
  </span>;
}

// ── Verified / Community badges ──────────────────────────────────────
// Icon-only version (next to print name)
function VerifiedBadge() {
  return (
    <span title="Verified print" style={{ display:'inline-flex', alignItems:'center', flexShrink:0 }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7.5" fill="#166534"/>
        <path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

function CommunityBadge() {
  return (
    <span title="Community favourite" style={{ display:'inline-flex', alignItems:'center', flexShrink:0 }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7.5" fill="#92400e"/>
        <path d="M8 4l1.1 2.2 2.4.35-1.75 1.7.41 2.4L8 9.5l-2.16 1.15.41-2.4L4.5 6.55l2.4-.35L8 4z" fill="#fde68a"/>
      </svg>
    </span>
  );
}

// Corner label version (top-right of card)
function VerifiedLabel() {
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', background:'rgba(20,83,45,0.12)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:20, color:'#166534', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>Verified</span>
  );
}

function CommunityLabel() {
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', background:'rgba(120,53,15,0.10)', border:'1px solid rgba(196,152,42,0.35)', borderRadius:20, color:'#92400e', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>Community</span>
  );
}

// ── PrintCard ────────────────────────────────────────────────────────
function PrintCard({ print, navigate, compact = false }) {
  const pad = compact ? '14px 16px' : '18px 20px';
  return (
    <div className="print-card" style={{ padding: pad, position:'relative' }} onClick={() => navigate(`/print/${print.id}`)}>
      {/* Corner label */}
      {(print.verified || print.community) && (
        <div style={{ position:'absolute', top: compact ? 10 : 14, right: compact ? 12 : 16 }}>
          {print.verified && <VerifiedLabel/>}
          {print.community && <CommunityLabel/>}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: (print.verified || print.community) ? 72 : 0 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4, display:'flex', alignItems:'center', gap:5, overflow:'hidden' }}>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}><span style={{ color: 'var(--muted)' }}>{print.author}/</span>{print.name}</span>
            {print.verified && <VerifiedBadge/>}
            {print.community && <CommunityBadge/>}
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {print.description}
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <LangDot lang={print.language}/>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
              <Icon name="star" size={12}/>{print.stars.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{print.license}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────
function Nav({ navigate, currentPath, searchQuery, setSearchQuery, authUser, onLogout }) {
  const [query, setQuery] = useState(searchQuery || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef();
  const menuRef = useRef();

  useEffect(() => { setQuery(searchQuery || ''); }, [searchQuery]);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const isActive = (p) => currentPath === p || currentPath.startsWith(p + '/');

  return (
    <nav className="nav">
      <div className="nav-inner">
        <button className="nav-logo" onClick={() => navigate('/')}>
          <img src="uploads/golden-lotus-icon.png" alt="Hylé" style={{ height: 32, width: 32, objectFit: 'contain' }}/>
          <span>Hylé</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, marginLeft: 24 }}>
          <button className={`nav-link ${isActive('/search') || currentPath === '/' ? 'active' : ''}`} onClick={() => navigate('/search?q=')}>Browse</button>
          <button className={`nav-link ${isActive('/docs') ? 'active' : ''}`} onClick={() => navigate('/docs')}>Docs</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
                <Icon name="search" size={14}/>
              </span>
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search prints…" className="nav-search"/>
            </div>
          </form>

          {authUser ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 8px 3px 4px', borderRadius: 6, background: menuOpen ? 'rgba(255,255,255,0.08)' : 'transparent', border: '1px solid transparent', transition: 'background 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background='transparent'; }}
              >
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#c4982a,#5a7a3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {authUser.name.charAt(0).toUpperCase()}
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{authUser.username}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="rgba(255,255,255,0.4)"><path d="M2 3.5l3 3 3-3"/></svg>
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#fff', border: '1px solid var(--border)', borderRadius: 8, width: 190, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{authUser.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{authUser.email}</div>
                  </div>
                  {[
                    { label: 'My profile', action: () => { navigate('/profile'); setMenuOpen(false); } },
                    { label: 'Public profile', action: () => { navigate('/profile/public'); setMenuOpen(false); } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action} style={{ display: 'block', width: '100%', padding: '8px 14px', fontSize: 13, color: 'var(--text)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--hover)'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}>
                      {item.label}
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)', padding: '4px 0' }}>
                    <button onClick={() => { onLogout(); setMenuOpen(false); }} style={{ display: 'block', width: '100%', padding: '8px 14px', fontSize: 13, color: '#c0392b', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fff5f5'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="link-btn-light" onClick={() => navigate('/login')}>Log in</button>
              <button className="btn-primary" onClick={() => navigate('/register')}>Register</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── File Tree ─────────────────────────────────────────────────────────
function FileTree({ tree, selectedFile, onSelect, printId }) {
  const [open, setOpen] = useState({ ontology: true, identities: false, craft: false, ethics: false });

  function TreeNode({ name, node, path }) {
    const isDir = node !== null && typeof node === 'object';
    const isOpen = open[path] !== false;
    const isSelected = selectedFile === path;

    if (!isDir) {
      return (
        <button
          className={`tree-file ${isSelected ? 'active' : ''}`}
          onClick={() => onSelect(path)}
        >
          <Icon name="file" size={12} style={{ color: 'var(--muted)', flexShrink: 0 }}/>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </button>
      );
    }

    const isRoot = ['ontology','identities','craft','ethics'].includes(name);
    const folderColors = { ontology: '#8b6914', identities: '#1a4d2e', craft: '#5a7a3a', ethics: '#c4982a' };

    return (
      <div>
        <button
          className="tree-folder"
          onClick={() => setOpen(o => ({ ...o, [path]: !isOpen }))}
        >
          <span style={{ color: isRoot ? folderColors[name] : 'var(--muted)', display: 'flex' }}>
            {isOpen ? <Icon name="folderOpen" size={13}/> : <Icon name="folder" size={13}/>}
          </span>
          <span style={{ fontWeight: isRoot ? 500 : 400, color: isRoot ? 'var(--text)' : 'var(--muted-text)' }}>{name}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--muted)', opacity: 0.6, display: 'flex' }}>
            {isOpen ? <Icon name="chevronDown" size={11}/> : <Icon name="chevronRight" size={11}/>}
          </span>
        </button>
        {isOpen && (
          <div style={{ marginLeft: 12, borderLeft: '1px solid var(--border)' }}>
            {Object.entries(node).map(([k, v]) => (
              <TreeNode key={k} name={k} node={v} path={path ? `${path}/${k}` : k}/>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="file-tree">
      {Object.entries(tree).map(([k, v]) => (
        <TreeNode key={k} name={k} node={v} path={k}/>
      ))}
    </div>
  );
}

// ── File Viewer ──────────────────────────────────────────────────────
function FileViewer({ filePath }) {
  const codeRef = useRef();

  useEffect(() => {
    if (codeRef.current && window.Prism) {
      window.Prism.highlightElement(codeRef.current);
    }
  }, [filePath]);

  if (!filePath) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', fontSize: 13 }}>
      Select a file to view its contents
    </div>
  );

  const content = window.getFileContent ? window.getFileContent(filePath) : '';
  const lang = window.getLang ? window.getLang(filePath) : 'plain';
  const lines = content.split('\n');

  return (
    <div className="file-viewer">
      <div className="file-viewer-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
          {filePath.split('/').map((part, i, arr) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <span style={{ opacity: 0.4 }}>/</span>}
              <span style={{ color: i === arr.length - 1 ? 'var(--text)' : 'var(--muted)', fontFamily: 'var(--mono)' }}>{part}</span>
            </span>
          ))}
        </span>
        <CopyButton text={content}/>
      </div>
      <div className="code-wrap">
        <div className="line-numbers" aria-hidden>
          {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <pre className="code-content"><code ref={codeRef} className={`language-${lang}`}>{content}</code></pre>
      </div>
    </div>
  );
}

// ── Quickstart Panel ─────────────────────────────────────────────────
function QuickstartPanel({ printId, compact = false }) {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const copy = (text, i) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1600);
  };
  const cmds = printId ? [
    { label: 'Pull this print', cmd: `hyle pull ${printId}` },
    { label: 'Start a session', cmd: `hyle prompt "scaffold a new feature"` },
  ] : [
    { label: 'Install (macOS detected)', cmd: 'brew install hyle' },
    { label: 'Or via npm', cmd: 'npm install --global hyle' },
    { label: 'Pull a print', cmd: 'hyle pull hyle-org/starter' },
    { label: 'Start working', cmd: 'hyle prompt "generate a REST API"' },
  ];
  return (
    <div className={`quickstart-panel ${compact ? 'compact' : ''}`}>
      <div className="qs-title">{printId ? 'Get started' : 'Quickstart'}</div>
      {cmds.map((c, i) => (
        <div key={i} className="qs-cmd">
          <span className="qs-label">{c.label}</span>
          <div className="qs-row">
            <code className="qs-code">{c.cmd}</code>
            <button className="copy-btn" onClick={() => copy(c.cmd, i)}>
              {copiedIdx === i ? <Icon name="check" size={12}/> : <Icon name="copy" size={12}/>}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Version Diff ─────────────────────────────────────────────────────
function DiffView({ left, right, leftLabel, rightLabel }) {
  const leftLines = (left || '').split('\n');
  const rightLines = (right || '').split('\n');
  const maxLen = Math.max(leftLines.length, rightLines.length);

  const classifyLine = (l, r) => {
    if (l === r) return 'same';
    if (!l) return 'added';
    if (!r) return 'removed';
    return 'changed';
  };

  return (
    <div className="diff-view">
      <div className="diff-header">
        <div className="diff-label removed-label">{leftLabel}</div>
        <div className="diff-label added-label">{rightLabel}</div>
      </div>
      <div className="diff-body">
        <div className="diff-side">
          {Array.from({ length: maxLen }).map((_, i) => {
            const cls = classifyLine(leftLines[i], rightLines[i]);
            return <div key={i} className={`diff-line diff-${cls === 'added' ? 'empty' : cls}`}>
              <span className="diff-ln">{leftLines[i] !== undefined ? i+1 : ''}</span>
              <span>{leftLines[i] || ''}</span>
            </div>;
          })}
        </div>
        <div className="diff-side">
          {Array.from({ length: maxLen }).map((_, i) => {
            const cls = classifyLine(leftLines[i], rightLines[i]);
            return <div key={i} className={`diff-line diff-${cls === 'removed' ? 'empty' : cls}`}>
              <span className="diff-ln">{rightLines[i] !== undefined ? i+1 : ''}</span>
              <span>{rightLines[i] || ''}</span>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Icon, Tag, LangDot, PrintCard, VerifiedBadge, CommunityBadge, VerifiedLabel, CommunityLabel, Nav, FileTree, FileViewer, QuickstartPanel, DiffView, CopyButton });
