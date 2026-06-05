// customer-app.jsx — composes the customer prototype canvas

const CTWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "duo",
  "leftScreen": "auth",
  "rightScreen": "myqr",
  "showJumper": true,
  "statusTime": "13:15",
  "showBanner": false
}/*EDITMODE-END*/;

const C_SCREEN_PRESETS = [
  { id: 'auth',            label: 'Auth' },
  { id: 'signup',          label: 'Inscription' },
  { id: 'otp',             label: 'OTP' },
  { id: 'completeprofile', label: 'Compléter profil' },
  { id: 'wallet',          label: 'Wallet' },
  { id: 'myqr',            label: 'Mon QR' },
  { id: 'walletdetail',    label: 'Wallet · enseigne' },
  { id: 'claimreward',     label: 'Réclamer · code' },
  { id: 'claimsuccess',    label: 'Récompense remise' },
  { id: 'map',             label: 'Carte' },
  { id: 'lockscreen',      label: 'Push (lock)' },
  { id: 'notifs',          label: 'Notifications' },
  { id: 'scanjoin',        label: 'Scan rejoindre' },
  { id: 'joinsheet',       label: 'Rejoindre · sheet' },
  { id: 'joinsuccess',     label: 'Bienvenue' },
  { id: 'storedetail',     label: 'Fiche enseigne' },
  { id: 'profile',         label: 'Profil' },
  { id: 'personalinfo',    label: 'Mes infos' },
  { id: 'language',        label: 'Langue' },
  { id: 'notifprefs',      label: 'Préférences notif' },
];

const SCREEN_SUBS = {
  'auth':            'Bienvenue + connexion',
  'signup':          'Création de compte',
  'otp':             'Vérification SMS',
  'completeprofile': 'Genre, DOB, intérêts (optionnel)',
  'wallet':          'Carte fidélité multi-enseigne',
  'myqr':            'Code à montrer en caisse',
  'walletdetail':    'Vue par enseigne',
  'claimreward':     'Code de remise à la caisse',
  'claimsuccess':    'Reçu post-cramage',
  'map':             'Enseignes Jubelee à proximité',
  'lockscreen':      'Notif sponsorisée géolocalisée',
  'notifs':          'Inbox des annonces enseignes',
  'scanjoin':        'Rejoindre via QR vitrine',
  'joinsheet':       'Aperçu programme + bonus',
  'joinsuccess':     'Carte ajoutée au wallet',
  'storedetail':     'Profil public · aperçu récompenses',
  'profile':         'Compte, stats, raccourcis',
  'personalinfo':    'Genre, DOB, email, métier',
  'language':        'Multi-langue (incl. langues CMR)',
  'notifprefs':      'Contrôle des alertes',
};

function labelFor(presetId, idx) {
  const found = C_SCREEN_PRESETS.find(p => p.id === presetId);
  return { title: idx + ' · ' + (found?.label || presetId), sub: SCREEN_SUBS[presetId] || '' };
}

