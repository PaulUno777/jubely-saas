/* eslint-disable */
const KPI = ({ label, value, unit, delta, up, color, spark, sparkColor }) => (
  <div className="kpi">
    <div className="kpi-bar-left" style={{ background: color }}/>
    <div style={{ paddingLeft: 8 }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}{unit && <small>{unit}</small>}</div>
      <div className={`kpi-delta ${up ? 'up' : 'down'}`}>
        {up ? <Ico.trendUp size={13}/> : <Ico.trendDown size={13}/>}
        {delta}
        <span style={{ color: 'var(--muted)', fontWeight: 400 }}>vs. mois dernier</span>
      </div>
    </div>
    {spark && <div className="kpi-spark"><Sparkline points={spark} color={sparkColor} width={84} height={30}/></div>}
  </div>
);

const Dashboard = ({ toast, openModal, openEditor }) => {
  const monthBars = [
    { label: 'Lun', a: 4200, b: 1800 }, { label: 'Mar', a: 5100, b: 2100 },
    { label: 'Mer', a: 4800, b: 1600 }, { label: 'Jeu', a: 6200, b: 2800 },
    { label: 'Ven', a: 8400, b: 3900 }, { label: 'Sam', a: 9600, b: 4400 },
    { label: 'Dim', a: 7200, b: 3100 },
  ];

  const agents = [
    { name: 'Aïcha Bello', role: 'Caissière', init: 'AB', kind: 'em', pts: '128 400', tx: 342, trend: [12,18,15,22,28,24,31], up: true, d: '+14%' },
    { name: 'Yaw Owusu', role: 'Serveur', init: 'YO', kind: 'gd', pts: '96 250', tx: 287, trend: [20,18,22,19,24,21,26], up: true, d: '+8%' },
    { name: 'Fatou Diop', role: 'Caissière', init: 'FD', kind: 'tl', pts: '74 800', tx: 211, trend: [18,16,14,17,13,15,12], up: false, d: '-6%' },
    { name: 'Kwame Asante', role: 'Manager', init: 'KA', kind: 'tr', pts: '52 100', tx: 148, trend: [8,10,12,11,14,16,18], up: true, d: '+21%' },
  ];

  const feed = [
    { who: 'Aïcha Bello', init: 'AB', kind: 'em', act: 'a attribué des points à', target: 'Marie K.', amt: '+240', t: 'Il y a 2 min', pos: true },
    { who: 'Système', init: <Ico.zap size={14}/>, kind: 'gd', act: 'Palier Or atteint par', target: 'Junior T.', amt: 'Palier', t: 'Il y a 11 min', pos: null },
    { who: 'Yaw Owusu', init: 'YO', kind: 'gd', act: 'a validé une récompense', target: 'Café offert', amt: '−1 500', t: 'Il y a 23 min', pos: false },
    { who: 'Fatou Diop', init: 'FD', kind: 'tl', act: 'a enrôlé un nouveau client', target: 'Paul N.', amt: 'Nouveau', t: 'Il y a 38 min', pos: null },
    { who: 'Aïcha Bello', init: 'AB', kind: 'em', act: 'a attribué des points à', target: 'Sandra M.', amt: '+180', t: 'Il y a 51 min', pos: true },
  ];

  const rules = [
    { name: 'Achat standard', desc: '1 pt par 100 FCFA dépensé', tag: 'Base', kind: 'emerald', on: true },
    { name: 'Happy hour', desc: 'Points x2 · 17h–19h en semaine', tag: 'Multiplicateur', kind: 'gold', on: true },
    { name: 'Anniversaire client', desc: '+500 pts bonus le jour J', tag: 'Bonus', kind: 'terra', on: false },
  ];

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Welcome banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 30, color: 'var(--heading)', lineHeight: 1.1 }}>
            Bonjour, Kofi 👋
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 4 }}>
            Voici l'activité de fidélité de <strong style={{ color: 'var(--body)' }}>Chez Mama</strong> — semaine du 25 mai.
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => toast('Rapport exporté', 'Le PDF hebdomadaire a été généré.', 'gd')}>
          <Ico.download size={15}/> Exporter
        </button>
        <select className="select" style={{ width: 'auto', padding: '9px 12px', fontSize: 13 }}>
          <option>Toute l'enseigne</option>
          <option>Akwa</option><option>Bonanjo</option><option>Bonamoussadi</option>
        </select>
        <button className="btn btn-primary btn-lg" onClick={() => openEditor()}>
          <Ico.plus size={16}/> Nouvelle règle de points
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label="Points distribués" value="412k" delta="+18,2%" up color="var(--e2)" spark={[20,28,24,32,30,38,44]} sparkColor="#1FA971"/>
        <KPI label="Clients actifs" value="1 248" delta="+6,4%" up color="var(--g2)" spark={[40,42,45,44,48,52,56]} sparkColor="#C89B3C"/>
        <KPI label="Récompenses validées" value="384" delta="+11,0%" up color="var(--tl2)" spark={[10,14,12,18,16,22,26]} sparkColor="#0F766E"/>
        <KPI label="Taux de rétention" value="68" unit="%" delta="−2,1%" up={false} color="var(--t2)" spark={[70,69,71,68,67,69,68]} sparkColor="#C26D52"/>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Activity chart */}
          <div className="card">
            <div className="card-head">
              <div className="grow">
                <h3>Activité de fidélité</h3>
                <div className="sub">Points distribués vs. récompensés cette semaine</div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--e2)' }}/> Distribués
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--g2)' }}/> Récompensés
                </span>
                <select className="select" style={{ width: 'auto', padding: '5px 10px', fontSize: 12 }}>
                  <option>7 derniers jours</option>
                  <option>30 jours</option>
                </select>
              </div>
            </div>
            <div className="card-body">
              <BarChart data={monthBars} height={210}/>
            </div>
          </div>

          {/* Top agents */}
          <div className="card">
            <div className="card-head">
              <div className="grow">
                <h3>Performance de l'équipe</h3>
                <div className="sub">Classement par points attribués ce mois-ci</div>
              </div>
              <button className="btn btn-soft btn-sm" onClick={() => openModal('staff')}>
                <Ico.plus size={14}/> Agent
              </button>
            </div>
            <div className="card-body" style={{ paddingTop: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>#</th>
                    <th>Agent</th>
                    <th>Points attribués</th>
                    <th>Transactions</th>
                    <th>Tendance 7j</th>
                    <th style={{ textAlign: 'right' }}>Évolution</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a, i) => (
                    <tr key={i}>
                      <td className="num" style={{ color: 'var(--muted)' }}>{i+1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar initials={a.init} kind={a.kind}/>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--heading)', fontSize: 13 }}>{a.name}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{a.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num" style={{ fontWeight: 500 }}>{a.pts}</td>
                      <td className="num">{a.tx}</td>
                      <td><Sparkline points={a.trend} color={a.up ? '#1FA971' : '#C26D52'} width={70} height={24}/></td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ color: a.up ? 'var(--e3)' : 'var(--t3)', fontWeight: 600, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {a.up ? <Ico.arrowUp size={12}/> : <Ico.arrowDown size={12}/>}{a.d}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* QR card */}
          <div className="card">
            <div className="card-head">
              <div className="grow"><h3>QR d'enrôlement</h3><div className="sub">À afficher en caisse</div></div>
            </div>
            <div className="card-body">
              <div className="qr-box">
                <QRGrid pattern={QR_PATTERN}/>
                <div style={{ minWidth: 0 }}>
                  <div className="qr-name">Chez Mama</div>
                  <div className="qr-slug">jubelee.app/chez-mama</div>
                  <div className="qr-actions">
                    <button className="qr-btn" onClick={() => toast('QR téléchargé', 'Format PNG haute résolution.', 'gd')}><Ico.download size={13}/> PNG</button>
                    <button className="qr-btn" onClick={() => toast('Lien copié', 'jubelee.app/chez-mama', 'em')}><Ico.copy size={13}/> Copier</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active rules */}
          <div className="card">
            <div className="card-head">
              <div className="grow"><h3>Règles actives</h3><div className="sub">Ordre de priorité</div></div>
              <button className="btn btn-soft btn-sm" onClick={() => openEditor()}><Ico.plus size={14}/></button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rules.map((r, i) => (
                <div key={i} className={`rule-row ${r.on ? '' : 'disabled'}`}>
                  <span className="rule-rank">{i+1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--heading)' }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{r.desc}</div>
                  </div>
                  <Pill kind={r.kind}>{r.tag}</Pill>
                  <Switch on={r.on} onChange={() => toast(r.on ? 'Règle désactivée' : 'Règle activée', r.name, r.on ? 'tr' : 'em')}/>
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="card">
            <div className="card-head">
              <div className="grow"><h3>Activité récente</h3><div className="sub">Temps réel</div></div>
              <span className="pill pill-emerald pill-dot">Live</span>
            </div>
            <div className="card-body" style={{ paddingTop: 0 }}>
              {feed.map((f, i) => (
                <div key={i} className="feed-row">
                  <Avatar initials={f.init} kind={f.kind}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="feed-title">
                      <strong>{f.who}</strong> {f.act} <strong>{f.target}</strong>
                    </div>
                    <div className="feed-meta">{f.t}</div>
                  </div>
                  <span className="feed-amt" style={{ color: f.pos === true ? 'var(--e3)' : f.pos === false ? 'var(--t3)' : 'var(--muted)' }}>{f.amt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
