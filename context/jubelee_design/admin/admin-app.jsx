/* eslint-disable */
const PAGE_META = {
  dashboard:   { crumb: 'Vue d\u2019ensemble', meta: 'Chez Mama · Akwa, Douala' },
  clients:     { crumb: 'Clients', meta: '1 248 membres' },
  transactions:{ crumb: 'Transactions', meta: 'Flux en temps réel' },
  staff:       { crumb: '\u00C9quipe & agents', meta: '4 agents actifs' },
  rules:       { crumb: 'R\u00E8gles de points', meta: '3 actives' },
  ruleeditor:  { crumb: 'R\u00E8gles de points', meta: '\u00C9diteur' },
  rewards:     { crumb: 'R\u00E9compenses', meta: 'Catalogue' },
  qr:          { crumb: 'QR d\u2019enr\u00F4lement', meta: 'jubelee.app/chez-mama' },
  stores:      { crumb: 'Boutiques', meta: '3 emplacements · Douala' },
  subscription:{ crumb: 'Abonnement', meta: 'Plan & facturation' },
  campaigns:   { crumb: 'Campagnes', meta: '1 en cours' },
  analytics:   { crumb: 'Analytics', meta: '30 derniers jours' },
  settings:    { crumb: 'Param\u00E8tres', meta: 'Boutique' },
};

const ComingSoon = ({ page }) => (
  <div style={{ padding: '24px 28px 40px' }}>
    <EmptyState
      icon={page === 'clients' ? <Ico.users size={24}/> : page === 'transactions' ? <Ico.activity size={24}/> : page === 'rewards' ? <Ico.gift size={24}/> : <Ico.qr size={24}/>}
      title="Section en préparation"
      sub="Cette vue fait partie de la roadmap Store Admin. Les écrans clés (Dashboard, Équipe, Règles, Campagnes, Analytics, Paramètres) sont entièrement fonctionnels."
      action={<button className="btn btn-soft btn-sm">Voir la roadmap</button>}
    />
  </div>
);

const LoadingState = () => (
  <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ flex: 1 }}><Skel w={220} h={28} r={8}/><div style={{ height: 8 }}/><Skel w={320} h={14}/></div>
      <Skel w={120} h={38} r={10}/>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {[0,1,2,3].map(i => (
        <div key={i} className="card" style={{ padding: 16 }}><Skel w={90} h={11}/><div style={{ height: 12 }}/><Skel w={120} h={32} r={8}/><div style={{ height: 10 }}/><Skel w={100} h={12}/></div>
      ))}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
      <div className="card" style={{ padding: 20, height: 320 }}><Skel w={180} h={18}/><div style={{ height: 20 }}/><Skel w="100%" h={210} r={10}/></div>
      <div className="card" style={{ padding: 20, height: 320 }}><Skel w={140} h={18}/><div style={{ height: 16 }}/>{[0,1,2,3].map(i => <div key={i} style={{ marginBottom: 12 }}><Skel w="100%" h={48} r={10}/></div>)}</div>
    </div>
  </div>
);

