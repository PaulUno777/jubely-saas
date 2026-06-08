/* eslint-disable */
// Default fiche copy per language (newcomer-friendly — explains the program)
const FICHE_TXT = {
  fr: { headline: 'Rejoignez notre programme de fidélité', tagline: 'Gagnez des points à chaque visite et débloquez des récompenses gourmandes.',
    cta: 'Scannez pour rejoindre', join: 'Aucune application à installer — votre carte vit dans Jubelee.',
    steps: ['Scannez ce QR avec l\u2019appareil photo de votre téléphone', 'Présentez votre carte à chaque achat en caisse', 'Cumulez des points et débloquez vos récompenses'],
    how: 'Comment ça marche', reward: 'Café offert dès 1 500 points', rewardSub: '+ une récompense à chaque palier', tiers: 'Vos paliers de fidélité', powered: 'Propulsé par' },
  en: { headline: 'Join our loyalty program', tagline: 'Earn points on every visit and unlock delicious rewards.',
    cta: 'Scan to join', join: 'No app to install — your card lives in Jubelee.',
    steps: ['Scan this QR with your phone camera', 'Show your card at every checkout', 'Collect points and unlock your rewards'],
    how: 'How it works', reward: 'Free coffee from 1,500 points', rewardSub: '+ a reward at every tier', tiers: 'Your loyalty tiers', powered: 'Powered by' },
};
const ficheCopy = (lang) => FICHE_TXT[lang] || FICHE_TXT.fr;

const ACCENTS = [
  { id: 'gold', c: '#C89B3C', d: '#8a6a1f' },
  { id: 'emerald', c: '#1FA971', d: '#0E5C3C' },
  { id: 'teal', c: '#0F766E', d: '#0A4A45' },
  { id: 'terra', c: '#C26D52', d: '#7e3f2c' },
  { id: 'ink', c: '#3D352A', d: '#211C14' },
];

