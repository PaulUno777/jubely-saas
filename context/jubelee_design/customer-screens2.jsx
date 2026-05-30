// customer-screens2.jsx — Notifications inbox, Scan-to-join, Enrollment, Store detail

// ────────────────────────────────────────────────────────────────
//   NOTIFICATIONS INBOX
// ────────────────────────────────────────────────────────────────
function NotifsScreen({ nav }) {
  const [tab, setTab] = React.useState('all');
  const tabs = [
    { id: 'all',       label: 'Tout' },
    { id: 'proximity', label: 'Proximité' },
    { id: 'rewards',   label: 'Récompenses' },
    { id: 'events',    label: 'Événements' },
  ];
  const filtered = NOTIFS.filter(n => {
    if (tab === 'all') return true;
    if (tab === 'proximity') return n.type === 'proximity';
    if (tab === 'rewards') return n.type === 'reward' || n.type === 'tier';
    if (tab === 'events') return n.type === 'event' || n.type === 'product';
    return true;
  });

  return (
    <div className="pf-scroll">
      {/* header */}
      <div style={{ padding: '12px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => nav('wallet')} style={{
          width: 36, height: 36, borderRadius: 50, background: 'var(--cream-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <IconChevronLeft size={18} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="label-tag">Mes alertes</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 1 }}>Notifications</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 50, background: 'var(--cream-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <IconClipboard size={16} />
        </div>
      </div>

      {/* tabs */}
      <div style={{ padding: '8px 20px 4px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            appearance: 'none', border: 0, cursor: 'pointer',
            padding: '7px 12px', borderRadius: 999,
            background: tab === tb.id ? 'var(--card)' : 'var(--cream-2)',
            color: tab === tb.id ? 'var(--cream)' : 'var(--ink)',
            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>{tb.label}</button>
        ))}
      </div>

      {/* settings hint */}
      <div style={{
        margin: '8px 20px 4px',
        padding: '10px 12px', borderRadius: 12,
        background: 'var(--cream-2)',
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 11.5, color: 'var(--ink-mut)',
      }}>
        <IconShield size={14} stroke="var(--gold-3)" />
        <span>Tu peux désactiver les promos sponsorisées dans Profil · Notifications.</span>
      </div>

      {/* feed */}
      <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((n, i) => <NotifCard key={n.id} n={n} onAction={() => nav(n.store && !n.store.enrolled ? 'storedetail' : 'walletdetail', { store: n.store })} />)}
      </div>
    </div>
  );
}

function NotifCard({ n, onAction }) {
  const iconForType = {
    proximity: IconPin,
    reward: IconGift,
    event: IconCalendar,
    product: IconSparkle,
    tier: IconStar,
  };
  const Icon = iconForType[n.type] || IconBell;
  const tone = {
    proximity: { bg: 'var(--mint)', fg: 'var(--green)' },
    reward:    { bg: 'var(--gold-bg)', fg: 'var(--gold-3)' },
    event:     { bg: 'rgba(217,119,87,0.12)', fg: '#b85a39' },
    product:   { bg: '#e2e3c9', fg: '#5d6627' },
    tier:      { bg: 'rgba(212,174,108,0.18)', fg: 'var(--gold-3)' },
  }[n.type] || { bg: 'var(--cream-2)', fg: 'var(--ink)' };

  return (
    <div style={{
      background: 'var(--cream)', border: '1px solid rgba(26,24,20,0.08)',
      borderRadius: 18, overflow: 'hidden',
    }}>
      {/* header strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        background: tone.bg,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: '#fff', color: tone.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={16} />
        </div>
        <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: tone.fg, minWidth: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {n.store?.name || 'Jubelee'}
        </div>
        {n.sponsored && <span className="pill pill-sponsored" style={{ padding: '1px 7px', fontSize: 9, letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0 }}>Sponso</span>}
        <span style={{ fontSize: 11, color: 'var(--ink-mut)', whiteSpace: 'nowrap', flexShrink: 0 }}>{n.when}</span>
      </div>

      {/* body */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.25 }}>{n.title}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-mut)', marginTop: 4, lineHeight: 1.5 }}>{n.body}</div>

        {/* creative placeholder for events / products / rewards */}
        {(n.type === 'event' || n.type === 'product') && (
          <div style={{
            marginTop: 12,
            height: 96, borderRadius: 12,
            background: n.type === 'event'
              ? 'linear-gradient(135deg, #b85a39 0%, #d97757 60%, #f4c4a0 100%)'
              : 'linear-gradient(135deg, #5d6627 0%, #8c9444 60%, #c5cb86 100%)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,255,255,0.08) 14px 16px)',
            }} />
            <div style={{
              position: 'absolute', left: 14, bottom: 12, right: 14, color: '#fff',
            }}>
              <div className="serif" style={{ fontSize: 18, lineHeight: 1.1 }}>
                {n.type === 'event' ? 'Soirée VIP · Boutique Lune' : 'Nouveau · gamme bio Mont-Plaza'}
              </div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                {n.type === 'event' ? 'Vendredi 26 · 19h–22h' : '12 références · x2 points'}
              </div>
            </div>
          </div>
        )}

        {/* CTA row */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-mut)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {n.type === 'proximity' ? '120 m de toi' : n.store?.area || ''}
          </span>
          <button onClick={onAction} style={{
            appearance: 'none', border: 0, cursor: 'pointer',
            padding: '8px 14px', borderRadius: 999,
            background: 'var(--card)', color: 'var(--cream)',
            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>{n.cta}</button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   IN-APP NOTIFICATION BANNER (slides from top)
// ────────────────────────────────────────────────────────────────
function InAppBanner({ store, onTap, onDismiss }) {
  const s = store || STORES[0];
  return (
    <div className="notif-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 7,
          background: 'rgba(212,174,108,0.18)', color: 'var(--gold-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LogoMark size={13} gold="#d4ae6c" />
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.9 }}>{s.name}</span>
        <span className="pill pill-sponsored" style={{ marginLeft: 'auto', padding: '1px 6px', fontSize: 9, background: 'rgba(217,119,87,0.25)', color: '#f4d0bd' }}>Sponso</span>
        <span onClick={onDismiss} style={{ cursor: 'pointer', opacity: 0.5 }}><IconClose size={13} /></span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>
        Tu passes devant <span className="serif" style={{ color: 'var(--gold-2)', fontStyle: 'italic' }}>Chez Mama</span>
      </div>
      <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.45, marginTop: 3 }}>
        Café offert ce soir pour les membres Or · jusqu'à 22h
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button onClick={onTap} style={{
          appearance: 'none', border: 0, cursor: 'pointer',
          padding: '7px 14px', borderRadius: 999,
          background: 'var(--gold-2)', color: 'var(--card)',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
        }}>Voir la récompense</button>
        <button onClick={onDismiss} style={{
          appearance: 'none', border: 0, cursor: 'pointer',
          padding: '7px 14px', borderRadius: 999,
          background: 'rgba(255,255,255,0.10)', color: 'var(--cream)',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
        }}>Plus tard</button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   SCAN TO JOIN (customer scanner)
// ────────────────────────────────────────────────────────────────
function ScanToJoinScreen({ nav }) {
  return (
    <div className="pf-scroll" style={{
      background: 'var(--card)', color: 'var(--cream)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* top */}
      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => nav('wallet')} style={{
          width: 36, height: 36, borderRadius: 50, background: 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <IconChevronLeft size={18} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Scanner</div>
        <div style={{
          width: 36, height: 36, borderRadius: 50, background: 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <IconFlash size={16} />
        </div>
      </div>

      {/* segmented */}
      <div style={{ padding: '4px 20px 0' }}>
        <div style={{
          background: 'rgba(255,255,255,0.08)', borderRadius: 14,
          padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr',
        }}>
          <button style={{
            appearance: 'none', border: 0, cursor: 'pointer',
            background: 'var(--cream)', color: 'var(--ink)',
            borderRadius: 11, padding: '10px 12px',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
          }}>Rejoindre une enseigne</button>
          <button style={{
            appearance: 'none', border: 0, cursor: 'pointer',
            background: 'transparent', color: 'rgba(255,255,255,0.7)',
            borderRadius: 11, padding: '10px 12px',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
          }}>Mon QR</button>
        </div>
      </div>

      {/* viewfinder */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 20, gap: 22,
      }}>
        <div className="vf">
          <i /><i />
          <div className="vf-ghost">
            {Array.from({ length: 49 }, (_, i) => {
              const seed = (i * 7 + 13) % 11;
              return <i key={i} style={{ opacity: seed > 5 ? 1 : 0 }} />;
            })}
          </div>
          <div className="vf-line" />
        </div>

        <div style={{ textAlign: 'center', maxWidth: 260 }}>
          <div className="serif" style={{ fontSize: 22, color: 'var(--gold-2)', lineHeight: 1.15 }}>
            Scanne le QR d'une enseigne
          </div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 6, lineHeight: 1.5 }}>
            Trouve le sticker Jubelee en vitrine ou à la caisse pour rejoindre son programme de fidélité.
          </div>
        </div>

        {/* recent suggested chips */}
        <div style={{ width: '100%', borderTop: '0.5px solid rgba(255,255,255,0.10)', paddingTop: 14 }}>
          <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 8 }}>
            Près de toi
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {STORES.filter(s => !s.enrolled).slice(0, 3).map(s => (
              <button key={s.id} onClick={() => nav('joinsheet', { store: s })} style={{
                appearance: 'none', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                padding: '8px 12px', borderRadius: 999,
                background: 'transparent', color: 'var(--cream)',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
                whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 18, height: 18, borderRadius: 6, background: 'rgba(212,174,108,0.18)', color: 'var(--gold-2)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 700,
                }}>{s.initials}</span>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => nav('joinsheet', { store: STORES[2] })} style={{
          appearance: 'none', border: 0, cursor: 'pointer', width: '100%',
          padding: '14px 20px', borderRadius: 16,
          background: 'var(--gold-2)', color: 'var(--card)',
          fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <IconQR size={18} /> Simuler une détection
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   ENROLLMENT SHEET (after scan)
// ────────────────────────────────────────────────────────────────
function JoinSheetScreen({ nav, store }) {
  const s = store || STORES[2];
  return (
    <div className="pf-screen" style={{ position: 'relative', background: 'rgba(0,0,0,0.4)' }}>
      {/* dim backdrop showing the scanner behind */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--card)', opacity: 0.95 }}>
        <div style={{ padding: 80, display: 'flex', justifyContent: 'center' }}>
          <div className="vf" style={{ width: 160, height: 160, opacity: 0.4 }}>
            <i /><i />
          </div>
        </div>
      </div>

      {/* sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--cream)',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        boxShadow: '0 -16px 40px rgba(26,24,20,0.4)',
        padding: '12px 18px 22px',
        maxHeight: '78%',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(26,24,20,0.15)' }} />
        </div>

        {/* store hero */}
        <div className="store-hero" style={{ height: 130, marginTop: 12 }}>
          <div style={{ position: 'absolute', inset: 0, padding: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' }}>{s.type}</div>
              <div className="serif" style={{ fontSize: 28, color: 'var(--cream)', lineHeight: 1, marginTop: 4 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                <IconStore size={12} /> {(s.locations ? s.locations.length : 1)} {(s.locations && s.locations.length > 1) ? 'boutiques' : 'boutique'} · 1 programme
              </div>
            </div>
            <div className={'avatar ' + s.tone} style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--cream)', color: 'var(--gold-3)',
              fontSize: 17, border: '2px solid rgba(255,255,255,0.4)',
            }}>{s.initials}</div>
          </div>
        </div>

        {/* main copy */}
        <div style={{ padding: '14px 4px 0' }}>
          <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.2 }}>
            Tu rejoins le programme <span style={{ color: 'var(--gold-3)' }}>{s.name}</span>.
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-mut)', marginTop: 6, lineHeight: 1.5 }}>
            Cumule des points à chaque visite, débloque des récompenses et reçois les bons plans en avant-première.
          </div>
        </div>

        {/* welcome bonus */}
        <div style={{
          marginTop: 12, padding: 14, borderRadius: 16,
          background: 'var(--gold-bg)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--gold-2)', color: 'var(--card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconSparkle size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Bonus d'inscription</div>
            <div style={{ fontSize: 12, color: 'var(--gold-3)', marginTop: 2, fontWeight: 500 }}>+50 pts crédités immédiatement</div>
          </div>
          <span className="pill" style={{ background: 'var(--gold-2)', color: 'var(--card)', whiteSpace: 'nowrap' }}>Inclus</span>
        </div>

        {/* rules preview */}
        <div style={{ marginTop: 12, padding: 14, borderRadius: 16, background: 'var(--cream-2)' }}>
          <div className="label-tag" style={{ marginBottom: 8 }}>Comment ça marche</div>
          <Bullet>1 point gagné pour chaque <b>100 FCFA</b> dépensés</Bullet>
          <Bullet>Une seule carte, valable dans <b>toutes les boutiques {s.name}</b></Bullet>
          <Bullet>Récompenses à partir de <b>{s.reward}</b></Bullet>
          <Bullet>Paliers Bronze → Argent → Or → Platine</Bullet>
        </div>

        {/* terms */}
        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--ink-mut)', lineHeight: 1.5 }}>
          En rejoignant, tu acceptes que <b style={{ color: 'var(--ink)' }}>{s.name}</b> envoie occasionnellement
          des notifications via Jubelee. Tu peux les couper à tout moment.
        </div>

        {/* CTAs */}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => nav('joinsuccess', { store: s })} className="btn btn-primary" style={{ width: '100%' }}>
            <IconCheck size={18} /> Rejoindre maintenant
          </button>
          <button onClick={() => nav('scanjoin')} className="btn btn-ghost" style={{ width: '100%' }}>
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

function Bullet({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold-3)', marginTop: 8, flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   ENROLLMENT SUCCESS
// ────────────────────────────────────────────────────────────────
function JoinSuccessScreen({ nav, store }) {
  const s = store || STORES[2];
  return (
    <div className="pf-scroll" style={{
      background: 'var(--cream)',
      display: 'flex', flexDirection: 'column', padding: '40px 20px 20px', gap: 22,
    }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'var(--gold-2)', color: 'var(--card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 14px rgba(212,174,108,0.18)',
        }}>
          <IconCheck size={48} sw={2.5} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div className="label-tag" style={{ color: 'var(--gold-3)' }}>Programme rejoint</div>
        <div className="serif" style={{ fontSize: 30, color: 'var(--ink)', lineHeight: 1.1, marginTop: 6 }}>
          Bienvenue chez <span style={{ color: 'var(--gold-3)' }}>{s.name}</span>.
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-mut)', marginTop: 8, maxWidth: 280, marginInline: 'auto' }}>
          Tu fais maintenant partie du programme. Ta carte est ajoutée à <b style={{ color: 'var(--ink)' }}>Mon wallet</b>.
        </div>
      </div>

      {/* mini program card preview */}
      <div className="card-dark" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(212,174,108,0.18)', color: 'var(--gold-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
          }}>{s.initials}</div>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{s.name}</span>
          <span className="pill pill-dark" style={{ marginLeft: 'auto' }}>Bronze</span>
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span className="serif" style={{ fontSize: 38, color: 'var(--gold-2)', lineHeight: 1 }}>50</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>pts de bienvenue</span>
        </div>
        <div className="tier-bar" style={{ marginTop: 12, background: 'rgba(255,255,255,0.10)' }}>
          <i style={{ width: '10%' }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
          150 pts avant Argent · prochaine récompense : <span style={{ color: 'var(--gold-2)' }}>{s.reward}</span>
        </div>
      </div>

      {/* next steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => nav('walletdetail', { store: { ...s, enrolled: true, pts: 50, tier: 'Bronze' } })} className="btn btn-primary" style={{ width: '100%' }}>
          <IconWallet size={18} /> Voir ma carte
        </button>
        <button onClick={() => nav('wallet')} className="btn btn-ghost" style={{ width: '100%' }}>
          Retour à l'accueil
        </button>
      </div>

      <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-mut)', marginTop: 'auto' }}>
        Astuce&nbsp;: présente ton QR personnel à la caisse pour cumuler tes points à chaque visite.
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   STORE DETAIL (public profile, used when not enrolled)
// ────────────────────────────────────────────────────────────────
function StoreDetailScreen({ nav, store }) {
  const s = store || STORES[2];
  const locations = s.locations || [
    { area: s.area, address: s.area, distance: s.distance, hours: '10h – 22h', nearest: true },
  ];
  const nLoc = locations.length;
  const nearest = locations.find(l => l.nearest) || locations[0];

  const circleBtn = {
    width: 36, height: 36, borderRadius: 50,
    background: 'rgba(255,255,255,0.18)', color: '#fff',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  };

  return (
    <div className="pf-scroll">
      {/* hero — gradient banner with chrome only (no overlapping text) */}
      <div className="store-hero" style={{ height: 156, borderRadius: 0 }}>
        <div style={{ position: 'absolute', top: 8, left: 0, right: 0,
          padding: '4px 16px 0', display: 'flex', justifyContent: 'space-between',
        }}>
          <div onClick={() => nav('map')} style={circleBtn}><IconChevronLeft size={18} /></div>
          <div style={circleBtn}><IconBookmark size={16} /></div>
        </div>
        {/* multi-boutique badge sitting on the gradient */}
        <div style={{
          position: 'absolute', bottom: 14, right: 16,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 11px', borderRadius: 999,
          background: 'rgba(26,24,20,0.42)', color: '#fff',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          fontSize: 11.5, fontWeight: 600, letterSpacing: '0.01em', whiteSpace: 'nowrap',
        }}>
          <IconStore size={13} /> {nLoc} {nLoc > 1 ? 'boutiques' : 'boutique'}
        </div>
      </div>

      {/* brand header — logo overlaps the gradient, name sits cleanly on cream */}
      <div style={{ padding: '0 20px', marginTop: -36, position: 'relative' }}>
        <div className={'avatar ' + s.tone} style={{
          width: 72, height: 72, borderRadius: 20, fontSize: 22,
          border: '4px solid var(--cream)',
          boxShadow: '0 6px 16px rgba(26,24,20,0.18)',
        }}>{s.initials}</div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="serif" style={{ fontSize: 30, color: 'var(--ink)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{s.name}</span>
          {s.sponsored && <span className="pill pill-sponsored" style={{ padding: '2px 8px', fontSize: 10 }}>Sponso</span>}
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--ink-mut)', flexWrap: 'wrap' }}>
          <span>{s.type}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IconStore size={13} stroke="var(--ink-soft)" /> {nLoc} {nLoc > 1 ? 'boutiques à Douala' : 'boutique'}
          </span>
        </div>
      </div>

      {/* quick stats — rebuilt around the multi-location reality */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 10 }}>
        <Stat icon={IconStar}  label="4.8" sub="156 avis" />
        <Stat icon={IconStore} label={String(nLoc)} sub={nLoc > 1 ? 'points de vente' : 'point de vente'} />
        <Stat icon={IconPin}   label={nearest.distance} sub="la + proche" />
      </div>

      {/* ★ THE PROGRAM — one shared loyalty program across every boutique */}
      <div style={{ padding: '16px 16px 0' }}>
        <div className="card-dark" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(212,174,108,0.18)', color: 'var(--gold-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <IconSparkle size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="label-tag dark" style={{ color: 'var(--gold-2)' }}>Un seul programme</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--cream)', marginTop: 2 }}>
                Une carte, {nLoc} {nLoc > 1 ? 'boutiques' : 'boutique'}
              </div>
            </div>
            <span className="pill pill-dark" style={{ whiteSpace: 'nowrap' }}>+50 pts</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.66)', marginTop: 12, lineHeight: 1.55 }}>
            Tes points se cumulent et tes récompenses sont valables dans
            <b style={{ color: 'var(--cream)' }}> toutes les boutiques {s.name}</b> — peu importe où tu passes.
          </div>
          <button onClick={() => nav('joinsheet', { store: s })} className="btn btn-gold" style={{ width: '100%', marginTop: 14 }}>
            <IconSparkle size={17} /> Rejoindre le programme
          </button>
        </div>
      </div>

      {/* POINTS DE VENTE — the locations sharing this one program */}
      <div style={{ padding: '22px 20px 8px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div className="label-tag">Points de vente</div>
        <span onClick={() => nav('map')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-3)', cursor: 'pointer' }}>Voir sur la carte</span>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {locations.map((l, i) => (
          <div key={i} className="card-outline" style={{
            padding: 13, display: 'flex', alignItems: 'center', gap: 12,
            borderColor: l.nearest ? 'var(--gold-2)' : 'rgba(26,24,20,0.08)',
            background: l.nearest ? 'var(--gold-bg)' : 'var(--cream)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: l.nearest ? 'var(--gold-2)' : 'var(--cream-2)',
              color: l.nearest ? 'var(--card)' : 'var(--ink-mut)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconPin size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{s.name} · {l.area}</span>
                {l.nearest && <span className="pill pill-gold" style={{ padding: '1px 7px', fontSize: 9.5 }}>La + proche</span>}
                {l.soon && <span className="pill pill-cream" style={{ padding: '1px 7px', fontSize: 9.5 }}>Bientôt</span>}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-mut)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {l.address} · {l.hours}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: l.nearest ? 'var(--gold-3)' : 'var(--ink)' }}>{l.distance}</div>
              <IconChevronRight size={15} stroke="var(--ink-soft)" />
            </div>
          </div>
        ))}
      </div>

      {/* rewards preview — explicitly shared across all boutiques */}
      <div style={{ padding: '22px 20px 8px' }}>
        <div className="label-tag">Récompenses du programme</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-mut)', marginTop: 4 }}>
          Échangeables dans n'importe quelle boutique {s.name}.
        </div>
      </div>
      <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <RewardRow icon={IconCoffee} title="1 viennoiserie offerte" meta="100 pts · accessible" cta="Aperçu" />
        <RewardRow icon={IconGift}   title="Gâteau personnalisé"   meta="500 pts · accessible" cta="Aperçu" />
        <RewardRow icon={IconStar}   title="Atelier pâtisserie"   meta="1 200 pts · palier Or" cta="Bloqué" locked />
      </div>

      {/* highlights */}
      <div style={{ padding: '8px 20px 18px' }}>
        <div className="label-tag" style={{ marginBottom: 8 }}>À propos</div>
        <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.55 }}>
          Pâtisserie artisanale née à Bonanjo, aujourd'hui présente dans {nLoc} quartiers de Douala.
          Spécialités camerounaises et viennoiseries françaises préparées chaque matin dans chaque boutique.
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, sub }) {
  return (
    <div className="card-outline" style={{ flex: 1, padding: '12px 10px', textAlign: 'center' }}>
      <Icon size={16} stroke="var(--gold-3)" />
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-mut)', marginTop: 1 }}>{sub}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   NOTIFICATIONS PREFERENCES (settings)
// ────────────────────────────────────────────────────────────────
function NotifPrefsScreen({ nav }) {
  const [prefs, setPrefs] = React.useState({
    proximity: true, sponsored: true, events: true, rewards: true, tier: true, weekly: false,
  });
  const toggle = (k) => setPrefs(p => ({ ...p, [k]: !p[k] }));
  const ROWS = [
    { k: 'proximity', t: 'Alertes de proximité',      s: 'Quand tu passes près d\'une enseigne Jubelee' },
    { k: 'sponsored', t: 'Promos sponsorisées',       s: 'Offres payées par les enseignes pour te toucher' },
    { k: 'events',    t: 'Événements & soirées',      s: 'Lancements, événements VIP, dégustations' },
    { k: 'rewards',   t: 'Nouvelles récompenses',     s: 'Quand une enseigne ajoute une récompense' },
    { k: 'tier',      t: 'Progression de palier',     s: 'À l\'approche du prochain palier' },
    { k: 'weekly',    t: 'Récap hebdomadaire',        s: 'Tous les dimanches matin' },
  ];

  return (
    <div className="pf-scroll">
      <div style={{ padding: '12px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => nav('profile')} style={{
          width: 36, height: 36, borderRadius: 50, background: 'var(--cream-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <IconChevronLeft size={18} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Notifications</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '12px 20px 0' }}>
        <div className="serif" style={{ fontSize: 24, color: 'var(--ink)', lineHeight: 1.15 }}>
          Tu choisis ce qui apparaît dans ta poche.
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-mut)', marginTop: 6, lineHeight: 1.5 }}>
          Active uniquement les alertes qui te sont utiles. Les promos sponsorisées sont marquées « Sponso ».
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div className="card-outline" style={{ padding: 0 }}>
          {ROWS.map((r, i) => (
            <div key={r.k} style={{
              padding: '14px 14px',
              display: 'flex', alignItems: 'flex-start', gap: 12,
              borderBottom: i < ROWS.length - 1 ? '0.5px solid rgba(26,24,20,0.08)' : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{r.t}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-mut)', marginTop: 2, lineHeight: 1.45 }}>{r.s}</div>
              </div>
              <ToggleSwitch on={prefs[r.k]} onClick={() => toggle(r.k)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ on, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 40, height: 24, borderRadius: 999,
      background: on ? 'var(--green-d)' : 'rgba(26,24,20,0.18)',
      position: 'relative', cursor: 'pointer',
      transition: 'background .15s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 18 : 2,
        width: 20, height: 20, borderRadius: 50,
        background: '#fff', boxShadow: '0 1px 3px rgba(26,24,20,0.25)',
        transition: 'left .15s',
      }} />
    </div>
  );
}

Object.assign(window, {
  NotifsScreen, NotifCard, InAppBanner, ScanToJoinScreen,
  JoinSheetScreen, JoinSuccessScreen, StoreDetailScreen, NotifPrefsScreen,
  ToggleSwitch, Bullet, Stat,
});
