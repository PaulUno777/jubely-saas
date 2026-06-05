/* eslint-disable */
const Staff = ({ toast, openModal, confirm }) => {
  const [tab, setTab] = React.useState('all');

  const staff = [
    { name: 'Aïcha Bello', role: 'Caissière', init: 'AB', kind: 'em', email: 'aicha@chezmama.cm', phone: '+237 6 99 12 34 56', status: 'active', pts: '128 400', tx: 342, joined: 'Jan 2025', perm: 'Attribution points', last: 'Il y a 2 min' },
    { name: 'Yaw Owusu', role: 'Serveur', init: 'YO', kind: 'gd', email: 'yaw@chezmama.cm', phone: '+237 6 77 45 88 21', status: 'active', pts: '96 250', tx: 287, joined: 'Fév 2025', perm: 'Attribution points', last: 'Il y a 23 min' },
    { name: 'Fatou Diop', role: 'Caissière', init: 'FD', kind: 'tl', email: 'fatou@chezmama.cm', phone: '+237 6 90 33 17 09', status: 'active', pts: '74 800', tx: 211, joined: 'Mar 2025', perm: 'Attribution + récompenses', last: 'Il y a 1 h' },
    { name: 'Kwame Asante', role: 'Manager', init: 'KA', kind: 'tr', email: 'kwame@chezmama.cm', phone: '+237 6 55 21 76 43', status: 'active', pts: '52 100', tx: 148, joined: 'Jan 2025', perm: 'Accès complet', last: 'Il y a 3 h' },
    { name: 'Lola Mballa', role: 'Serveuse', init: 'LM', kind: 'nu', email: 'lola@chezmama.cm', phone: '+237 6 71 09 54 32', status: 'invited', pts: '—', tx: 0, joined: 'Invitée', perm: 'Attribution points', last: 'Jamais' },
  ];

  const filtered = tab === 'all' ? staff : tab === 'active' ? staff.filter(s => s.status === 'active') : staff.filter(s => s.status === 'invited');

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--heading)' }}>Équipe & agents</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Gérez qui peut attribuer des points et valider des récompenses.</div>
        </div>
        <button className="btn btn-ghost"><Ico.download size={15}/> Exporter</button>
        <button className="btn btn-primary" onClick={() => openModal('staff')}><Ico.plus size={16}/> Ajouter un agent</button>
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Agents actifs', v: '4', c: 'var(--e2)', i: <Ico.users size={16}/> },
          { l: 'Invitations en attente', v: '1', c: 'var(--g2)', i: <Ico.mail size={16}/> },
          { l: 'Points attribués', v: '351,5k', c: 'var(--tl2)', i: <Ico.star size={16}/> },
          { l: 'Transactions', v: '988', c: 'var(--t2)', i: <Ico.activity size={16}/> },
        ].map((s, i) => (
          <div key={i} className="kpi" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="ava" style={{ width: 40, height: 40, background: 'var(--surface-2)', color: s.c, flex: 'none' }}>{s.i}</div>
            <div style={{ minWidth: 0 }}>
              <div className="kpi-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.l}</div>
              <div className="serif" style={{ fontSize: 26, color: 'var(--heading)', lineHeight: 1.1, marginTop: 4 }}>{s.v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head" style={{ paddingBottom: 0, flexDirection: 'column', alignItems: 'stretch', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tabs items={[
              { id: 'all', label: 'Tous', count: staff.length },
              { id: 'active', label: 'Actifs', count: 4 },
              { id: 'invited', label: 'Invités', count: 1 },
            ]} active={tab} onChange={setTab}/>
            <div className="grow"/>
            <div className="search" style={{ width: 220, padding: '6px 10px' }}>
              <Ico.search size={14}/><input placeholder="Rechercher un agent…"/>
            </div>
            <button className="btn btn-ghost btn-sm"><Ico.filter size={14}/> Filtrer</button>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: 6 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Rôle & permissions</th>
                <th>Points attribués</th>
                <th>Transactions</th>
                <th>Statut</th>
                <th>Dernière activité</th>
                <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <Avatar initials={s.init} kind={s.kind} size={36}/>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--heading)', fontSize: 13 }}>{s.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12.5, color: 'var(--body)', fontWeight: 500 }}>{s.role}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{s.perm}</div>
                  </td>
                  <td className="num" style={{ fontWeight: 500 }}>{s.pts}</td>
                  <td className="num">{s.tx}</td>
                  <td>
                    {s.status === 'active'
                      ? <Pill kind="emerald" dot>Actif</Pill>
                      : <Pill kind="gold" dot>Invitation envoyée</Pill>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{s.last}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 4 }}>
                      <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => openModal('staff', s)}><Ico.edit size={14}/></button>
                      <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => confirm('remove-staff', s)}><Ico.trash size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

window.Staff = Staff;
