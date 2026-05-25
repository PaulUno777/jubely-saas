// screens.jsx — Jubelee Staff app screens (Home, Scanner, Award, Validate, Success)

// ────────────────────────────────────────────────────────────────
//   Mock data
// ────────────────────────────────────────────────────────────────
const MERCHANT = {
  name: 'Chez Mama',
  type: 'Restaurant · Akwa, Douala',
  initials: 'CM',
  ruleLabel: '1 pt / 100 FCFA',
  rewardLabel: 'Café offert · 200 pts',
};

const STAFF = {
  name: 'Eric Talla',
  role: 'Caissier',
  initials: 'ET',
  shift: 'Service du soir',
  shiftStart: '14:02',
  badge: 'EMP-204',
};

const TODAY = {
  clients: 14,
  pointsIssued: 1820,
  rewardsRedeemed: 3,
  newClients: 2,
};

const CLIENTS = [
  { id: 'c1', name: 'Ama Mbarga',     phone: '+237 678 12 34 56', points: 2840, tier: 'Or',     tone: 'gold',   visits: 23, last: "Aujourd'hui · 12:35", initials: 'AM', spark: true },
  { id: 'c2', name: 'Léo Atangana',   phone: '+237 691 22 87 03', points: 640,  tier: 'Argent', tone: 'silver', visits: 9,  last: "Hier · 19:20",           initials: 'LA' },
  { id: 'c3', name: 'Marc Nkoulou',   phone: '+237 657 11 02 89', points: 380,  tier: 'Bronze', tone: 'bronze', visits: 4,  last: "Aujourd'hui · 13:02", initials: 'MN' },
  { id: 'c4', name: 'Sandrine Eyong', phone: '+237 670 88 11 22', points: 1240, tier: 'Argent', tone: 'silver', visits: 12, last: "Lun. 21 avr.",          initials: 'SE' },
  { id: 'c5', name: 'Joseph Mbah',    phone: '+237 695 44 30 18', points: 120,  tier: 'Bronze', tone: 'bronze', visits: 2,  last: "Hier · 12:10",          initials: 'JM', isNew: true },
  { id: 'c6', name: 'Clarisse Foe',   phone: '+237 671 55 92 77', points: 4120, tier: 'Or',     tone: 'gold',   visits: 31, last: "Avr 22 · 18:45",        initials: 'CF', spark: true },
];

const FEED = [
  { type: 'award',  client: 'Ama Mbarga',      amount: 12000, points: 120, time: 'il y a 5 min', meta: 'Table 4 · #2841' },
  { type: 'redeem', client: 'Marc Nkoulou',    reward: 'Café offert',     points: -200, time: 'il y a 23 min', meta: 'Code cramé' },
  { type: 'signup', client: 'Joseph Mbah',     time: 'il y a 1 h', meta: 'Inscrit en boutique' },
  { type: 'award',  client: 'Sandrine Eyong',  amount: 8500,  points: 85,  time: 'il y a 1 h', meta: 'Comptoir · #2840' },
  { type: 'redeem', client: 'Clarisse Foe',    reward: 'Repas offert',    points: -850, time: 'il y a 2 h', meta: 'Code cramé' },
  { type: 'award',  client: 'Léo Atangana',    amount: 4000,  points: 40,  time: 'il y a 3 h', meta: 'Table 2 · #2839' },
];

// Pending reward in the Validate flow
const PENDING_REWARD = {
  client: CLIENTS[2], // Marc
  reward: 'Café offert',
  cost: 200,
  expires: 'expire dans 14 min',
  code: 'JBL-4F7K-29',
};

// ────────────────────────────────────────────────────────────────
//   Helpers
// ────────────────────────────────────────────────────────────────
const fmtN = (n) => n.toLocaleString('fr-FR').replace(/,/g, ' ');
const tierColor = (t) => t === 'Or' ? 'gold' : t === 'Argent' ? 'silver' : t === 'Platine' ? 'green' : 'bronze';
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

