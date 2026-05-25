// customer-screens.jsx — Jubelee customer PWA
// Screens: Wallet (recreate from screenshot), WalletDetail, Map, LockScreen push, Customer TabBar

// ────────────────────────────────────────────────────────────────
//   Mock data
// ────────────────────────────────────────────────────────────────
const ME = {
  name: 'Ama Mbarga',
  initials: 'AM',
  upper: 'AMA MBARGA',
  points: 2840,
  tier: 'Or',
};

const STORES = [
  { id: 'cm', name: 'Chez Mama',     type: 'Restaurant',   area: 'Akwa, Douala',     initials: 'CM', tone: 'gold',   pts: 2840, tier: 'Or',     enrolled: true,  reward: 'Café offert', distance: '120 m' },
  { id: 'px', name: 'PharmExpress',  type: 'Pharmacie',    area: 'Bonapriso',        initials: 'PX', tone: 'silver', pts: 640,  tier: 'Argent', enrolled: true,  reward: '5% sur ordonnance', distance: '340 m' },
  { id: 'ld', name: 'Le Délice',     type: 'Pâtisserie',   area: 'Bonanjo',          initials: 'LD', tone: 'rose',   pts: 0,    tier: null,     enrolled: false, reward: '1 viennoiserie · 100 pts', distance: '210 m' },
  { id: 'bn', name: 'Bonny Café',    type: 'Café',         area: 'Akwa Nord',        initials: 'BC', tone: 'olive',  pts: 0,    tier: null,     enrolled: false, reward: 'Café gratuit · 80 pts', distance: '420 m' },
  { id: 'bl', name: 'Boutique Lune', type: 'Mode',         area: 'Akwa, Douala',     initials: 'BL', tone: 'blue',   pts: 0,    tier: null,     enrolled: false, reward: '-20% nouveau client', distance: '560 m', sponsored: true },
  { id: 'mt', name: 'Mont-Plaza',    type: 'Supermarché',  area: 'Bonamoussadi',     initials: 'MP', tone: 'green',  pts: 380,  tier: 'Bronze', enrolled: true,  reward: 'Cabas offert · 500 pts', distance: '1.2 km' },
];

const PROGRAMS = STORES.filter(s => s.enrolled);

const MOVES = [
  { type: 'award',  label: 'Déjeuner · Chez Mama',        meta: "Auj. 12:35 · Table 4", points: 120 },
  { type: 'redeem', label: 'Café offert réclamé',         meta: 'Hier 08:10 · Chez Mama', points: -200 },
  { type: 'award',  label: 'Médicaments · PharmExpress',  meta: 'Lun. 21 avr.', points: 60 },
  { type: 'award',  label: 'Dîner · Chez Mama',           meta: 'Dim. 20 avr.', points: 95 },
  { type: 'signup', label: 'Inscription · Mont-Plaza',    meta: 'Sam. 19 avr.', points: 50 },
];

const NOTIFS = [
  {
    id: 'n1', type: 'proximity',  sponsored: true, store: STORES[0],
    when: 'à l\'instant', title: 'Tu passes devant Chez Mama',
    body: 'Café offert ce soir pour les membres Or · jusqu\'à 22h.',
    cta: 'Voir la récompense', icon: 'coffee',
  },
  {
    id: 'n2', type: 'reward', sponsored: false, store: STORES[1],
    when: 'il y a 2 h', title: 'Nouvelle récompense disponible',
    body: 'PharmExpress vient d\'ajouter "Pack vitamines" à 800 pts.',
    cta: 'Découvrir', icon: 'gift',
  },
  {
    id: 'n3', type: 'event', sponsored: true, store: STORES[4],
    when: 'il y a 5 h', title: 'Soirée VIP · Boutique Lune',
    body: 'Vendredi 26 avril · -30% sur la nouvelle collection. Réservé aux membres.',
    cta: 'Je viens', icon: 'calendar',
  },
  {
    id: 'n4', type: 'product', sponsored: false, store: STORES[5],
    when: 'hier 14:02', title: 'Nouveau chez Mont-Plaza',
    body: '12 nouvelles références bio en rayon — gagne x2 points cette semaine.',
    cta: 'En savoir plus', icon: 'sparkle',
  },
  {
    id: 'n5', type: 'tier', sponsored: false, store: STORES[0],
    when: 'lun. 21 avr.', title: 'Plus que 160 points pour Platine',
    body: 'Continue à fréquenter Chez Mama pour débloquer le menu VIP Platine.',
    cta: 'Voir ma carte', icon: 'sparkle',
  },
];

