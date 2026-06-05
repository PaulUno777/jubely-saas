/* eslint-disable */
const Sidebar = ({ active, onNav, planName }) => {
  const navItems = [
    { section: 'Tableau de bord' },
    { id: 'dashboard',  icon: <Ico.grid size={16}/>, label: 'Vue d\u2019ensemble' },
    { id: 'clients',    icon: <Ico.users size={16}/>, label: 'Clients', count: '1 248' },
    { id: 'transactions', icon: <Ico.activity size={16}/>, label: 'Transactions' },
    { id: 'stores',     icon: <Ico.store size={16}/>, label: 'Boutiques', count: 3 },
    { section: 'Configuration' },
    { id: 'staff',      icon: <Ico.users size={16}/>, label: '\u00C9quipe & agents', count: 4 },
    { id: 'rules',      icon: <Ico.star size={16}/>, label: 'R\u00E8gles de points', count: 3 },
    { id: 'rewards',    icon: <Ico.gift size={16}/>, label: 'R\u00E9compenses', count: 2 },
    { id: 'qr',         icon: <Ico.qr size={16}/>, label: 'QR d\u2019enr\u00F4lement' },
    { section: 'Marketing' },
    { id: 'campaigns',  icon: <Ico.megaphone size={16}/>, label: 'Campagnes', count: 1 },
    { id: 'analytics',  icon: <Ico.chart size={16}/>, label: 'Analytics' },
    { section: 'Compte' },
    { id: 'subscription', icon: <Ico.card size={16}/>, label: 'Abonnement' },
    { id: 'settings',   icon: <Ico.settings size={16}/>, label: 'Param\u00E8tres' },
  ];

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div className="sb-rail">
          <div className="sb-logo">J</div>
          <div style={{ height: 14 }}/>
          <div className="sb-rail-btn" data-active={active === 'dashboard'} onClick={() => onNav('dashboard')} title="Vue d'ensemble"><Ico.grid size={18}/></div>
          <div className="sb-rail-btn" data-active={active === 'clients'} onClick={() => onNav('clients')} title="Clients"><Ico.users size={18}/></div>
          <div className="sb-rail-btn" data-active={active === 'transactions'} onClick={() => onNav('transactions')} title="Transactions"><Ico.activity size={18}/></div>
          <div className="sb-rail-btn" data-active={active === 'stores'} onClick={() => onNav('stores')} title="Boutiques"><Ico.store size={18}/></div>
          <div className="sb-rail-btn" data-active={active === 'rules'} onClick={() => onNav('rules')} title="R\u00E8gles"><Ico.star size={18}/></div>
          <div className="sb-rail-btn" data-active={active === 'rewards'} onClick={() => onNav('rewards')} title="R\u00E9compenses"><Ico.gift size={18}/></div>
          <div className="sb-rail-btn" data-active={active === 'campaigns'} onClick={() => onNav('campaigns')} title="Campagnes"><Ico.megaphone size={18}/></div>
          <div className="sb-rail-btn" data-active={active === 'analytics'} onClick={() => onNav('analytics')} title="Analytics"><Ico.chart size={18}/></div>
          <div style={{ flex: 1 }}/>
          <div className="sb-rail-btn" data-active={active === 'settings'} onClick={() => onNav('settings')} title="Param\u00E8tres"><Ico.settings size={18}/></div>
        </div>

        <div className="sb-main">
          <div className="sb-store" onClick={() => onNav('stores')} style={{ cursor: 'pointer' }}>
            <div className="sb-store-row">
              <div className="sb-store-mark">C</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="sb-store-name">Chez Mama</div>
                <div className="sb-store-sub">3 boutiques · Douala</div>
              </div>
              <Ico.chevD size={15} style={{ color: 'rgba(232,226,213,0.5)', flex: 'none' }}/>
            </div>
            <div className="sb-plan" onClick={(e) => { e.stopPropagation(); onNav('subscription'); }}>
              <Ico.star size={11}/> Plan {planName || 'Growth'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
            {navItems.map((it, i) => {
              if (it.section) return <div key={i} className="sb-section">{it.section}</div>;
              return (
                <div key={it.id} className="sb-item"
                  data-active={active === it.id}
                  onClick={() => onNav(it.id)}>
                  {it.icon}
                  <span>{it.label}</span>
                  {it.count != null && <span className={`count ${it.id === 'campaigns' ? 'alert' : ''}`}>{it.count}</span>}
                </div>
              );
            })}
          </div>

          <div className="sb-foot">
            <div className="sb-foot-avatar">KM</div>
            <div style={{ minWidth: 0 }}>
              <div className="sb-foot-name">Kofi Mensah</div>
              <div className="sb-foot-sub">Gérant · Chez Mama</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
