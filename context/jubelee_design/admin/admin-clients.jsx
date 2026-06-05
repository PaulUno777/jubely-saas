/* eslint-disable */
const Clients = ({ toast }) => {
  const [tab, setTab] = React.useState('all');
  const [sel, setSel] = React.useState(null);

  const filtered = CLIENTS.filter(c =>
    tab === 'all' ? true :
    tab === 'top' ? (c.tier === 'or' || c.tier === 'platine') :
    c.visits < 10);

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--heading)' }}>Clients</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Base de fidélité centralisée sur toutes vos boutiques.</div>
        </div>
        <button className="btn btn-ghost"><Ico.download size={15}/> Exporter</button>
        <button className="btn btn-primary" onClick={() => toast('Invitation prête', 'Partagez le QR pour enrôler un client.', 'em')}><Ico.plus size={16}/> Enrôler un client</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Clients fidèles', v: '1 248', c: 'var(--e2)' },
          { l: 'Actifs (30j)', v: '864', c: 'var(--g2)' },
          { l: 'Panier moyen', v: '4 850 F', c: 'var(--tl2)' },
          { l: 'Dormants', v: '184', c: 'var(--t2)' },
        ].map((s, i) => (
          <div key={i} className="kpi">
            <div className="kpi-bar-left" style={{ background: s.c }}/>
            <div style={{ paddingLeft: 8 }}>
              <div className="kpi-label">{s.l}</div>
              <div className="serif" style={{ fontSize: 28, color: 'var(--heading)', marginTop: 6 }}>{s.v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head" style={{ paddingBottom: 0, flexDirection: 'column', alignItems: 'stretch', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tabs items={[
              { id: 'all', label: 'Tous', count: CLIENTS.length },
              { id: 'top', label: 'Meilleurs clients', count: 2 },
              { id: 'dormant', label: 'Dormants', count: 2 },
            ]} active={tab} onChange={setTab}/>
            <div className="grow"/>
            <div className="search" style={{ width: 220, padding: '6px 10px' }}><Ico.search size={14}/><input placeholder="Rechercher…"/></div>
            <select className="select" style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}><option>Toutes boutiques</option><option>Akwa</option><option>Bonanjo</option><option>Bonamoussadi</option></select>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: 6 }}>
          <table className="tbl">
            <thead>
              <tr><th>Client</th><th>Palier</th><th>Points</th><th>Visites</th><th>Dépensé (FCFA)</th><th>Boutique</th><th>Dernière visite</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSel(c)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <Avatar initials={c.init} kind={c.kind} size={36}/>
                      <div><div style={{ fontWeight: 600, color: 'var(--heading)', fontSize: 13 }}>{c.name}</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{c.phone}</div></div>
                    </div>
                  </td>
                  <td><TierBadge tier={c.tier}/></td>
                  <td className="num" style={{ fontWeight: 500 }}>{c.pts}</td>
                  <td className="num">{c.visits}</td>
                  <td className="num">{c.spent}</td>
                  <td><span className="pill pill-neutral">{c.store}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.last}</td>
                  <td style={{ textAlign: 'right' }}><Ico.chevR size={15} style={{ color: 'var(--n4)' }}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sel && <Portal><ClientDrawer client={sel} onClose={() => setSel(null)} toast={toast}/></Portal>}
    </div>
  );
};

const ClientDrawer = ({ client, onClose, toast }) => (
  <div className="modal-backdrop" style={{ justifyContent: 'flex-end', padding: 0 }} onClick={onClose}>
    <div style={{ width: 420, height: '100vh', maxHeight: '100vh', background: 'var(--surface)', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', animation: 'modalIn .24s ease-out' }} onClick={e => e.stopPropagation()}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar initials={client.init} kind={client.kind} size={48}/>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 22, color: 'var(--heading)' }}>{client.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{client.phone}</div>
        </div>
        <button className="icon-btn" onClick={onClose}><Ico.x size={16}/></button>
      </div>
      <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, borderRadius: 14, background: 'var(--g0)' }}>
          <div><div style={{ fontSize: 11, color: 'var(--g4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Palier actuel</div><div className="serif" style={{ fontSize: 24, color: 'var(--g4)', marginTop: 2 }}><TierBadge tier={client.tier}/></div></div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}><div className="num" style={{ fontSize: 26, fontWeight: 500, color: 'var(--heading)' }}>{client.pts}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>points</div></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['Visites', client.visits],['Dépensé', client.spent + ' F'],['Boutique', client.store],['Membre depuis', client.joined]].map(([l,v]) => (
            <div key={l} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}><div style={{ fontSize: 11, color: 'var(--muted)' }}>{l}</div><div className="num" style={{ fontSize: 15, color: 'var(--heading)', fontWeight: 500, marginTop: 2 }}>{v}</div></div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Activité récente</div>
          {[['Café offert','−1 500','redeem'],['Achat 12 400 F','+124','earn'],['Happy hour x2','+172','earn'],['Palier Or atteint','Palier','tier']].map(([t,a,k], i) => (
            <div key={i} className="feed-row">
              <div className={`ava ava-${k==='redeem'?'tr':k==='tier'?'gd':'em'}`} style={{ width: 30, height: 30 }}>{k==='redeem'?<Ico.gift size={13}/>:k==='tier'?<Ico.award size={13}/>:<Ico.star size={13}/>}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, color: 'var(--heading)' }}>{t}</div><div className="feed-meta">Il y a {i+1} j · Akwa</div></div>
              <span className="feed-amt" style={{ color: k==='redeem'?'var(--t3)':k==='tier'?'var(--g3)':'var(--e3)' }}>{a}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-soft" onClick={() => toast('Message envoyé', client.name, 'em')}><Ico.msg size={14}/> Message</button>
        <div className="grow"/>
        <button className="btn btn-primary" onClick={() => toast('Points ajustés', client.name, 'em')}><Ico.plus size={14}/> Ajuster les points</button>
      </div>
    </div>
  </div>
);

window.Clients = Clients;