// ===== Interface language selector (topbar) =====
const LangSelect = ({ toast }) => {
  const { langs } = useLangs();
  const options = ALL_LANGS.filter(l => langs.includes(l.id));
  const [uiLang, setUiLang] = React.useState(langs[0] || 'fr');
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { if (!langs.includes(uiLang)) setUiLang(langs[0] || 'fr'); }, [langs]);
  const current = ALL_LANGS.find(l => l.id === uiLang) || ALL_LANGS[0];

  const pick = (l) => {
    setUiLang(l.id);
    setOpen(false);
    if (l.id !== uiLang) toast('Langue de l\u2019interface', `Affichage en ${l.name}.`, 'em');
  };

  return (
    <div style={{ position: 'relative', paddingLeft: 6 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Langue de l'interface"
        style={{
          appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 8,
          height: 38, padding: '0 10px', borderRadius: 10,
          background: open ? 'var(--n1)' : 'transparent',
          border: '1px solid ' + (open ? 'var(--border)' : 'transparent'),
          transition: 'background .15s, border-color .15s',
        }}
      >
        <span style={{ fontSize: 17, lineHeight: 1 }}>{current.flag}</span>
        <span style={{ lineHeight: 1.15, whiteSpace: 'nowrap', textAlign: 'left' }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>{current.name}</span>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>Interface</span>
        </span>
        <Ico.chevD size={14} style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}/>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}/>
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 41,
            width: 248, background: 'var(--surface)', borderRadius: 14,
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-pop, 0 18px 48px rgba(20,16,8,0.18))',
            padding: 6, overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 10px 6px', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--muted)' }}>
              Langue de l'interface
            </div>
            {options.map(l => {
              const active = l.id === uiLang;
              return (
                <button key={l.id} onClick={() => pick(l)} style={{
                  appearance: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit',
                  width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                  padding: '9px 10px', borderRadius: 9, textAlign: 'left',
                  background: active ? 'var(--g0)' : 'transparent', transition: 'background .12s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--n1)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{l.flag}</span>
                  <span style={{ flex: 1, lineHeight: 1.2 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: active ? 'var(--g4)' : 'var(--heading)' }}>{l.name}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>{l.label}</span>
                  </span>
                  {active && <Ico.check size={15} style={{ color: 'var(--g3)' }}/>}
                </button>
              );
            })}
            <div style={{ borderTop: '1px solid var(--border)', margin: '6px 4px 2px' }}/>
            <div style={{ padding: '8px 10px', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4 }}>
              Gérez les langues disponibles dans <span style={{ color: 'var(--heading)', fontWeight: 600 }}>Paramètres → Marque</span>.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const App = () => {
  const [page, setPage] = React.useState('dashboard');
  const [loading, setLoading] = React.useState(false);
  const [modal, setModal] = React.useState(null); // { type, data }
  const [confirmDlg, setConfirmDlg] = React.useState(null);
  const [toasts, setToasts] = React.useState([]);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [plan, setPlan] = React.useState('growth');
  const [editorData, setEditorData] = React.useState(null);
  const [langs, setLangs] = React.useState(['fr', 'en']);
  const planName = PLANS.find(p => p.id === plan)?.name;

  const toast = (title, sub, icon = 'em') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, title, sub, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  };

  const nav = (p) => {
    if (p === page) return;
    setNotifOpen(false);
    setLoading(true);
    setPage(p);
    setTimeout(() => setLoading(false), 520);
  };

  const openModal = (type, data = null) => setModal({ type, data });
  const closeModal = () => setModal(null);
  const confirm = (kind, data) => setConfirmDlg({ kind, data });
  const openEditor = (rule = null) => { setEditorData(rule); setNotifOpen(false); setLoading(true); setPage('ruleeditor'); setTimeout(() => setLoading(false), 380); };

  const meta = PAGE_META[page] || { crumb: '', meta: '' };

  const renderPage = () => {
    if (loading) return <LoadingState/>;
    switch (page) {
      case 'dashboard': return <Dashboard toast={toast} openModal={openModal} openEditor={openEditor}/>;
      case 'staff': return <Staff toast={toast} openModal={openModal} confirm={confirm}/>;
      case 'rules': return <Rules toast={toast} openModal={openModal} confirm={confirm} plan={plan} openEditor={openEditor}/>;
      case 'ruleeditor': return <RuleEditorPage plan={plan} data={editorData} onBack={() => nav('rules')} toast={toast}/>;
      case 'campaigns': return <Campaigns toast={toast} openModal={openModal} confirm={confirm}/>;
      case 'analytics': return <Analytics toast={toast}/>;
      case 'settings': return <Settings toast={toast} langs={langs} setLangs={setLangs}/>;
      case 'clients': return <Clients toast={toast}/>;
      case 'transactions': return <Transactions toast={toast}/>;
      case 'rewards': return <Rewards toast={toast} confirm={confirm}/>;
      case 'stores': return <Stores toast={toast}/>;
      case 'qr': return <QREnroll toast={toast}/>;
      case 'subscription': return <Subscription plan={plan} setPlan={setPlan} toast={toast}/>;
      default: return <ComingSoon page={page}/>;
    }
  };

  return (
    <div className="app">
      <LangContext.Provider value={{ langs, setLangs }}>
      <div style={{ display: 'flex', minHeight: 1000 }}>
        <Sidebar active={page} onNav={nav} planName={planName}/>
        <div className="main">
          <div className="topbar">
            <div className="crumb">
              {meta.crumb}
              <span className="crumb-meta">{meta.meta}</span>
            </div>
            <div className="grow"/>
            <div className="search">
              <Ico.search size={15}/>
              <input placeholder="Rechercher clients, agents, règles…"/>
              <kbd>⌘K</kbd>
            </div>
            <button className="icon-btn" onClick={() => toast('Synchronisé', 'Données à jour.', 'em')}><Ico.refresh size={16}/></button>
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setNotifOpen(o => !o)}>
                <Ico.bell size={16}/><span className="dot" style={{ background: 'var(--t2)' }}/>
              </button>
              {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)}/>}
            </div>
            <LangSelect toast={toast}/>
          </div>

          <div style={{ flex: 1, minWidth: 0 }} onClick={() => notifOpen && setNotifOpen(false)}>
            {renderPage()}
          </div>
        </div>
      </div>

      {/* Modals — portaled to body so they center in the viewport, not the scaled stage */}
      <Portal>
        {modal?.type === 'rule' && <RuleModal data={modal.data} onClose={closeModal} toast={toast}/>}
        {modal?.type === 'staff' && <StaffModal data={modal.data} onClose={closeModal} toast={toast}/>}
        {modal?.type === 'campaign' && <CampaignModal data={modal.data} onClose={closeModal} toast={toast}/>}
        {confirmDlg && <ConfirmDialog kind={confirmDlg.kind} data={confirmDlg.data} onClose={() => setConfirmDlg(null)} toast={toast}/>}
      </Portal>

      {/* Toasts */}
      <Portal>
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <div className={`toast-icon ${t.icon}`}>
              {t.icon === 'em' ? <Ico.check size={15}/> : t.icon === 'gd' ? <Ico.star size={15}/> : <Ico.info size={15}/>}
            </div>
            <div style={{ flex: 1 }}>
              <div className="toast-title">{t.title}</div>
              {t.sub && <div className="toast-sub">{t.sub}</div>}
            </div>
            <button className="toast-close" onClick={() => setToasts(x => x.filter(y => y.id !== t.id))}><Ico.x size={14}/></button>
          </div>
        ))}
      </div>
      </Portal>
      </LangContext.Provider>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

// re-fit stage after first render
setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
setTimeout(() => window.dispatchEvent(new Event('resize')), 400);