// ────────────────────────────────────────────────────────────────
//   helpers
// ────────────────────────────────────────────────────────────────
const fmt = (n) => n.toLocaleString('fr-FR').replace(/,/g, ' ');
const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

// Static QR-ish glyph
function QRGlyphSmall() {
  return (
    <div style={{
      width: 56, height: 56, background: '#fff', borderRadius: 12,
      padding: 6, display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(7, 1fr)', gap: 1.5,
    }}>
      {Array.from({ length: 49 }, (_, i) => {
        const s = (i * 7 + 13) % 11;
        return <i key={i} style={{ background: s > 4 ? 'var(--card)' : 'transparent', borderRadius: 1 }} />;
      })}
    </div>
  );
}

function QRGlyphLarge() {
  return (
    <div style={{
      width: 84, height: 84, background: '#fff', borderRadius: 16,
      padding: 8, display: 'grid',
      gridTemplateColumns: 'repeat(9, 1fr)', gridTemplateRows: 'repeat(9, 1fr)', gap: 1.5,
    }}>
      {Array.from({ length: 81 }, (_, i) => {
        const s = (i * 7 + 13) % 11;
        return <i key={i} style={{ background: s > 4 ? 'var(--card)' : 'transparent', borderRadius: 1 }} />;
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   Customer Tab Bar (5 tabs, center FAB = Scan)
// ────────────────────────────────────────────────────────────────
function CTabBar({ active, onTab, onScan }) {
  const items = [
    { id: 'wallet',  label: 'Wallet', Icon: IconWallet },
    { id: 'primes',  label: 'Primes', Icon: IconGift },
    { id: 'scan',    label: 'Scan',   Icon: IconQR, fab: true },
    { id: 'map',     label: 'Carte',  Icon: IconMap },
    { id: 'profile', label: 'Profil', Icon: IconAccount },
  ];
  return (
    <div className="ctabbar">
      {items.map(({ id, label, Icon, fab }) => fab ? (
        <div key={id} style={{ position: 'relative' }}>
          <div className="ctab-fab" onClick={onScan}><Icon size={28} /></div>
          <div className="ctab-fab-label">{label}</div>
        </div>
      ) : (
        <div key={id} className="ctab" data-active={active === id} onClick={() => onTab(id)}>
          <Icon size={22} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   WALLET (recreated from the customer PWA screenshot)
// ────────────────────────────────────────────────────────────────
function WalletScreen({ nav }) {
  return (
    <div className="pf-scroll">
      {/* header */}
      <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Wordmark size={18} />
        <div style={{ display: 'flex', gap: 8 }}>
          <IconButton Icon={IconSearch} />
          <IconButton Icon={IconBell} dot />
          <IconButton Icon={IconAccount} onClick={() => nav('profile')} />
        </div>
      </div>

      {/* greeting */}
      <div style={{ padding: '18px 20px 12px' }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink-mut)' }}>{greet()},</div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.02, marginTop: 2, color: 'var(--ink)' }}>
          {ME.name}
        </div>
      </div>

      {/* hero loyalty card */}
      <div style={{ padding: '0 16px' }}>
        <LoyaltyCard onTapQR={() => nav('myqr')} />
      </div>

      {/* carousel dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 12 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: i === 0 ? 18 : 6, height: 6, borderRadius: 3,
            background: i === 0 ? 'var(--green)' : 'rgba(26,24,20,0.2)',
            transition: 'width .2s',
          }} />
        ))}
      </div>

      {/* action tiles */}
      <div style={{ padding: '18px 16px 4px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <ActionTileSmall Icon={IconQR}        label="Mon QR"     active onClick={() => nav('myqr')} />
        <ActionTileSmall Icon={IconGift}      label="Récompenses" onClick={() => nav('primes')} />
        <ActionTileSmall Icon={IconReceipt}   label="Historique" />
        <ActionTileSmall Icon={IconStore}     label="Enseignes"  onClick={() => nav('map')} />
      </div>

      {/* MES PROGRAMMES */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="label-tag">Mes programmes</div>
        <span style={{ fontSize: 12.5, color: 'var(--green)', fontWeight: 600, cursor: 'pointer' }}>Tout voir</span>
      </div>
      <div style={{ padding: '8px 16px 4px', display: 'flex', gap: 10, overflowX: 'auto' }}>
        {PROGRAMS.map(s => <ProgramCard key={s.id} store={s} onClick={() => nav('walletdetail', { store: s })} />)}
      </div>

      {/* DERNIERS MOUVEMENTS */}
      <div style={{ padding: '20px 20px 0' }}>
        <div className="label-tag">Derniers mouvements</div>
        <div style={{ marginTop: 6 }}>
          {MOVES.slice(0, 4).map((m, i) => <MoveRow key={i} m={m} />)}
        </div>
      </div>
    </div>
  );
}

function IconButton({ Icon, dot, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 38, height: 38, borderRadius: '50%',
      background: 'var(--cream-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', position: 'relative',
    }}>
      <Icon size={18} />
      {dot && <span style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />}
    </div>
  );
}

function ActionTileSmall({ Icon, label, active, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: active ? 'var(--green-d)' : 'var(--cream-2)',
        color: active ? 'var(--gold-2)' : 'var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform .08s',
      }}>
        <Icon size={22} />
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink)' }}>{label}</span>
    </div>
  );
}

function LoyaltyCard({ onTapQR }) {
  return (
    <div className="card-dark" style={{ padding: 18, position: 'relative' }}>
      {/* top row: brand + tier pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark size={16} color="var(--cream)" />
        <span className="pill pill-dark" style={{ background: 'rgba(212,174,108,0.15)', color: 'var(--gold-2)' }}>
          Palier {ME.tier}
        </span>
      </div>

      {/* body: QR + meta */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'flex-start' }}>
        <div onClick={onTapQR} style={{ cursor: 'pointer' }}>
          <QRGlyphLarge />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', fontWeight: 600 }}>PALIER FIDÉLITÉ</div>
          <div style={{ fontSize: 14, color: 'var(--gold-2)', fontWeight: 600, letterSpacing: '0.1em', marginTop: 2 }}>GOLD MEMBER</div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="serif" style={{ fontSize: 38, color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.01em' }}>
              {fmt(ME.points)}
            </span>
            <span className="serif" style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>pts</span>
          </div>
        </div>
      </div>

      {/* cardholder row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
        <div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', fontWeight: 600 }}>CARDHOLDER</div>
          <div style={{ fontSize: 14, color: 'var(--cream)', letterSpacing: '0.08em', marginTop: 2, fontWeight: 600 }}>{ME.upper}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 28, borderRadius: 6, background: 'var(--gold-3)', color: 'var(--card)',
        }}>
          <svg width="22" height="16" viewBox="0 0 22 16" fill="currentColor"><rect x="0" y="0" width="22" height="6" rx="1"/><rect x="0" y="9" width="10" height="7" rx="1"/><rect x="12" y="9" width="10" height="7" rx="1"/></svg>
        </div>
      </div>

      {/* tier scale */}
      <div style={{ marginTop: 14 }}>
        <div className="tier-bar" style={{ background: 'rgba(255,255,255,0.10)' }}>
          <i style={{ width: '72%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, fontWeight: 500 }}>
          <span style={{ color: '#87613a' }}>Bronze</span>
          <span style={{ color: '#a6a094' }}>Argent</span>
          <span style={{ color: 'var(--gold-2)' }}>Or</span>
          <span style={{ color: 'rgba(255,255,255,0.45)' }}>Platine</span>
        </div>
      </div>
    </div>
  );
}

function ProgramCard({ store, onClick }) {
  const dark = store.id === 'cm' || store.id === 'mt';
  return (
    <div onClick={onClick} style={{
      flex: '0 0 200px',
      background: dark ? 'var(--card)' : '#4a4632',
      color: 'var(--cream)',
      borderRadius: 18, padding: 14,
      cursor: 'pointer',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className={'avatar ' + store.tone} style={{ width: 26, height: 26, borderRadius: 8, fontSize: 10, background: 'rgba(212,174,108,0.18)', color: 'var(--gold-2)' }}>
          {store.initials}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{store.name}</span>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span className="serif" style={{ fontSize: 30, color: 'var(--gold-2)', lineHeight: 1 }}>{fmt(store.pts)}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>pts</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <span className="pill" style={{
          background: 'rgba(212,174,108,0.15)', color: 'var(--gold-2)',
          padding: '2px 8px', fontSize: 10, letterSpacing: '0.04em',
        }}>{store.tier}</span>
      </div>
      <div className="tier-bar" style={{ marginTop: 10, background: 'rgba(255,255,255,0.10)' }}>
        <i style={{ width: store.tier === 'Or' ? '72%' : store.tier === 'Argent' ? '46%' : '24%' }} />
      </div>
    </div>
  );
}

function MoveRow({ m }) {
  const dotColor = m.type === 'award' ? 'var(--green)' : m.type === 'redeem' ? 'var(--gold)' : 'var(--rose)';
  const amtColor = m.type === 'award' ? 'var(--green)' : m.type === 'redeem' ? 'var(--gold-3)' : 'var(--ink)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0', borderBottom: '0.5px solid rgba(26,24,20,0.06)',
    }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: dotColor, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{m.label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-mut)', marginTop: 2 }}>{m.meta}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: amtColor }}>
        {m.points > 0 ? '+' : ''}{m.points} pts
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   WALLET DETAIL (single store — Chez Mama view)
// ────────────────────────────────────────────────────────────────
function WalletDetailScreen({ nav, store }) {
  const s = store || STORES[0];
  return (
    <div className="pf-scroll">
      {/* dark merchant header */}
      <div style={{ background: 'var(--card)', padding: '12px 20px 16px', color: 'var(--cream)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={() => nav('wallet')} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: 14,
          }}>
            <IconChevronLeft size={18} />
            <span>Mon wallet</span>
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={'avatar ' + s.tone} style={{
            width: 46, height: 46, borderRadius: 14, fontSize: 14,
            background: 'rgba(212,174,108,0.18)', color: 'var(--gold-2)',
          }}>{s.initials}</div>
          <div style={{ flex: 1 }}>
            <div className="serif" style={{ fontSize: 26, color: 'var(--cream)', lineHeight: 1.1 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{s.type} · {s.area}</div>
          </div>
          <span className="pill" style={{
            background: 'rgba(212,174,108,0.15)', color: 'var(--gold-2)',
            padding: '4px 10px',
          }}>{s.tier}</span>
        </div>
      </div>

      {/* store-specific loyalty card */}
      <div style={{ padding: '14px 16px 0' }}>
        <div className="card-dark" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Wordmark size={16} color="var(--cream)" />
            <span className="pill pill-dark">Palier {s.tier}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, alignItems: 'flex-start' }}>
            <QRGlyphLarge />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', fontWeight: 600 }}>PALIER FIDÉLITÉ</div>
              <div style={{ fontSize: 14, color: 'var(--gold-2)', fontWeight: 600, letterSpacing: '0.1em', marginTop: 2 }}>GOLD MEMBER</div>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="serif" style={{ fontSize: 36, color: 'var(--cream)', lineHeight: 1 }}>{fmt(s.pts)}</span>
                <span className="serif" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>pts</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>Scan to earn &amp; redeem points</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', fontWeight: 600 }}>CARDHOLDER</div>
              <div style={{ fontSize: 13, color: 'var(--cream)', letterSpacing: '0.08em', marginTop: 2, fontWeight: 600 }}>{ME.upper}</div>
            </div>
            <div style={{
              width: 32, height: 24, borderRadius: 6, background: 'var(--gold-3)', color: 'var(--card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="14" viewBox="0 0 22 16" fill="currentColor"><rect x="0" y="0" width="22" height="6" rx="1"/><rect x="0" y="9" width="10" height="7" rx="1"/><rect x="12" y="9" width="10" height="7" rx="1"/></svg>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="tier-bar"><i style={{ width: '72%' }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, fontWeight: 500 }}>
              <span style={{ color: '#87613a' }}>Bronze</span>
              <span style={{ color: '#a6a094' }}>Argent</span>
              <span style={{ color: 'var(--gold-2)' }}>Or</span>
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>Platine</span>
            </div>
          </div>
        </div>
      </div>

      {/* rewards */}
      <div style={{ padding: '20px 16px 14px' }}>
        <div className="label-tag" style={{ marginBottom: 10 }}>Récompenses disponibles</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <RewardRow icon={IconCoffee} title="Café offert"  meta="200 pts · disponible" cta="Réclamer" onClick={() => nav('claimreward', { store: s, reward: { title: 'Café offert', cost: 200, icon: IconCoffee } })} />
          <RewardRow icon={IconGift}   title="Repas offert" meta="850 pts · disponible" cta="Réclamer" onClick={() => nav('claimreward', { store: s, reward: { title: 'Repas offert', cost: 850, icon: IconGift } })} />
          <RewardRow icon={IconStar}   title="Menu VIP Platine" meta="2 000 pts · palier Platine" cta="Bloqué" locked />
        </div>
      </div>
    </div>
  );
}

function RewardRow({ icon: Icon, title, meta, cta, locked, onClick }) {
  return (
    <div className={'reward-row' + (locked ? ' locked' : '')}>
      <div className="ico"><Icon size={20} /></div>
      <div className="body">
        <div className="t">{title}</div>
        <div className="s">{meta}</div>
      </div>
      <div className="cta" onClick={locked ? undefined : onClick}>{cta}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   MAP — nearby registered stores
// ────────────────────────────────────────────────────────────────
function MapScreen({ nav, filterIdx = 0, setFilterIdx }) {
  const [selected, setSelected] = React.useState('cm');
  const FILTERS = ['Toutes', 'Inscrites', 'Restaurants', 'Pharmacie', 'Café', 'Mode'];

  // pin positions in % — kept between the top search bar (~20%) and the bottom sheet (~54%),
  // and away from the legend (top-right ~20-30%)
  const pins = [
    { ...STORES[0], x: 48, y: 32 },  // Chez Mama (gold) center-ish
    { ...STORES[1], x: 22, y: 26 },  // PharmExpress (gold)
    { ...STORES[2], x: 78, y: 40 },  // Le Délice (dark) — below legend
    { ...STORES[3], x: 30, y: 22 },  // Bonny Café (dark)
    { ...STORES[4], x: 60, y: 40 },  // Boutique Lune (sponsored/rose)
    { ...STORES[5], x: 14, y: 40 },  // Mont-Plaza (gold)
  ];

  return (
    <div className="pf-screen" style={{ position: 'relative' }}>
      {/* MAP background */}
      <div className="map-bg">
        <MapIllustration />
        {/* me dot */}
        <div className="me-dot" style={{ left: '44%', top: '48%' }} />
        {/* pins */}
        {pins.map(p => (
          <div key={p.id}
               className={'map-pin ' + (p.sponsored ? 'suggested' : p.enrolled ? 'active' : 'inactive')}
               style={{ left: `${p.x}%`, top: `${p.y}%` }}
               onClick={() => setSelected(p.id)}>
            <div className="head"><IconStore size={16} /></div>
            <div className="shadow" />
            {p.enrolled && <span className="badge">+{p.pts > 999 ? Math.round(p.pts/1000) + 'k' : p.pts} pts</span>}
            {p.sponsored && !p.enrolled && <span className="badge" style={{ background: '#b85a39', color: '#fff' }}>Promo</span>}
          </div>
        ))}
      </div>

      {/* top floating bar */}
      <div style={{
        position: 'absolute', top: 8, left: 0, right: 0, zIndex: 10,
        padding: '4px 16px 0',
      }}>
        <div style={{
          background: 'rgba(246,244,239,0.96)',
          backdrop: 'blur(20px) saturate(160%)',
          backdropFilter: 'blur(20px) saturate(160%)',
          borderRadius: 18,
          padding: 8,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 6px 18px rgba(26,24,20,0.10), 0 0 0 1px rgba(26,24,20,0.04)',
        }}>
          <div onClick={() => nav('wallet')} style={{
            width: 34, height: 34, borderRadius: 10, background: 'var(--cream-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <IconChevronLeft size={18} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconSearch size={16} stroke="var(--ink-mut)" />
            <span style={{ fontSize: 13, color: 'var(--ink-mut)' }}>Rechercher une enseigne…</span>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: 'var(--card)', color: 'var(--gold-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <IconCompass size={16} />
          </div>
        </div>

        {/* filter chips */}
        <div style={{
          marginTop: 8, display: 'flex', gap: 6, overflowX: 'auto',
          paddingBottom: 2,
        }}>
          {FILTERS.map((f, i) => (
            <button key={f} onClick={() => setFilterIdx && setFilterIdx(i)} style={{
              appearance: 'none', border: 0, cursor: 'pointer',
              padding: '7px 12px', borderRadius: 999,
              background: i === filterIdx ? 'var(--card)' : 'rgba(246,244,239,0.96)',
              color: i === filterIdx ? 'var(--cream)' : 'var(--ink)',
              fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
              whiteSpace: 'nowrap', flexShrink: 0,
              boxShadow: i === filterIdx ? 'none' : '0 2px 6px rgba(26,24,20,0.08)',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* legend pill */}
      <div style={{
        position: 'absolute', top: 138, right: 16, zIndex: 5,
        background: 'rgba(246,244,239,0.96)',
        backdropFilter: 'blur(16px)',
        borderRadius: 14, padding: '10px 12px',
        boxShadow: '0 6px 16px rgba(26,24,20,0.10)',
        display: 'flex', flexDirection: 'column', gap: 6,
        fontSize: 11, color: 'var(--ink)',
      }}>
        <LegendDot color="var(--gold)" label="Mes enseignes" />
        <LegendDot color="var(--card)" label="À découvrir" />
        <LegendDot color="var(--rose)" label="Promos" />
      </div>

      {/* bottom sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--cream)',
        borderTopLeftRadius: 26, borderTopRightRadius: 26,
        boxShadow: '0 -10px 28px rgba(26,24,20,0.10)',
        zIndex: 8,
        maxHeight: '46%',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(26,24,20,0.15)' }} />
        </div>
        <div style={{ padding: '8px 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="label-tag">À proximité · 1.2 km</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 1 }}>{pins.length} enseignes Jubelee</div>
          </div>
          <span className="pill pill-cream"><IconPin size={11} /> Akwa, Douala</span>
        </div>

        <div style={{ padding: '6px 16px 18px', overflowY: 'auto' }}>
          {pins.map(p => (
            <StoreRow key={p.id} s={p}
              selected={selected === p.id}
              onClick={() => { setSelected(p.id); }}
              onCta={() => nav(p.enrolled ? 'walletdetail' : 'joinsheet', { store: p })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, border: '1.5px solid #fff', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.1)' }} />
      <span>{label}</span>
    </div>
  );
}

function StoreRow({ s, selected, onClick, onCta }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 4px',
      borderBottom: '0.5px solid rgba(26,24,20,0.06)',
      cursor: 'pointer',
    }}>
      <div className={'avatar ' + s.tone}>{s.initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
          {s.sponsored && <span className="pill pill-sponsored" style={{ padding: '1px 6px', fontSize: 9, letterSpacing: '0.04em' }}>Sponso</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-mut)', marginTop: 1 }}>
          {s.type} · {s.distance}
        </div>
        <div style={{ fontSize: 11.5, color: s.enrolled ? 'var(--green)' : 'var(--gold-3)', marginTop: 3, fontWeight: 500 }}>
          {s.enrolled ? `${fmt(s.pts)} pts · ${s.tier}` : s.reward}
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onCta(); }} style={{
        appearance: 'none', border: 0, cursor: 'pointer',
        padding: '8px 12px', borderRadius: 999,
        background: s.enrolled ? 'var(--cream-2)' : 'var(--card)',
        color: s.enrolled ? 'var(--ink)' : 'var(--cream)',
        fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>{s.enrolled ? 'Carte' : 'Rejoindre'}</button>
    </div>
  );
}

// Decorative SVG map illustration — abstract paper-map feel
function MapIllustration() {
  return (
    <svg className="map-svg" viewBox="0 0 380 740" preserveAspectRatio="xMidYMid slice">
      {/* parks & water */}
      <path d="M -10 -10 Q 80 60 60 180 T 30 320 L -10 340 Z" fill="var(--map-park)" opacity="0.7" />
      <ellipse cx="320" cy="120" rx="80" ry="50" fill="var(--map-water)" opacity="0.5" />
      <path d="M 380 540 Q 320 580 260 560 T 200 620 L 200 740 L 380 740 Z" fill="var(--map-water)" opacity="0.4" />

      {/* blocks */}
      {[
        [80, 120, 60, 70], [150, 110, 80, 60], [240, 160, 60, 80],
        [60, 220, 90, 60], [170, 200, 70, 80], [260, 250, 70, 60],
        [90, 320, 70, 80], [180, 320, 90, 70], [290, 340, 60, 70],
        [60, 430, 80, 70], [160, 420, 80, 80], [270, 440, 70, 60],
        [80, 540, 90, 60], [200, 530, 80, 70], [300, 540, 50, 60],
        [60, 640, 80, 70], [170, 640, 90, 60], [290, 640, 60, 70],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="var(--map-block)" />
      ))}

      {/* roads — horizontal */}
      {[100, 200, 300, 400, 510, 620].map((y, i) => (
        <line key={'h'+i} x1="0" y1={y} x2="380" y2={y} stroke="#d4ccba" strokeWidth="14" />
      ))}
      {/* roads — vertical */}
      {[60, 160, 260, 340].map((x, i) => (
        <line key={'v'+i} x1={x} y1="0" x2={x} y2="740" stroke="#d4ccba" strokeWidth="14" />
      ))}

      {/* main avenue diagonal */}
      <path d="M 0 0 L 380 740" stroke="#cbc1ad" strokeWidth="18" opacity="0.5" />

      {/* street labels */}
      <text x="180" y="106" fill="#a6a094" fontSize="9" fontFamily="Inter" letterSpacing="0.12em">RUE BONABERI</text>
      <text x="32" y="396" fill="#a6a094" fontSize="9" fontFamily="Inter" letterSpacing="0.12em" transform="rotate(-90 32 396)">AV. DE GAULLE</text>
      <text x="160" y="506" fill="#a6a094" fontSize="9" fontFamily="Inter" letterSpacing="0.12em">BD DE LA LIBERTÉ</text>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────
//   LOCK SCREEN with push notification (sponsored)
// ────────────────────────────────────────────────────────────────
function LockScreenNotif({ statusTime = '13:15' }) {
  return (
    <div className="lockscreen">
      {/* status bar overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '0 26px',
        height: 38, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: '#fff', fontSize: 14, fontWeight: 600, zIndex: 2,
      }}>
        <span>{statusTime}</span>
        <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
          {[0.3, 0.55, 0.75, 1].map((o, i) => (
            <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', opacity: o }} />
          ))}
        </span>
      </div>

      <div style={{ position: 'relative', zIndex: 2, padding: '70px 24px 30px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="lock-time">13:15</div>
        <div className="lock-date">mardi 23 avril</div>

        <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* primary sponsored notif */}
          <div className="lock-notif">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7, background: 'rgba(212,174,108,0.18)', color: 'var(--gold-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LogoMark size={14} gold="#d4ae6c" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.9 }}>Jubelee</span>
              <span className="pill pill-sponsored" style={{ marginLeft: 'auto', padding: '1px 6px', fontSize: 9, background: 'rgba(217,119,87,0.25)', color: '#f4d0bd' }}>Sponsorisé</span>
              <span style={{ fontSize: 11, opacity: 0.6 }}>maintenant</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
              Tu passes devant <span className="serif" style={{ color: 'var(--gold-2)', fontStyle: 'italic' }}>Chez Mama</span>
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.45, marginTop: 4 }}>
              Café offert ce soir pour les membres Or · jusqu'à 22h ✦
            </div>
          </div>

          {/* secondary */}
          <div className="lock-notif" style={{ background: 'rgba(255,255,255,0.06)', opacity: 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconBell size={12} />
              </div>
              <span style={{ fontSize: 11.5, opacity: 0.9 }}>Jubelee</span>
              <span style={{ marginLeft: 'auto', fontSize: 10.5, opacity: 0.55 }}>il y a 2 h</span>
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.9 }}>
              Nouvelle récompense PharmExpress · Pack vitamines à 800 pts
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.7)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconFlash size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 96, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.4)' }} />
            <div style={{ fontSize: 11 }}>Balayer pour ouvrir</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconQR size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ME, STORES, PROGRAMS, MOVES, NOTIFS, fmt, greet,
  CTabBar, WalletScreen, WalletDetailScreen, MapScreen, LockScreenNotif,
  QRGlyphSmall, QRGlyphLarge, LoyaltyCard, RewardRow, StoreRow,
});