function QRGlyph({ scale = 1 }) {
  // tiny static "QR-ish" grid
  const cells = [
    1,1,1,1,1,1,1,0,1,
    1,0,0,0,0,0,1,1,1,
    1,0,1,1,1,0,1,0,1,
    1,0,1,1,1,0,1,1,0,
    1,0,1,1,1,0,1,0,1,
    1,0,0,0,0,0,1,1,1,
    1,1,1,1,1,1,1,0,1,
    0,1,1,0,1,0,0,0,1,
    1,1,0,1,0,1,1,1,1,
  ];
  return (
    <div className="qr" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      {cells.map((c, i) => <i key={i} className={c ? '' : 'b'} />)}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   Bottom tab bar
// ────────────────────────────────────────────────────────────────
function TabBar({ active, onTab, onScan }) {
  const items = [
    { id: 'home',     label: 'Accueil',  Icon: IconHome },
    { id: 'clients',  label: 'Clients',  Icon: IconUsers },
    { id: 'scan',     label: 'Scanner',  Icon: IconScan, fab: true },
    { id: 'activity', label: 'Activité', Icon: IconActivity },
    { id: 'profile',  label: 'Compte',   Icon: IconAccount },
  ];
  return (
    <div className="tabbar">
      {items.map(({ id, label, Icon, fab }) => fab ? (
        <div key={id} style={{ position: 'relative' }}>
          <div className="tab-fab" onClick={onScan}>
            <Icon size={28} />
          </div>
          <div className="tab-fab-label">{label}</div>
        </div>
      ) : (
        <div key={id} className="tab" data-active={active === id} onClick={() => onTab(id)}>
          <Icon size={22} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   HOME / ACCUEIL
// ────────────────────────────────────────────────────────────────
function HomeScreen({ nav }) {
  return (
    <>
      <div className="pf-scroll">
        {/* Header */}
        <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Wordmark size={18} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--cream-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', cursor: 'pointer',
            }}>
              <IconBell size={18} />
              <span style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
            </div>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--card)', color: 'var(--gold-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, letterSpacing: 0.02,
              cursor: 'pointer',
            }} onClick={() => nav('profile')}>ET</div>
          </div>
        </div>

        {/* Greeting + merchant context */}
        <div style={{ padding: '14px 20px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-mut)' }}>{greeting()},</span>
            <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.02 }}>{STAFF.name.split(' ')[0]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'nowrap' }}>
            <span className="pill pill-cream" style={{ background: 'var(--cream-2)', color: 'var(--ink)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--card)', color: 'var(--gold-2)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 700 }}>CM</span>
              {MERCHANT.name}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-mut)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {STAFF.shift} · depuis {STAFF.shiftStart}
            </span>
          </div>
        </div>

        {/* Hero card — today */}
        <div style={{ padding: '0 16px' }}>
          <div className="card-dark" style={{ padding: '16px 18px 14px' }}>
            {/* row 1: brand + status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: 'rgba(212,174,108,0.16)', color: 'var(--gold-2)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <IconClock size={14} />
                </span>
                <span className="serif" style={{ color: 'var(--cream)', fontSize: 19, lineHeight: 1, whiteSpace: 'nowrap' }}>
                  Service du soir
                </span>
              </div>
              <span className="pill pill-dark" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-2)', display: 'inline-block', animation: 'pulseDot 1.8s ease-in-out infinite' }} />
                En cours
              </span>
            </div>

            {/* hero metric */}
            <div style={{ marginTop: 14 }}>
              <div className="label-tag dark" style={{ whiteSpace: 'nowrap' }}>Points attribués · 23 avr.</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                <span className="serif" style={{ fontSize: 44, color: 'var(--gold-2)', lineHeight: 1, letterSpacing: '-0.005em' }}>
                  {fmtN(TODAY.pointsIssued)}
                </span>
                <span className="serif" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>pts</span>
              </div>
            </div>

            {/* mini stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0,
              marginTop: 14, paddingTop: 12,
              borderTop: '0.5px solid rgba(255,255,255,0.08)',
            }}>
              {[
                { lbl: 'Clients', val: TODAY.clients },
                { lbl: 'Récompenses', val: TODAY.rewardsRedeemed },
                { lbl: 'Nouveaux', val: '+' + TODAY.newClients },
              ].map((s, i) => (
                <div key={i} style={{
                  paddingLeft: i === 0 ? 0 : 12,
                  borderLeft: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{s.lbl}</div>
                  <div className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginTop: 2, lineHeight: 1 }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* progress + rule */}
            <div style={{ marginTop: 12 }}>
              <div className="tier-bar">
                <i style={{ width: `${(TODAY.clients/20)*100}%` }} />
              </div>
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'rgba(255,255,255,0.55)' }}>
                <span>Règle&nbsp;: <span style={{ color: 'var(--gold-2)' }}>{MERCHANT.ruleLabel}</span></span>
                <span>Objectif · <span style={{ color: 'var(--gold-2)' }}>{TODAY.clients}/20</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="label-tag" style={{ marginBottom: 10 }}>Actions rapides</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ActionTile
              tone="dark"
              title="Attribuer"
              sub="Scanner client"
              Icon={IconScan}
              onClick={() => nav('scanner', { mode: 'award' })}
            />
            <ActionTile
              tone="gold"
              title="Valider"
              sub="Récompense"
              Icon={IconGift}
              onClick={() => nav('scanner', { mode: 'validate' })}
            />
            <ActionTile
              tone="cream"
              title="Nouveau client"
              sub="Inscrire en boutique"
              Icon={IconPlus}
              onClick={() => nav('newclient')}
            />
            <ActionTile
              tone="cream"
              title="Annuaire"
              sub={`${CLIENTS.length}+ clients`}
              Icon={IconUsers}
              onClick={() => nav('clients')}
            />
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div className="label-tag">Derniers mouvements</div>
            <span style={{ fontSize: 12.5, color: 'var(--green)', cursor: 'pointer', fontWeight: 600 }} onClick={() => nav('activity')}>
              Tout voir
            </span>
          </div>
          {FEED.slice(0, 4).map((f, i) => <ActivityRow key={i} item={f} />)}
        </div>
      </div>
    </>
  );
}

