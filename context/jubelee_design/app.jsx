// app.jsx — composes the staff app prototype: canvas + phones + tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "duo",
  "accent": "gold",
  "statusTime": "13:15",
  "showJumper": true,
  "leftScreen": "home",
  "rightScreen": "scanner",
  "tabStyle": "fab",
  "bgTone": "cream"
}/*EDITMODE-END*/;

// ────────────────────────────────────────────────────────────────
//   PhoneApp — one self-contained interactive phone
// ────────────────────────────────────────────────────────────────
function PhoneApp({ initialScreen = 'home', initialScanMode = 'award', statusTime = '13:15', label }) {
  const [screen, setScreen] = React.useState(initialScreen);
  const [scanMode, setScanMode] = React.useState(initialScanMode);
  const [client, setClient] = React.useState(null);
  const [amount, setAmount] = React.useState(initialScreen === 'award' ? '1200' : '');

  const nav = (s, params = {}) => {
    if (params.client !== undefined) setClient(params.client);
    if (params.mode) setScanMode(params.mode);
    if (s === 'award') {
      // when arriving from a scanner, prefill a realistic amount the first time
      setAmount(prev => prev || '1200');
    }
    if (s === 'home' && screen === 'awardSuccess') {
      // wipe transient amount after closing the success
      setAmount('');
    }
    setScreen(s);
  };

  // dark status bar bg colors on dark screens
  const isDark = ['scanner', 'awardSuccess'].includes(screen);
  const headerBg = isDark ? 'var(--card)' : 'var(--cream)';

  let body;
  switch (screen) {
    case 'home':            body = <HomeScreen nav={nav} />; break;
    case 'scanner':         body = <ScannerScreen nav={nav} scanMode={scanMode} setScanMode={setScanMode} />; break;
    case 'award':           body = <AwardScreen nav={nav} client={client || CLIENTS[0]} amount={amount} setAmount={setAmount} onConfirm={() => nav('awardSuccess')} />; break;
    case 'awardSuccess':    body = <AwardSuccessScreen nav={nav} client={client || CLIENTS[0]} amount={amount || '1200'} />; break;
    case 'validate':        body = <ValidateScreen nav={nav} onConfirm={() => nav('validateSuccess')} />; break;
    case 'validateSuccess': body = <ValidateSuccessScreen nav={nav} />; break;
    case 'clients':         body = <ClientsScreen nav={nav} />; break;
    case 'newclient':       body = <NewClientScreen nav={nav} />; break;
    case 'clientCreated':   body = <ClientCreatedScreen nav={nav} />; break;
    case 'clientdetail':    body = <ClientDetailScreen nav={nav} client={client || CLIENTS[0]} />; break;
    case 'activity':        body = <ActivityScreen nav={nav} />; break;
    case 'profile':         body = <ProfileScreen nav={nav} />; break;
    default:                body = <HomeScreen nav={nav} />;
  }

  // map screen -> active tab
  const activeTab = (() => {
    if (['clients','newclient','clientCreated','clientdetail'].includes(screen)) return 'clients';
    if (['scanner','award','awardSuccess','validate','validateSuccess'].includes(screen)) return 'scan';
    if (screen === 'activity') return 'activity';
    if (screen === 'profile') return 'profile';
    return 'home';
  })();

  // some screens are inherently full-bleed (scanner) and look better with the tabbar hidden
  const hideTabbar = ['scanner', 'newclient'].includes(screen);

  return (
    <div className="stage-col">
      <PhoneFrame statusDark={isDark} statusTime={statusTime} headerBg={headerBg}>
        {body}
        {!hideTabbar && (
          <TabBar
            active={activeTab}
            onTab={(t) => nav(t)}
            onScan={() => nav('scanner', { mode: scanMode })}
          />
        )}
      </PhoneFrame>
      {label && (
        <div className="stage-col-label">
          <b>{label.title}</b> · {label.sub}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   ACCENT THEMES
// ────────────────────────────────────────────────────────────────
const ACCENTS = {
  gold:   { g: '#b8924a', g2: '#d4ae6c', g3: '#8a6e38', bg: 'rgba(184,146,74,0.14)' },
  olive:  { g: '#7a8a39', g2: '#9bab59', g3: '#566627', bg: 'rgba(122,138,57,0.14)' },
  copper: { g: '#b86a47', g2: '#d4886a', g3: '#8a4a2a', bg: 'rgba(184,106,71,0.14)' },
  cocoa:  { g: '#8d6c4a', g2: '#b08a64', g3: '#5e4528', bg: 'rgba(141,108,74,0.14)' },
};

const BG_TONES = {
  cream:  { c1: '#f6f4ef', c2: '#efece5' },
  paper:  { c1: '#fbf9f4', c2: '#f3f0e8' },
  sand:   { c1: '#efeae0', c2: '#e6dfd1' },
  fog:    { c1: '#f1f0ed', c2: '#e8e6df' },
};

// ────────────────────────────────────────────────────────────────
//   Screen jumper — drives both phones to a screen
// ────────────────────────────────────────────────────────────────
const SCREEN_PRESETS = [
  { id: 'home',           label: 'Accueil' },
  { id: 'scanner-award',  label: 'Scanner · attribuer' },
  { id: 'award',          label: 'Attribuer points' },
  { id: 'awardSuccess',   label: 'Succès attribution' },
  { id: 'scanner-validate', label: 'Scanner · valider' },
  { id: 'validate',       label: 'Valider récompense' },
  { id: 'validateSuccess',label: 'Succès récompense' },
  { id: 'clients',        label: 'Clients' },
  { id: 'newclient',      label: 'Nouveau client' },
  { id: 'clientdetail',   label: 'Fiche client' },
  { id: 'activity',       label: 'Activité' },
  { id: 'profile',        label: 'Compte' },
];

function pairForPreset(id) {
  // resolve any "scanner-XXX" preset into screen + mode
  if (id === 'scanner-award')    return { screen: 'scanner', mode: 'award' };
  if (id === 'scanner-validate') return { screen: 'scanner', mode: 'validate' };
  return { screen: id, mode: 'award' };
}

// ────────────────────────────────────────────────────────────────
//   APP shell
// ────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // apply accent + bg tone as CSS vars
  React.useEffect(() => {
    const a = ACCENTS[t.accent] || ACCENTS.gold;
    const root = document.documentElement;
    root.style.setProperty('--gold', a.g);
    root.style.setProperty('--gold-2', a.g2);
    root.style.setProperty('--gold-3', a.g3);
    root.style.setProperty('--gold-bg', a.bg);
    const b = BG_TONES[t.bgTone] || BG_TONES.cream;
    root.style.setProperty('--cream', b.c1);
    root.style.setProperty('--cream-2', b.c2);
    document.body.style.background = b.c1;
  }, [t.accent, t.bgTone]);

  // bump key on layout change to remount phones with fresh state
  const [bump, setBump] = React.useState(0);
  const left  = pairForPreset(t.leftScreen);
  const right = pairForPreset(t.rightScreen);

  const accentSwatch = (id) => {
    const a = ACCENTS[id];
    return (
      <span style={{
        width: 14, height: 14, borderRadius: '50%',
        background: a.g2, border: '1px solid rgba(0,0,0,0.06)',
        display: 'inline-block',
      }} />
    );
  };

  return (
    <div className="canvas">
      <div className="canvas-head">
        <div className="canvas-eyebrow">Jubelee · App personnel</div>
        <h1 className="canvas-title">
          Côté <span className="serif accent">caisse</span>, même langue visuelle.
        </h1>
        <div className="canvas-sub">
          Compagnon staff de la PWA client&nbsp;: scanner, attribution de points,
          cramage des codes de récompense, annuaire et inscription en boutique.
          Toutes les surfaces reprennent la grammaire de l'app cliente — cartes brun
          sombre, accents <span className="serif" style={{ color: 'var(--gold-3)' }}>or</span>, sérif italique et même rythme typographique.
        </div>
      </div>

      {/* Screen jumper — controls both phones at once */}
      {t.showJumper && (
        <div className="jumper" key={'jumper-' + bump}>
          {SCREEN_PRESETS.map(p => {
            const isLeft  = t.leftScreen  === p.id;
            const isRight = t.rightScreen === p.id;
            const active = isLeft || isRight;
            return (
              <button
                key={p.id}
                data-active={active}
                onClick={() => {
                  // shift: new screen → left, previous left → right
                  setTweak({ leftScreen: p.id, rightScreen: t.leftScreen });
                  setBump(b => b + 1);
                }}
              >{p.label}</button>
            );
          })}
        </div>
      )}

      {/* phones */}
      <div className="stage">
        <PhoneApp
          key={'L-' + t.leftScreen + '-' + bump}
          initialScreen={left.screen}
          initialScanMode={left.mode}
          statusTime={t.statusTime}
          label={labelFor(t.leftScreen, '01')}
        />
        {t.layout === 'duo' && (
          <PhoneApp
            key={'R-' + t.rightScreen + '-' + bump}
            initialScreen={right.screen}
            initialScanMode={right.mode}
            statusTime={incMinute(t.statusTime)}
            label={labelFor(t.rightScreen, '02')}
          />
        )}
      </div>

      <div className="footer-note">
        <span className="serif" style={{ fontSize: 16, color: 'var(--ink)' }}>Astuce&nbsp;:</span>{' '}
        navigue librement dans chaque téléphone — clique le bouton scanner au centre de la barre,
        ouvre le mode «&nbsp;Simuler une détection&nbsp;» pour traverser le flux complet
        d'attribution ou de cramage. <span className="mono">1 pt / 100 FCFA</span>.
      </div>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Mise en page" />
        <TweakRadio
          label="Disposition"
          value={t.layout}
          options={['duo', 'solo']}
          onChange={(v) => setTweak('layout', v)}
        />
        <TweakToggle
          label="Sélecteur d'écran"
          value={t.showJumper}
          onChange={(v) => setTweak('showJumper', v)}
        />

        <TweakSection label="Couleur" />
        <div className="twk-row">
          <div className="twk-lbl"><span>Accent</span><span className="twk-val">{t.accent}</span></div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.keys(ACCENTS).map(id => (
              <button key={id} onClick={() => setTweak('accent', id)} style={{
                appearance: 'none', border: t.accent === id ? '2px solid rgba(41,38,27,0.7)' : '2px solid transparent',
                background: 'transparent', borderRadius: 99, padding: 2, cursor: 'pointer',
              }}>
                {accentSwatch(id)}
              </button>
            ))}
          </div>
        </div>

        <TweakRadio
          label="Fond"
          value={t.bgTone}
          options={['cream', 'paper', 'sand', 'fog']}
          onChange={(v) => setTweak('bgTone', v)}
        />

        <TweakSection label="Écran de départ" />
        <TweakSelect
          label="Gauche"
          value={t.leftScreen}
          options={SCREEN_PRESETS.map(p => ({ value: p.id, label: p.label }))}
          onChange={(v) => { setTweak('leftScreen', v); setBump(b => b + 1); }}
        />
        <TweakSelect
          label="Droite"
          value={t.rightScreen}
          options={SCREEN_PRESETS.map(p => ({ value: p.id, label: p.label }))}
          onChange={(v) => { setTweak('rightScreen', v); setBump(b => b + 1); }}
        />

        <TweakSection label="Status bar" />
        <TweakText
          label="Heure"
          value={t.statusTime}
          onChange={(v) => setTweak('statusTime', v)}
        />

        <TweakButton label="Réinitialiser les téléphones" onClick={() => { setBump(b => b + 1); }} />
      </TweaksPanel>
    </div>
  );
}

function incMinute(hhmm) {
  const [h, m] = hhmm.split(':').map(n => parseInt(n, 10));
  if (isNaN(h) || isNaN(m)) return hhmm;
  let mm = m + 1, hh = h;
  if (mm >= 60) { mm = 0; hh = (hh + 1) % 24; }
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

const SCREEN_SUBS = {
  'home':              'Tableau de bord',
  'scanner-award':     'Cible le QR client',
  'scanner-validate':  'Cible le code de remise',
  'award':             'Saisie du montant',
  'awardSuccess':      'Points crédités',
  'validate':          'Confirmation de remise',
  'validateSuccess':   'Code cramé',
  'clients':           'Annuaire',
  'newclient':         'Inscription en boutique',
  'clientdetail':      'Fiche détaillée',
  'activity':          'Historique 7 jours',
  'profile':           'Poste & boutique',
};
function labelFor(presetId, idx) {
  const found = SCREEN_PRESETS.find(p => p.id === presetId);
  return { title: idx + ' ' + (found?.label || presetId), sub: SCREEN_SUBS[presetId] || '' };
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
