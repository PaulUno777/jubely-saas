/* eslint-disable */
const Transactions = ({ toast }) => {
  const [tab, setTab] = React.useState('all');
  const filtered = TRANSACTIONS.filter(t => tab === 'all' ? true : t.type === tab);
  const typeMap = {
    earn: { p: <Pill kind="emerald">Gain</Pill>, c: 'var(--e3)' },
    redeem: { p: <Pill kind="terra">Récompense</Pill>, c: 'var(--t3)' },
    bonus: { p: <Pill kind="gold">Bonus</Pill>, c: 'var(--g3)' },
  };

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--heading)' }}>Transactions</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Flux des points gagnés et récompenses validées en temps réel.</div>
        </div>
        <span className="pill pill-emerald pill-dot" style={{ alignSelf: 'center' }}>Live</span>
        <button className="btn btn-ghost"><Ico.download size={15}/> Exporter CSV</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Transactions (auj.)', v: '342', c: 'var(--e2)', spark: [12,18,22,28,24,32,38] },
          { l: 'Points gagnés', v: '48,2k', c: 'var(--g2)', spark: [20,28,24,30,34,40,44] },
          { l: 'Points dépensés', v: '12,6k', c: 'var(--tl2)', spark: [8,10,9,12,11,14,13] },
          { l: 'Valeur générée', v: '1,84M F', c: 'var(--t2)', spark: [30,34,38,42,40,48,52] },
        ].map((s, i) => (
          <div key={i} className="kpi">
            <div className="kpi-bar-left" style={{ background: s.c }}/>
            <div style={{ paddingLeft: 8 }}>
              <div className="kpi-label">{s.l}</div>
              <div className="serif" style={{ fontSize: 28, color: 'var(--heading)', marginTop: 6 }}>{s.v}</div>
            </div>
            <div className="kpi-spark"><Sparkline points={s.spark} color={s.c} width={80} height={28}/></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head" style={{ paddingBottom: 0, flexDirection: 'column', alignItems: 'stretch', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tabs items={[
              { id: 'all', label: 'Toutes', count: TRANSACTIONS.length },
              { id: 'earn', label: 'Gains', count: 4 },
              { id: 'redeem', label: 'Récompenses', count: 2 },
              { id: 'bonus', label: 'Bonus', count: 1 },
            ]} active={tab} onChange={setTab}/>
            <div className="grow"/>
            <button className="btn btn-ghost btn-sm"><Ico.filter size={14}/> Filtrer</button>
            <select className="select" style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}><option>Toutes boutiques</option><option>Akwa</option><option>Bonanjo</option><option>Bonamoussadi</option></select>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: 6 }}>
          <table className="tbl">
            <thead>
              <tr><th>Référence</th><th>Client</th><th>Type</th><th>Détail</th><th>Agent</th><th>Boutique</th><th>Montant</th><th style={{ textAlign: 'right' }}>Points</th><th>Heure</th></tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={i}>
                  <td className="num" style={{ color: 'var(--muted)', fontSize: 12 }}>{t.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Avatar initials={t.init} kind={t.kind} size={28}/>
                      <span style={{ fontWeight: 500, color: 'var(--heading)', fontSize: 12.5 }}>{t.client}</span>
                    </div>
                  </td>
                  <td>{typeMap[t.type].p}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--muted)' }}>{t.reward || t.note || '—'}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--body)' }}>{t.agent}</td>
                  <td><span className="pill pill-neutral">{t.store}</span></td>
                  <td className="num" style={{ fontSize: 12.5 }}>{t.amount}</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 600, color: typeMap[t.type].c }}>{t.pts}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{t.date} · {t.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

window.Transactions = Transactions;