function incMinute(hhmm) {
  const [h, m] = hhmm.split(':').map(n => parseInt(n, 10));
  if (isNaN(h) || isNaN(m)) return hhmm;
  let mm = m + 1, hh = h;
  if (mm >= 60) { mm = 0; hh = (hh + 1) % 24; }
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

// ────────────────────────────────────────────────────────────────
//   PhoneApp — a single self-contained interactive phone
// ────────────────────────────────────────────────────────────────
function PhoneApp({ initialScreen = 'wallet', statusTime = '13:15', showBanner = false, label }) {
  const [screen, setScreen] = React.useState(initialScreen);
  const [store, setStore] = React.useState(null);
  const [banner, setBanner] = React.useState(showBanner);

  React.useEffect(() => { setBanner(showBanner); }, [showBanner]);

  const nav = (s, params = {}) => {
    if (params.store !== undefined) setStore(params.store);
    if (params.reward !== undefined) setStore(prev => prev); // keep store
    setScreen(s);
    if (s !== 'wallet' && s !== 'map') setBanner(false);
  };

  // dark-status-bar screens
  const isDark = ['scanjoin', 'joinsheet', 'lockscreen', 'walletdetail', 'myqr', 'claimreward'].includes(screen);
  const headerBg = isDark
    ? (screen === 'lockscreen' ? 'transparent' : 'var(--card)')
    : 'var(--cream)';
  const hideTabbar = ['scanjoin', 'joinsheet', 'lockscreen', 'storedetail',
    'auth', 'signup', 'otp', 'completeprofile',
    'myqr', 'claimreward', 'claimsuccess',
    'profile', 'personalinfo', 'language', 'notifs', 'notifprefs',
  ].includes(screen);

  let body;
  switch (screen) {
    case 'auth':            body = <AuthScreen nav={nav} />; break;
    case 'signup':          body = <SignupScreen nav={nav} />; break;
    case 'otp':             body = <OtpScreen nav={nav} />; break;
    case 'completeprofile': body = <CompleteProfileScreen nav={nav} />; break;
    case 'wallet':          body = <WalletScreen nav={nav} />; break;
    case 'walletdetail':    body = <WalletDetailScreen nav={nav} store={store || STORES[0]} />; break;
    case 'map':             body = <MapScreen nav={nav} filterIdx={0} />; break;
    case 'lockscreen':      body = <LockScreenNotif statusTime={statusTime} />; break;
    case 'notifs':          body = <NotifsScreen nav={nav} />; break;
    case 'scanjoin':        body = <ScanToJoinScreen nav={nav} />; break;
    case 'joinsheet':       body = <JoinSheetScreen nav={nav} store={store || STORES[2]} />; break;
    case 'joinsuccess':     body = <JoinSuccessScreen nav={nav} store={store || STORES[2]} />; break;
    case 'storedetail':     body = <StoreDetailScreen nav={nav} store={store || STORES[2]} />; break;
    case 'notifprefs':      body = <NotifPrefsScreen nav={nav} />; break;
    case 'myqr':            body = <MyQrScreen nav={nav} />; break;
    case 'claimreward':     body = <ClaimRewardScreen nav={nav} store={store || STORES[0]} />; break;
    case 'claimsuccess':    body = <ClaimSuccessScreen nav={nav} store={store || STORES[0]} />; break;
    case 'profile':         body = <ProfileHubScreen nav={nav} />; break;
    case 'personalinfo':    body = <PersonalInfoScreen nav={nav} />; break;
    case 'language':        body = <LanguageScreen nav={nav} />; break;
    case 'primes':          body = <WalletDetailScreen nav={nav} store={STORES[0]} />; break;
    default:                body = <WalletScreen nav={nav} />;
  }

  // active tab inference
  const activeTab = (() => {
    if (['map', 'storedetail'].includes(screen)) return 'map';
    if (['notifs', 'notifprefs', 'profile', 'personalinfo', 'language'].includes(screen)) return 'profile';
    if (['scanjoin', 'joinsheet', 'joinsuccess', 'myqr', 'claimreward'].includes(screen)) return 'scan';
    if (['walletdetail', 'claimsuccess', 'primes'].includes(screen)) return 'primes';
    return 'wallet';
  })();

  // hide standard status bar on lockscreen (it has its own)
  const showStandardStatus = screen !== 'lockscreen';

  return (
    <div className="stage-col">
      <div className="pf">
        {showStandardStatus && (
          <div style={{ background: headerBg, flexShrink: 0, position: 'relative', zIndex: 4 }}>
            <StatusBar dark={isDark} time={statusTime} />
          </div>
        )}
        <div className="pf-screen">
          {/* in-app banner overlay — shown on wallet & map only */}
          {banner && (screen === 'wallet' || screen === 'map') && (
            <InAppBanner
              store={STORES[0]}
              onTap={() => { setBanner(false); nav('walletdetail', { store: STORES[0] }); }}
              onDismiss={() => setBanner(false)}
            />
          )}
          {body}
        </div>
        {!hideTabbar && (
          <CTabBar
            active={activeTab}
            onTab={(t) => {
              if (t === 'wallet') nav('wallet');
              if (t === 'map')    nav('map');
              if (t === 'primes') nav('walletdetail', { store: STORES[0] });
              if (t === 'profile') nav('profile');
            }}
            onScan={() => nav('myqr')}
          />
        )}
      </div>
      {label && (
        <div className="stage-col-label">
          <b>{label.title}</b>{label.sub ? ' · ' + label.sub : ''}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   App canvas
// ────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(CTWEAK_DEFAULTS);
  const [bump, setBump] = React.useState(0);

  return (
    <div className="canvas">
      <div className="canvas-head">
        <div className="canvas-eyebrow">Jubelee · App client</div>
        <h1 className="canvas-title">
          Découvre, rejoins, <span className="serif accent">cumule</span>.
        </h1>
        <div className="canvas-sub">
          Compagnon des nouveaux écrans côté client&nbsp;: une <b>carte</b> des enseignes Jubelee à proximité,
          des <b>notifications</b> de boutique (proximité, événements, nouveautés, récompenses) avec un format
          sponsorisé clairement marqué, et une <b>inscription en un scan</b> via le QR collé en vitrine de
          l'enseigne. Tout reste dans la grammaire visuelle de l'app actuelle.
        </div>
      </div>

      {/* screen jumper — pushes new screen to left phone, left → right */}
      {t.showJumper && (
        <div className="jumper" key={'cjumper-' + bump}>
          {C_SCREEN_PRESETS.map(p => {
            const isLeft = t.leftScreen === p.id;
            const isRight = t.rightScreen === p.id;
            return (
              <button
                key={p.id}
                data-active={isLeft || isRight}
                onClick={() => {
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
          initialScreen={t.leftScreen}
          statusTime={t.statusTime}
          showBanner={t.showBanner}
          label={labelFor(t.leftScreen, '01')}
        />
        {t.layout === 'duo' && (
          <PhoneApp
            key={'R-' + t.rightScreen + '-' + bump}
            initialScreen={t.rightScreen}
            statusTime={incMinute(t.statusTime)}
            showBanner={false}
            label={labelFor(t.rightScreen, '02')}
          />
        )}
      </div>

      <div className="footer-note">
        <span className="serif" style={{ fontSize: 16, color: 'var(--ink)' }}>3 fonctionnalités clés&nbsp;:</span>{' '}
        <b>Carte</b> (enseignes proches avec leurs récompenses), <b>Notifications boutique</b> (proximité,
        nouveau produit, événement, récompense — avec un format Sponsorisé qui finance la plateforme), et
        <b> Scan-pour-rejoindre</b> (entrer dans un programme en deux taps). Active la bannière in-app via Tweaks
        pour voir une notif sponsorisée apparaître sur le Wallet.
      </div>

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Disposition" />
        <TweakRadio
          label="Vue"
          value={t.layout}
          options={['duo', 'solo']}
          onChange={(v) => setTweak('layout', v)}
        />
        <TweakToggle
          label="Sélecteur d'écran"
          value={t.showJumper}
          onChange={(v) => setTweak('showJumper', v)}
        />

        <TweakSection label="Démos" />
        <TweakToggle
          label="Bannière sponso (in-app)"
          value={t.showBanner}
          onChange={(v) => { setTweak('showBanner', v); setBump(b => b + 1); }}
        />

        <TweakSection label="Écran de départ" />
        <TweakSelect
          label="Gauche"
          value={t.leftScreen}
          options={C_SCREEN_PRESETS.map(p => ({ value: p.id, label: p.label }))}
          onChange={(v) => { setTweak('leftScreen', v); setBump(b => b + 1); }}
        />
        <TweakSelect
          label="Droite"
          value={t.rightScreen}
          options={C_SCREEN_PRESETS.map(p => ({ value: p.id, label: p.label }))}
          onChange={(v) => { setTweak('rightScreen', v); setBump(b => b + 1); }}
        />

        <TweakSection label="Status bar" />
        <TweakText
          label="Heure"
          value={t.statusTime}
          onChange={(v) => setTweak('statusTime', v)}
        />

        <TweakButton label="Réinitialiser" onClick={() => setBump(b => b + 1)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
