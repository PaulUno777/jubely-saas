/* eslint-disable */
const Analytics = ({ toast }) => {
  const [range, setRange] = React.useState('30j');

  const lineLabels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--heading)' }}>Analytics</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Comprenez le comportement de vos clients fidèles.</div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 3, borderRadius: 10 }}>
          {['7j', '30j', '90j', 'Année'].map(r => (
            <button key={r} className="btn btn-sm" style={{
              background: range === r ? 'var(--surface)' : 'transparent',
              color: range === r ? 'var(--heading)' : 'var(--muted)',
              boxShadow: range === r ? 'var(--shadow-card)' : 'none',
            }} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
        <button className="btn btn-ghost"><Ico.download size={15}/> Exporter CSV</button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Fréquence de visite', v: '2,4', u: '/sem', d: '+0,3', up: true, c: '#1FA971' },
          { l: 'Panier moyen', v: '4 850', u: 'F', d: '+12%', up: true, c: '#C89B3C' },
          { l: 'Points / client', v: '330', u: '', d: '+8%', up: true, c: '#0F766E' },
          { l: 'Clients dormants', v: '184', u: '', d: '+5%', up: false, c: '#C26D52' },
        ].map((s, i) => (
          <div key={i} className="kpi">
            <div className="kpi-bar-left" style={{ background: s.c }}/>
            <div style={{ paddingLeft: 8 }}>
              <div className="kpi-label">{s.l}</div>
              <div className="kpi-value" style={{ fontSize: 30 }}>{s.v}<small>{s.u}</small></div>
              <div className={`kpi-delta ${s.up ? 'up' : 'down'}`}>{s.up ? <Ico.trendUp size={13}/> : <Ico.trendDown size={13}/>}{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* Growth chart */}
        <div className="card">
          <div className="card-head">
            <div className="grow"><h3>Croissance des membres</h3><div className="sub">Nouveaux clients enrôlés vs. réactivés</div></div>
            <div style={{ display: 'flex', gap: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#1FA971' }}/> Nouveaux</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#0F766E' }}/> Réactivés</span>
            </div>
          </div>
          <div className="card-body">
            <LineChart height={240} labels={lineLabels} series={[
              { color: '#1FA971', data: [120, 180, 165, 240, 280, 320, 360, 420] },
              { color: '#0F766E', data: [40, 55, 48, 70, 62, 85, 96, 110] },
            ]}/>
          </div>
        </div>

        {/* Tier distribution */}
        <div className="card">
          <div className="card-head"><div className="grow"><h3>Répartition par palier</h3></div></div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 12px' }}>
              <Donut size={160} thickness={26} centerLabel="1 248" centerSub="MEMBRES" data={[
                { label: 'Bronze', value: 642, color: '#B07A4A' },
                { label: 'Argent', value: 384, color: '#9AA0A6' },
                { label: 'Or', value: 168, color: '#C89B3C' },
                { label: 'Platine', value: 54, color: '#0F766E' },
              ]}/>
            </div>
            {[['Bronze','#B07A4A','642','51%'],['Argent','#9AA0A6','384','31%'],['Or','#C89B3C','168','13%'],['Platine','#0F766E','54','5%']].map(([l,c,v,p]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, padding: '5px 0' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: c }}/>
                <span style={{ color: 'var(--body)' }}>{l}</span>
                <span className="num" style={{ marginLeft: 'auto', color: 'var(--heading)', fontWeight: 500 }}>{v}</span>
                <span className="num" style={{ color: 'var(--muted)', width: 36, textAlign: 'right' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {/* Heatmap */}
        <div className="card">
          <div className="card-head"><div className="grow"><h3>Affluence par heure</h3><div className="sub">Moyenne hebdomadaire</div></div></div>
          <div className="card-body">
            <HeatMap/>
          </div>
        </div>

        {/* Top rewards */}
        <div className="card">
          <div className="card-head"><div className="grow"><h3>Récompenses populaires</h3></div></div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            {[
              { n: 'Café offert', c: 412, max: 412, k: '#1FA971' },
              { n: '−5% addition', c: 286, max: 412, k: '#C89B3C' },
              { n: 'Dessert maison', c: 198, max: 412, k: '#0F766E' },
              { n: 'Boisson offerte', c: 134, max: 412, k: '#C26D52' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '9px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--body)', fontWeight: 500 }}>{r.n}</span>
                  <span className="num" style={{ color: 'var(--muted)' }}>{r.c}</span>
                </div>
                <div style={{ height: 7, background: 'var(--n1)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(r.c/r.max)*100}%`, height: '100%', background: r.k, borderRadius: 4 }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention cohort */}
        <div className="card">
          <div className="card-head"><div className="grow"><h3>Rétention</h3><div className="sub">% revenu après enrôlement</div></div></div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            {[
              { m: 'Mois 1', p: 100 }, { m: 'Mois 2', p: 78 }, { m: 'Mois 3', p: 64 },
              { m: 'Mois 4', p: 58 }, { m: 'Mois 5', p: 51 }, { m: 'Mois 6', p: 47 },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <span style={{ width: 52, fontSize: 12, color: 'var(--muted)' }}>{r.m}</span>
                <div style={{ flex: 1, height: 22, background: 'var(--n1)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${r.p}%`, height: '100%', background: `color-mix(in oklab, var(--tl2) ${r.p}%, var(--tl1))`, borderRadius: 6 }}/>
                </div>
                <span className="num" style={{ width: 36, textAlign: 'right', fontSize: 12.5, color: 'var(--heading)', fontWeight: 500 }}>{r.p}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const HeatMap = () => {
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const hours = ['8h', '11h', '14h', '17h', '20h'];
  // intensity 0-3
  const data = [
    [1,2,1,2,3], [1,2,1,2,3], [1,2,1,3,3], [1,2,2,3,3],
    [2,3,2,3,3], [3,3,3,3,2], [2,3,3,2,1],
  ];
  const shades = ['var(--n1)', 'var(--e0)', 'var(--e1)', 'var(--e2)'];
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginLeft: 30, marginBottom: 6 }}>
        {hours.map(h => <div key={h} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--muted)' }}>{h}</div>)}
      </div>
      {data.map((row, di) => (
        <div key={di} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <span style={{ width: 24, fontSize: 11, color: 'var(--muted)' }}>{days[di]}</span>
          {row.map((v, hi) => (
            <div key={hi} style={{ flex: 1, height: 22, borderRadius: 5, background: shades[v] }}/>
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end', fontSize: 10.5, color: 'var(--muted)' }}>
        Moins
        {shades.map((s, i) => <span key={i} style={{ width: 14, height: 14, borderRadius: 4, background: s }}/>)}
        Plus
      </div>
    </div>
  );
};

window.Analytics = Analytics;
