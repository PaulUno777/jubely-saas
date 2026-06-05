/* eslint-disable */
// Shared chart primitives, sparklines, donut, bar charts, etc.

const Sparkline = ({ points, color = '#1FA971', width = 90, height = 28, fill = true }) => {
  // points: array of numeric values
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const path = points.map((v, i) => {
    const x = i * stepX;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const areaPath = path + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {fill && <path d={areaPath} fill={color} opacity="0.10" />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const BarChart = ({ data, height = 200 }) => {
  // data: [{ label, a, b }]
  const max = Math.max(...data.flatMap(d => [d.a, d.b])) * 1.1;
  const cols = data.length;
  const totalWidth = 100;
  const colW = totalWidth / cols;
  return (
    <div style={{ position: 'relative', height, paddingLeft: 36 }}>
      {/* Y axis */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 24, width: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', textAlign: 'right' }}>
        <span>{Math.round(max/1000)}k</span>
        <span>{Math.round((max*0.75)/1000)}k</span>
        <span>{Math.round((max*0.5)/1000)}k</span>
        <span>{Math.round((max*0.25)/1000)}k</span>
        <span>0</span>
      </div>
      {/* grid */}
      <svg width="100%" height={height - 24} style={{ position: 'absolute', left: 36, top: 0, right: 0, overflow: 'visible' }} preserveAspectRatio="none" viewBox={`0 0 ${totalWidth} 100`}>
        {[0,25,50,75,100].map(y => (
          <line key={y} x1="0" x2={totalWidth} y1={y} y2={y} stroke="rgba(33,28,20,0.06)" strokeWidth="0.2" />
        ))}
        {data.map((d, i) => {
          const x = i * colW + colW * 0.18;
          const w = colW * 0.28;
          const aH = (d.a / max) * 100;
          const bH = (d.b / max) * 100;
          return (
            <g key={i}>
              <rect x={x} y={100 - aH} width={w} height={aH} rx="0.6" fill="#1FA971"/>
              <rect x={x + w + colW*0.06} y={100 - bH} width={w} height={bH} rx="0.6" fill="#C89B3C"/>
            </g>
          );
        })}
      </svg>
      {/* X labels */}
      <div style={{ position: 'absolute', left: 36, right: 0, bottom: 0, height: 22, display: 'flex' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--muted)' }}>{d.label}</div>
        ))}
      </div>
    </div>
  );
};

const Donut = ({ data, size = 144, thickness = 22, centerLabel, centerSub }) => {
  // data: [{ label, value, color }]
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const cx = size/2, cy = size/2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--n1)" strokeWidth={thickness}/>
      {data.map((d, i) => {
        const frac = d.value / total;
        const len = frac * circ;
        const dasharray = `${len} ${circ - len}`;
        const dashoffset = -offset;
        offset += len;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={d.color} strokeWidth={thickness}
            strokeDasharray={dasharray} strokeDashoffset={dashoffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500" fontSize="22" fill="#211C14">{centerLabel}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10.5" fill="#6B6155" letterSpacing="1.2">{centerSub}</text>
    </svg>
  );
};

const LineChart = ({ series, height = 220, labels }) => {
  // series: [{ label, color, data: [] }]
  const all = series.flatMap(s => s.data);
  const max = Math.max(...all) * 1.1;
  const min = 0;
  const w = 100, h = 100;
  const stepX = w / (labels.length - 1);
  return (
    <div style={{ position: 'relative', height, paddingLeft: 36, paddingBottom: 22 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 22, width: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', textAlign: 'right' }}>
        <span>{Math.round(max)}</span>
        <span>{Math.round(max*0.66)}</span>
        <span>{Math.round(max*0.33)}</span>
        <span>0</span>
      </div>
      <svg width="100%" height={height - 22} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        {[0, 33, 66, 100].map(y => (
          <line key={y} x1="0" x2={w} y1={y} y2={y} stroke="rgba(33,28,20,0.06)" strokeWidth="0.2"/>
        ))}
        {series.map((s, idx) => {
          const path = s.data.map((v, i) => {
            const x = i * stepX;
            const y = h - ((v - min) / (max - min)) * h;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
          }).join(' ');
          return (
            <g key={idx}>
              <path d={path + ` L ${w} ${h} L 0 ${h} Z`} fill={s.color} opacity="0.06"/>
              <path d={path} fill="none" stroke={s.color} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 1.8 }}/>
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', left: 36, right: 0, bottom: 0, height: 18, display: 'flex' }}>
        {labels.map((l, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10.5, color: 'var(--muted)' }}>{l}</div>
        ))}
      </div>
    </div>
  );
};

const Switch = ({ on, onChange, disabled }) => (
  <div className="switch" data-on={on ? 'true' : 'false'}
    onClick={() => !disabled && onChange && onChange(!on)}
    style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}/>
);

const Pill = ({ kind = 'neutral', dot = false, children }) => (
  <span className={`pill pill-${kind} ${dot ? 'pill-dot' : ''}`}>{children}</span>
);

const TierBadge = ({ tier }) => {
  const tiers = {
    bronze: { cls: 'tier-bronze', name: 'Bronze' },
    argent: { cls: 'tier-silver', name: 'Argent' },
    silver: { cls: 'tier-silver', name: 'Argent' },
    or: { cls: 'tier-or', name: 'Or' },
    platine: { cls: 'tier-plat', name: 'Platine' },
  };
  const t = tiers[tier] || { cls: 'tier-bronze', name: tier || '—' };
  return <span style={{ fontSize: 12, color: 'var(--body)' }}><span className={`tier-dot ${t.cls}`}/>{t.name}</span>;
};

const QRGrid = ({ pattern }) => {
  // pattern: array of 121 (11x11) booleans (true = filled)
  return (
    <div className="qr-grid">
      {pattern.map((on, i) => <i key={i} className={on ? '' : 'b'}/>)}
    </div>
  );
};

// Generate a deterministic QR-ish pattern with corner finders
const makeQRPattern = (seed = 1) => {
  const grid = Array(121).fill(false);
  // Corner finders (top-left, top-right, bottom-left)
  const draw = (cx, cy) => {
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        const idx = (cy + dy) * 11 + (cx + dx);
        if (dy === 0 || dy === 2 || dx === 0 || dx === 2) grid[idx] = true;
        if (dy === 1 && dx === 1) grid[idx] = false;
        if (dx === 1 && dy === 1) grid[idx] = false;
      }
    }
    // center fill
    grid[(cy+1) * 11 + (cx+1)] = false;
  };
  // simple finders
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
    if (y === 0 || y === 2 || x === 0 || x === 2) {
      grid[y*11+x] = true;
      grid[y*11+(x+8)] = true;
      grid[(y+8)*11+x] = true;
    }
  }
  // pseudo-random data area
  let s = seed;
  for (let i = 0; i < 121; i++) {
    const r = i % 11, c = Math.floor(i/11);
    // skip finder zones
    const inTL = r < 4 && c < 4;
    const inTR = r > 6 && c < 4;
    const inBL = r < 4 && c > 6;
    if (inTL || inTR || inBL) continue;
    s = (s * 9301 + 49297) % 233280;
    if ((s % 100) > 52) grid[i] = true;
  }
  return grid;
};

const QR_PATTERN = makeQRPattern(7);

const EmptyState = ({ icon, title, sub, action }) => (
  <div className="empty">
    <div className="empty-ico">{icon}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>{title}</div>
    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>{sub}</div>
    {action && <div style={{ marginTop: 14 }}>{action}</div>}
  </div>
);

const Skel = ({ w, h = 12, r = 6, style = {} }) => (
  <div className="skel" style={{ width: w, height: h, borderRadius: r, ...style }}/>
);

const Avatar = ({ initials, kind = 'nu', size = 32 }) => (
  <div className={`ava ava-${kind}`} style={{ width: size, height: size }}>{initials}</div>
);

const SectionDivider = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
    <div style={{ height: 1, background: 'var(--border)', flex: 1 }}/>
    <span style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>{children}</span>
    <div style={{ height: 1, background: 'var(--border)', flex: 1 }}/>
  </div>
);

// Tabs container
const Tabs = ({ items, active, onChange }) => (
  <div className="tabs">
    {items.map(it => (
      <div key={it.id} className="tab" data-active={active === it.id}
        onClick={() => onChange(it.id)}>
        {it.label}
        {it.count != null && <span className="tab-count">{it.count}</span>}
      </div>
    ))}
  </div>
);

const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);

// ===== Configurable languages =====
// FR + EN active by default; merchant can enable more from Settings → Marque.
const ALL_LANGS = [
  { id: 'fr', label: 'FR', name: 'Français', flag: '🇫🇷' },
  { id: 'en', label: 'EN', name: 'English', flag: '🇬🇧' },
  { id: 'dua', label: 'DUÁ', name: 'Duálá', flag: '🇨🇲' },
  { id: 'ewo', label: 'EWO', name: 'Ewondo', flag: '🇨🇲' },
  { id: 'pcm', label: 'PID', name: 'Pidgin', flag: '🇨🇲' },
  { id: 'ar',  label: 'ع',  name: 'العربية', flag: '🇸🇦' },
  { id: 'pt',  label: 'PT', name: 'Português', flag: '🇵🇹' },
  { id: 'es',  label: 'ES', name: 'Español', flag: '🇪🇸' },
];
const LangContext = React.createContext({ langs: ['fr', 'en'], setLangs: () => {} });
const useLangs = () => React.useContext(LangContext);

// ===== Boutique scope selector (enseigne → points de vente) =====
// value: 'all' or an array of store ids. A rule/campaign can target one, several, or all POS.
const BoutiqueScope = ({ value = 'all', onChange, label = 'Boutiques concernées', help }) => {
  const stores = window.STORES || [];
  const isAll = value === 'all' || !Array.isArray(value);
  const ids = Array.isArray(value) ? value : [];
  const toggle = (id) => {
    let next = isAll ? stores.filter(s => s.id !== id).map(s => s.id) : (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
    if (next.length === 0 || next.length === stores.length) { onChange('all'); return; }
    onChange(next);
  };
  return (
    <div>
      {label && <label className="lbl">{label}</label>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div onClick={() => onChange('all')} className="pill" style={{ cursor: 'pointer', padding: '7px 12px', fontSize: 12, background: isAll ? 'var(--e2)' : 'var(--surface)', color: isAll ? '#fff' : 'var(--muted)', border: '1px solid ' + (isAll ? 'var(--e2)' : 'var(--border-2)') }}>
          <Ico.store size={12}/> Toute l'enseigne
        </div>
        {stores.map(s => {
          const on = !isAll && ids.includes(s.id);
          return (
            <div key={s.id} onClick={() => toggle(s.id)} className="pill" style={{ cursor: 'pointer', padding: '7px 12px', fontSize: 12, background: on ? 'var(--e0)' : 'var(--surface)', color: on ? 'var(--e4)' : 'var(--muted)', border: '1px solid ' + (on ? 'var(--e1)' : 'var(--border-2)') }}>
              <span className="tier-dot" style={{ background: ({em:'#1FA971',gd:'#C89B3C',tl:'#0F766E',tr:'#C26D52',nu:'#8E8472'})[s.kind] }}/>{s.short} {on && <Ico.check size={11}/>}
            </div>
          );
        })}
      </div>
      <div className="field-help">{help || (isAll ? `Appliqué aux ${stores.length} points de vente.` : `${ids.length} boutique${ids.length > 1 ? 's' : ''} ciblée${ids.length > 1 ? 's' : ''}.`)}</div>
    </div>
  );
};

// Compact read-only display of a boutique scope (for lists/cards)
const ScopeTag = ({ value }) => {
  const stores = window.STORES || [];
  const isAll = value === 'all' || !Array.isArray(value);
  if (isAll) return <span className="pill pill-neutral"><Ico.store size={11}/> Toute l'enseigne</span>;
  const names = value.map(id => (stores.find(s => s.id === id) || {}).short).filter(Boolean);
  return <span className="pill pill-neutral"><Ico.store size={11}/> {names.length <= 2 ? names.join(', ') : `${names.length} boutiques`}</span>;
};

Object.assign(window, {
  Sparkline, BarChart, Donut, LineChart,
  Switch, Pill, TierBadge, QRGrid, QR_PATTERN,
  EmptyState, Skel, Avatar, SectionDivider, Tabs, Portal,
  ALL_LANGS, LangContext, useLangs, BoutiqueScope, ScopeTag,
});