function ActionTile({ tone, title, sub, Icon, onClick }) {
  const tones = {
    dark:  { bg: 'var(--card)',    color: 'var(--cream)',  ic: 'var(--gold-2)' },
    gold:  { bg: 'var(--gold-bg)', color: 'var(--ink)',    ic: 'var(--gold-3)' },
    cream: { bg: 'var(--cream-2)', color: 'var(--ink)',    ic: 'var(--ink)' },
  }[tone];
  return (
    <div onClick={onClick} style={{
      background: tones.bg, color: tones.color,
      borderRadius: 18, padding: '14px 14px 14px',
      cursor: 'pointer',
      display: 'flex', flexDirection: 'column', gap: 10,
      minHeight: 92,
      transition: 'transform .08s ease',
    }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
       onMouseUp={(e) => e.currentTarget.style.transform = ''}
       onMouseLeave={(e) => e.currentTarget.style.transform = ''}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: tone === 'dark' ? 'rgba(255,255,255,0.08)' : tone === 'gold' ? '#fff' : '#fff',
        color: tones.ic,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.005 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.65, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

function ActivityRow({ item }) {
  if (item.type === 'award') {
    return (
      <div className="activity-row">
        <span className="activity-dot award" />
        <div className="activity-body">
          <div className="activity-title">{item.client} · {fmtN(item.amount)} FCFA</div>
          <div className="activity-meta">{item.meta} · {item.time}</div>
        </div>
        <div className="activity-amt award">+{item.points} pts</div>
      </div>
    );
  }
  if (item.type === 'redeem') {
    return (
      <div className="activity-row">
        <span className="activity-dot redeem" />
        <div className="activity-body">
          <div className="activity-title">{item.reward} · {item.client}</div>
          <div className="activity-meta">{item.meta} · {item.time}</div>
        </div>
        <div className="activity-amt redeem">{item.points} pts</div>
      </div>
    );
  }
  return (
    <div className="activity-row">
      <span className="activity-dot signup" />
      <div className="activity-body">
        <div className="activity-title">{item.client} · nouveau client</div>
        <div className="activity-meta">{item.meta} · {item.time}</div>
      </div>
      <div className="activity-amt signup">+50 pts</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   SCANNER
// ────────────────────────────────────────────────────────────────
function ScannerScreen({ nav, scanMode, setScanMode }) {
  return (
    <div className="pf-scroll" style={{
      background: 'var(--card)', color: 'var(--cream)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* top */}
      <div className="scr-top">
        <div className="scr-back dark" onClick={() => nav('home')}>
          <IconChevronLeft size={20} />
        </div>
        <div className="scr-title dark">Scanner</div>
        <div className="scr-back dark"><IconFlash size={18} /></div>
      </div>

      {/* segmented control */}
      <div style={{ padding: '4px 20px 10px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.08)', borderRadius: 14,
          padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr',
        }}>
          {[
            { id: 'award', label: 'Attribuer points' },
            { id: 'validate', label: 'Valider récompense' },
          ].map(m => (
            <button key={m.id} onClick={() => setScanMode(m.id)} style={{
              appearance: 'none', border: 0, cursor: 'pointer',
              background: scanMode === m.id ? 'var(--cream)' : 'transparent',
              color: scanMode === m.id ? 'var(--ink)' : 'rgba(255,255,255,0.7)',
              borderRadius: 11, padding: '10px 12px',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              transition: 'background .15s, color .15s',
            }}>{m.label}</button>
          ))}
        </div>
      </div>

      {/* viewfinder */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        gap: 24,
      }}>
        <div className="vf">
          <i /><i />
          {/* ghost QR cells inside the frame to suggest a target */}
          <div className="vf-ghost">
            {Array.from({ length: 49 }, (_, i) => {
              const seed = (i * 7 + 13) % 11;
              return <i key={i} style={{ opacity: seed > 5 ? 1 : 0 }} />;
            })}
          </div>
          <div className="vf-line" />
        </div>

        <div style={{ textAlign: 'center', maxWidth: 240 }}>
          <div className="serif" style={{ fontSize: 22, color: 'var(--gold-2)', lineHeight: 1.15 }}>
            {scanMode === 'award' ? 'Cible le QR client' : 'Cible le QR de récompense'}
          </div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 6, lineHeight: 1.5 }}>
            {scanMode === 'award'
              ? "Demande au client d'afficher son code « Mon QR » dans l'app Jubelee."
              : 'Le client présente un code de réclamation généré dans son app.'}
          </div>
        </div>

        {/* simulated detection */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="btn btn-gold"
            onClick={() => nav(scanMode === 'award' ? 'award' : 'validate', { client: CLIENTS[0] })}
            style={{ width: '100%', background: 'var(--gold-2)', color: 'var(--card)' }}
          >
            <IconQR size={18} /> Simuler une détection
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => nav('home')}
            style={{ width: '100%', borderColor: 'rgba(255,255,255,0.18)', color: 'var(--cream)' }}
          >
            Saisir le code manuellement
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   AWARD POINTS (after scan)
// ────────────────────────────────────────────────────────────────
function AwardScreen({ nav, client, amount, setAmount, onConfirm }) {
  const num = parseInt(amount || '0', 10);
  const pts = Math.floor(num / 100); // 1 pt / 100 FCFA
  const c = client || CLIENTS[0];

  const press = (k) => {
    setAmount(prev => {
      if (k === '⌫') return prev.slice(0, -1);
      if (k === '00') return (prev + '00').replace(/^0+/, '').slice(0, 7);
      const next = (prev + k).replace(/^0+/, '').slice(0, 7);
      return next;
    });
  };

  return (
    <div className="pf-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="scr-top">
        <div className="scr-back" onClick={() => nav('scanner')}><IconChevronLeft size={20} /></div>
        <div className="scr-title">Attribuer des points</div>
        <div className="scr-back" onClick={() => nav('home')}><IconClose size={18} /></div>
      </div>

      {/* customer card */}
      <div style={{ padding: '4px 16px 0' }}>
        <div className="card-cream" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={'avatar ' + c.tone} style={{ width: 44, height: 44, fontSize: 15 }}>{c.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</span>
              <span className="pill pill-gold" style={{ padding: '2px 8px' }}>{c.tier}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-mut)', marginTop: 2 }}>
              {fmtN(c.points)} pts · {c.visits} visites · dernière {c.last}
            </div>
          </div>
          <IconCheck size={18} color="var(--green)" />
        </div>
      </div>

      {/* amount entered */}
      <div style={{ padding: '24px 20px 4px', textAlign: 'center' }}>
        <div className="label-tag" style={{ marginBottom: 4 }}>Montant de l'achat</div>
        <div className="serif" style={{
          fontSize: 56, lineHeight: 1, color: 'var(--ink)',
          fontStyle: 'italic',
        }}>
          {fmtN(num) || '0'}<span style={{ fontSize: 22, color: 'var(--ink-mut)', marginLeft: 8, fontStyle: 'italic' }}>FCFA</span>
        </div>
        <div style={{ marginTop: 10 }}>
          <span className="pill" style={{
            background: pts > 0 ? 'var(--mint)' : 'var(--cream-2)',
            color: pts > 0 ? 'var(--green)' : 'var(--ink-mut)',
            padding: '6px 12px', fontSize: 12.5, whiteSpace: 'nowrap',
          }}>
            <b style={{ fontWeight: 600 }}>+{pts} pts</b> pour le client · règle {MERCHANT.ruleLabel}
          </span>
        </div>
      </div>

      {/* numpad */}
      <div style={{ padding: '8px 20px 12px' }}>
        <div className="keypad">
          {['1','2','3','4','5','6','7','8','9','00','0','⌫'].map(k => (
            <button key={k} onClick={() => press(k)} className={k === '⌫' ? 'muted' : ''}>
              {k === '⌫' ? <IconArrowDown size={20} stroke="currentColor" sw={1.75} /> : k}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 16px 16px' }}>
        <button
          className="btn btn-primary"
          disabled={pts === 0}
          onClick={onConfirm}
          style={{ width: '100%' }}
        >
          Attribuer {pts} point{pts > 1 ? 's' : ''}
          <IconChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   AWARD SUCCESS
// ────────────────────────────────────────────────────────────────
function AwardSuccessScreen({ nav, client, amount }) {
  const num = parseInt(amount || '0', 10);
  const pts = Math.floor(num / 100);
  const c = client || CLIENTS[0];
  return (
    <div className="pf-scroll" style={{
      background: 'var(--card)', color: 'var(--cream)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 24px 24px', gap: 22,
    }}>
      <div className="anim-pop" style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'var(--gold-2)', color: 'var(--card)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 14px rgba(212,174,108,0.18)',
      }}>
        <IconCheck size={48} sw={2.5} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div className="label-tag dark">Points attribués</div>
        <div className="serif" style={{ fontSize: 56, color: 'var(--gold-2)', lineHeight: 1, marginTop: 4 }}>
          +{pts}<span style={{ fontSize: 22, color: 'rgba(255,255,255,0.55)', marginLeft: 6, fontStyle: 'italic' }}>pts</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 8, maxWidth: 280 }}>
          {fmtN(num)} FCFA enregistrés pour <b style={{ color: 'var(--cream)' }}>{c.name}</b>.
        </div>
      </div>

      <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 16 }}>
        <div className="label-tag dark" style={{ marginBottom: 10 }}>Solde mis à jour</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Avant</div>
            <div className="serif" style={{ fontSize: 22, color: 'var(--cream)' }}>{fmtN(c.points)}</div>
          </div>
          <IconChevronRight size={18} color="var(--gold-2)" />
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Après</div>
            <div className="serif" style={{ fontSize: 22, color: 'var(--gold-2)' }}>{fmtN(c.points + pts)}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Palier</div>
            <div className="serif" style={{ fontSize: 22, color: 'var(--gold-2)' }}>{c.tier}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 'auto' }}>
        <button className="btn btn-gold" onClick={() => nav('scanner', { mode: 'award' })}
          style={{ width: '100%', background: 'var(--gold-2)', color: 'var(--card)' }}>
          Scanner un autre client
        </button>
        <button className="btn btn-ghost" onClick={() => nav('home')}
          style={{ width: '100%', borderColor: 'rgba(255,255,255,0.18)', color: 'var(--cream)' }}>
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   VALIDATE REWARD
// ────────────────────────────────────────────────────────────────
function ValidateScreen({ nav, onConfirm }) {
  const c = PENDING_REWARD.client;
  return (
    <div className="pf-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="scr-top">
        <div className="scr-back" onClick={() => nav('scanner')}><IconChevronLeft size={20} /></div>
        <div className="scr-title">Valider la récompense</div>
        <div className="scr-back" onClick={() => nav('home')}><IconClose size={18} /></div>
      </div>

      <div style={{ padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* the reward card */}
        <div className="card-dark" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="label-tag dark">Récompense à remettre</div>
            <span className="pill" style={{ background: 'rgba(212,174,108,0.15)', color: 'var(--gold-2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <IconClock size={11} /> {PENDING_REWARD.expires}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
            <div style={{
              width: 58, height: 58, borderRadius: 16,
              background: 'var(--mint)', color: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconCoffee size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 26, color: 'var(--cream)', lineHeight: 1.1 }}>
                {PENDING_REWARD.reward}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                Coût · <span style={{ color: 'var(--gold-2)' }}>{PENDING_REWARD.cost} pts</span>
              </div>
            </div>
          </div>
          <div style={{
            marginTop: 16, padding: '12px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,0.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 13, letterSpacing: '0.08em',
            color: 'var(--gold-2)',
          }}>
            <span>{PENDING_REWARD.code}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', fontFamily: 'Inter' }}>
              Code unique · à cramer
            </span>
          </div>
        </div>

        {/* customer */}
        <div className="card-cream" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={'avatar ' + c.tone}>{c.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-mut)', marginTop: 2 }}>
              {fmtN(c.points)} pts · membre {c.tier}
            </div>
          </div>
          <div style={{
            padding: '6px 10px', borderRadius: 10, background: '#fff', border: '1px solid rgba(26,24,20,0.08)',
            fontSize: 11.5, color: 'var(--ink-mut)',
          }}>
            Vérifié <IconCheck size={11} stroke="var(--green)" sw={2.4} />
          </div>
        </div>

        {/* note */}
        <div style={{
          padding: '10px 14px', borderRadius: 12,
          background: 'var(--cream-2)', display: 'flex', gap: 10, alignItems: 'flex-start',
          fontSize: 12.5, color: 'var(--ink-mut)', lineHeight: 1.45,
        }}>
          <IconShield size={16} stroke="var(--gold-3)" />
          <span>Une fois cramé, ce code ne pourra plus être réutilisé. Confirme uniquement après remise du produit au client.</span>
        </div>

        {/* actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <button className="btn btn-primary" onClick={onConfirm} style={{ width: '100%' }}>
            <IconCheck size={18} /> Cramer & remettre la récompense
          </button>
          <button className="btn btn-ghost" onClick={() => nav('scanner', { mode: 'validate' })} style={{ width: '100%' }}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   VALIDATE SUCCESS
// ────────────────────────────────────────────────────────────────
function ValidateSuccessScreen({ nav }) {
  const c = PENDING_REWARD.client;
  return (
    <div className="pf-scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 24px', gap: 22 }}>
      <div className="anim-pop" style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'var(--mint)', color: 'var(--green)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 14px rgba(212,234,223,0.6)',
      }}>
        <IconCheck size={48} sw={2.5} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div className="label-tag" style={{ color: 'var(--green)' }}>Code cramé · récompense remise</div>
        <div className="serif" style={{ fontSize: 36, color: 'var(--ink)', lineHeight: 1.05, marginTop: 6 }}>
          {PENDING_REWARD.reward}
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-mut)', marginTop: 8 }}>
          Remise à <b style={{ color: 'var(--ink)' }}>{c.name}</b> · {PENDING_REWARD.cost} pts déduits.
        </div>
      </div>

      <div className="card-cream" style={{ width: '100%' }}>
        <div className="label-tag" style={{ marginBottom: 10 }}>Reçu</div>
        <Row k="Récompense" v={PENDING_REWARD.reward} />
        <Row k="Client" v={c.name} />
        <Row k="Coût" v={`${PENDING_REWARD.cost} pts`} />
        <Row k="Code" v={PENDING_REWARD.code} mono />
        <Row k="Validé par" v={STAFF.name} last />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 'auto' }}>
        <button className="btn btn-primary" onClick={() => nav('scanner', { mode: 'validate' })} style={{ width: '100%' }}>
          Valider une autre récompense
        </button>
        <button className="btn btn-ghost" onClick={() => nav('home')} style={{ width: '100%' }}>
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

function Row({ k, v, mono, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0',
      borderBottom: last ? 'none' : '0.5px solid rgba(26,24,20,0.08)',
      fontSize: 13.5,
    }}>
      <span style={{ color: 'var(--ink-mut)' }}>{k}</span>
      <span className={mono ? 'mono' : ''} style={{ color: 'var(--ink)', fontWeight: mono ? 500 : 600 }}>{v}</span>
    </div>
  );
}

Object.assign(window, {
  MERCHANT, STAFF, TODAY, CLIENTS, FEED, PENDING_REWARD,
  fmtN, tierColor, greeting, QRGlyph, Row,
  TabBar, HomeScreen, ScannerScreen, AwardScreen, AwardSuccessScreen,
  ValidateScreen, ValidateSuccessScreen, ActivityRow,
});