const QREnroll = ({ toast }) => {
  const { langs } = useLangs();
  const [variant, setVariant] = React.useState('affiche'); // affiche | comptoir | carte
  const [theme, setTheme] = React.useState('dark');         // dark | light | brand
  const [accent, setAccent] = React.useState(ACCENTS[0]);
  const [ficheLang, setFicheLang] = React.useState(langs[0] || 'fr');
  const [show, setShow] = React.useState({ logo: true, how: true, tiers: true, reward: true, contact: true });
  const [copy, setCopy] = React.useState({});
  React.useEffect(() => { if (!langs.includes(ficheLang)) setFicheLang(langs[0] || 'fr'); }, [langs]);

  const base = ficheCopy(ficheLang);
  const txt = (k) => (copy[ficheLang]?.[k] != null && copy[ficheLang][k] !== '') ? copy[ficheLang][k] : base[k];
  const setTxt = (k, v) => setCopy(c => ({ ...c, [ficheLang]: { ...(c[ficheLang] || {}), [k]: v } }));
  const toggle = (k) => setShow(s => ({ ...s, [k]: !s[k] }));

  // theme palette
  const pal = theme === 'light'
    ? { bg: '#FFFFFF', panel: '#F5F0E8', fg: '#211C14', sub: '#6B6155', logoBg: accent.c, logoFg: '#fff', chip: 'rgba(33,28,20,0.05)', chipFg: accent.d, qrCard: '#fff', line: 'rgba(33,28,20,0.08)' }
    : theme === 'brand'
    ? { bg: accent.d, panel: 'rgba(255,255,255,0.10)', fg: '#FFFFFF', sub: 'rgba(255,255,255,0.72)', logoBg: 'rgba(255,255,255,0.16)', logoFg: '#fff', chip: 'rgba(255,255,255,0.14)', chipFg: '#fff', qrCard: '#fff', line: 'rgba(255,255,255,0.16)' }
    : { bg: '#1A1610', panel: 'rgba(255,255,255,0.04)', fg: '#F2EBDC', sub: 'rgba(232,226,213,0.62)', logoBg: accent.c, logoFg: '#1A1610', chip: 'rgba(255,255,255,0.07)', chipFg: accent.c === '#3D352A' ? '#F0D070' : accent.c, qrCard: '#F2EBDC', line: 'rgba(255,255,255,0.10)' };

  const W = variant === 'affiche' ? 430 : variant === 'comptoir' ? 380 : 340;
  const pad = variant === 'carte' ? 22 : 32;

  const SectionTitle = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 10px' }}>
      <div style={{ height: 1, flex: 1, background: pal.line }}/>
      <span style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: pal.sub, fontWeight: 700 }}>{children}</span>
      <div style={{ height: 1, flex: 1, background: pal.line }}/>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--heading)' }}>QR d'enrôlement</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Une fiche imprimable et personnalisable pour présenter votre programme — même aux clients qui ne connaissent pas Jubelee.</div>
        </div>
        <button className="btn btn-ghost" onClick={() => toast('Lien copié', 'jubelee.app/chez-mama', 'em')}><Ico.copy size={15}/> Copier le lien</button>
        <button className="btn btn-primary" onClick={() => window.print()}><Ico.download size={16}/> Exporter en PDF</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        {/* ===== CONTROLS ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 84 }}>
          {/* Format */}
          <div className="card">
            <div className="card-head"><div className="grow"><h3>Format</h3></div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['affiche', 'Affiche A5', 'Mur ou vitrine', <Ico.log size={15}/>], ['comptoir', 'Chevalet comptoir', 'À poser en caisse', <Ico.store size={15}/>], ['carte', 'Carte de poche', 'Format portefeuille', <Ico.card size={15}/>]].map(([id, t, d, ic]) => (
                <div key={id} onClick={() => setVariant(id)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: variant === id ? '1.5px solid var(--e2)' : '1px solid var(--border-2)', background: variant === id ? 'var(--e0)' : 'var(--surface)' }}>
                  <div className="ava ava-nu" style={{ width: 32, height: 32, color: 'var(--n6)' }}>{ic}</div>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>{t}</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{d}</div></div>
                </div>
              ))}
            </div>
          </div>

          {/* Theme + brand color */}
          <div className="card">
            <div className="card-head"><div className="grow"><h3>Marque</h3></div></div>
            <div className="card-body">
              <label className="lbl">Thème</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {[['dark', 'Sombre'], ['light', 'Clair'], ['brand', 'Marque']].map(([id, l]) => (
                  <button key={id} onClick={() => setTheme(id)} className="btn btn-sm" style={{ flex: 1, background: theme === id ? 'var(--n8)' : 'var(--surface-2)', color: theme === id ? '#fff' : 'var(--muted)' }}>{l}</button>
                ))}
              </div>
              <label className="lbl">Couleur d'accent</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {ACCENTS.map(a => (
                  <div key={a.id} onClick={() => setAccent(a)} style={{ width: 34, height: 34, borderRadius: 9, background: a.c, cursor: 'pointer', boxShadow: accent.id === a.id ? `0 0 0 2px var(--surface), 0 0 0 4px ${a.c}` : 'none' }}/>
                ))}
              </div>
            </div>
          </div>

          {/* Content toggles */}
          <div className="card">
            <div className="card-head"><div className="grow"><h3>Éléments affichés</h3></div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[['logo', 'Logo de la boutique'], ['how', '« Comment ça marche » (3 étapes)'], ['tiers', 'Aperçu des paliers'], ['reward', 'Récompense vedette'], ['contact', 'Lien & coordonnées']].map(([k, t], i, arr) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ flex: 1, fontSize: 12.5, color: 'var(--body)' }}>{t}</span>
                  <Switch on={show[k]} onChange={() => toggle(k)}/>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== EDITOR + PREVIEW ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>
          {/* copy editor */}
          <div className="card">
            <div className="card-head">
              <div className="grow"><h3>Communication</h3><div className="sub">Le texte présenté à vos clients</div></div>
              <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', padding: 2, borderRadius: 7 }}>
                {ALL_LANGS.filter(l => langs.includes(l.id)).map(l => (
                  <button key={l.id} onClick={() => setFicheLang(l.id)} title={l.name} style={{ appearance: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', padding: '3px 9px', borderRadius: 5, fontSize: 10.5, fontWeight: 700, background: ficheLang === l.id ? 'var(--surface)' : 'transparent', color: ficheLang === l.id ? 'var(--heading)' : 'var(--muted)', boxShadow: ficheLang === l.id ? 'var(--shadow-card)' : 'none' }}>{l.label}</button>
                ))}
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label className="lbl">Titre d'accroche</label><input className="input" value={txt('headline')} onChange={e => setTxt('headline', e.target.value)}/></div>
              <div><label className="lbl">Sous-titre</label><textarea className="textarea" rows="2" value={txt('tagline')} onChange={e => setTxt('tagline', e.target.value)}/></div>
              <div><label className="lbl">Appel à scanner</label><input className="input" value={txt('cta')} onChange={e => setTxt('cta', e.target.value)}/></div>
              {show.reward && <div><label className="lbl">Récompense vedette</label><input className="input" value={txt('reward')} onChange={e => setTxt('reward', e.target.value)}/></div>}
              <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.5 }}>
                <Ico.info size={14} style={{ flex: 'none' }}/> La section « Comment ça marche » rassure les clients qui découvrent Jubelee : aucune app à installer, juste un scan.
              </div>
            </div>
          </div>

          {/* preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div id="print-fiche" style={{ width: W, background: pal.bg, borderRadius: 22, overflow: 'hidden', boxShadow: 'var(--shadow-modal)', color: pal.fg, border: theme === 'light' ? '1px solid var(--border)' : 'none' }}>
              {/* header */}
              <div style={{ padding: `${pad}px ${pad}px ${variant === 'carte' ? 14 : 20}px`, textAlign: 'center' }}>
                {show.logo && <div style={{ width: variant === 'carte' ? 48 : 60, height: variant === 'carte' ? 48 : 60, borderRadius: 16, background: pal.logoBg, color: pal.logoFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 600, fontSize: variant === 'carte' ? 26 : 32, margin: '0 auto 14px' }}>C</div>}
                <div className="serif" style={{ fontSize: variant === 'affiche' ? 32 : 26, color: pal.fg, lineHeight: 1.05 }}>Chez Mama</div>
                {show.contact && <div style={{ fontSize: 12.5, color: pal.sub, marginTop: 5 }}>Restaurant · Akwa, Douala</div>}
                <div style={{ marginTop: 16, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 500, fontSize: variant === 'affiche' ? 22 : 19, color: pal.fg, lineHeight: 1.2, padding: '0 6px' }}>{txt('headline')}</div>
                <div style={{ fontSize: 12.5, color: pal.sub, marginTop: 8, lineHeight: 1.5, padding: '0 4px' }}>{txt('tagline')}</div>
              </div>

              {/* QR */}
              <div style={{ background: pal.panel, margin: `4px ${pad}px`, borderRadius: 18, padding: variant === 'carte' ? 16 : 22, textAlign: 'center' }}>
                <div style={{ background: '#fff', borderRadius: 14, padding: 14, display: 'inline-block', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
                  <div className="qr-grid" style={{ width: variant === 'affiche' ? 156 : 130, height: variant === 'affiche' ? 156 : 130, gridTemplateColumns: 'repeat(11,1fr)', gridTemplateRows: 'repeat(11,1fr)', padding: 0, borderRadius: 0 }}>
                    {QR_PATTERN.map((on, i) => <i key={i} className={on ? '' : 'b'} style={{ background: on ? '#1A1610' : 'transparent' }}/>)}
                  </div>
                </div>
                <div style={{ marginTop: 12, color: pal.fg, fontSize: 14, fontWeight: 700 }}>{txt('cta')}</div>
                <div className="mono" style={{ marginTop: 3, color: pal.chipFg, fontSize: 12.5 }}>jubelee.app/chez-mama</div>
              </div>

              {/* how it works */}
              {show.how && (
                <div style={{ padding: `18px ${pad}px 4px` }}>
                  <SectionTitle>{txt('how')}</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {base.steps.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: pal.chip, color: pal.chipFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600, flex: 'none' }}>{i + 1}</div>
                        <div style={{ fontSize: 12.5, color: pal.fg, lineHeight: 1.35, textAlign: 'left' }}>{base.steps[i] && (copy[ficheLang]?.steps?.[i] || s)}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11.5, color: pal.sub, textAlign: 'center', fontStyle: 'italic' }}>{base.join}</div>
                </div>
              )}

              {/* tiers */}
              {show.tiers && (
                <div style={{ padding: `16px ${pad}px 4px` }}>
                  <SectionTitle>{base.tiers}</SectionTitle>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    {[['Bronze', '#B07A4A'], ['Argent', '#C9CDD2'], ['Or', '#F0D070'], ['Platine', '#90D0CC']].map(([t, c]) => (
                      <div key={t} style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: c, margin: '0 auto 5px' }}/>
                        <div style={{ fontSize: 11, color: pal.sub }}>{t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* reward */}
              {show.reward && (
                <div style={{ padding: `16px ${pad}px 4px` }}>
                  <div style={{ padding: '12px 14px', background: pal.chip, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: accent.c, color: theme === 'light' ? '#fff' : '#1A1610', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Ico.gift size={17}/></div>
                    <div style={{ textAlign: 'left' }}><div style={{ fontSize: 13.5, fontWeight: 600, color: pal.fg }}>{txt('reward')}</div><div style={{ fontSize: 11.5, color: pal.sub }}>{base.rewardSub}</div></div>
                  </div>
                </div>
              )}

              {/* footer */}
              <div style={{ padding: `${variant === 'carte' ? 14 : 20}px ${pad}px ${pad}px`, textAlign: 'center', fontSize: 11.5, color: pal.sub }}>
                {base.powered} <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: pal.chipFg, fontSize: 14 }}>Jubelee</span>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Aperçu · {variant === 'affiche' ? 'A5 portrait' : variant === 'comptoir' ? 'Chevalet' : 'Carte de poche'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.QREnroll = QREnroll;
