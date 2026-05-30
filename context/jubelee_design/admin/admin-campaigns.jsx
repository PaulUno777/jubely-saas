/* eslint-disable */
const Campaigns = ({ toast, openModal, confirm }) => {
  const campaigns = [
    { name: 'Double points week-end', type: 'Multiplicateur', kind: 'gold', status: 'live', reach: 1248, redeemed: 312, budget: 68, period: '24 mai – 31 mai', desc: 'x2 sur tous les achats samedi & dimanche', boutiques: 'all', proximity: false, spark: [10,18,24,30,28,40,52] },
    { name: 'Reviens nous voir', type: 'Réactivation', kind: 'teal', status: 'scheduled', reach: 420, redeemed: 0, budget: 0, period: '1 juin – 15 juin', desc: '+1 000 pts aux clients inactifs depuis 30j', boutiques: ['akwa','bonanjo'], proximity: false, spark: [4,6,5,8,7,9,11] },
    { name: 'Happy hour Bonamoussadi', type: 'Proximité', kind: 'terra', status: 'draft', reach: 0, redeemed: 0, budget: 0, period: 'Brouillon', desc: 'Push aux clients à moins de 2 km de la boutique', boutiques: ['bonamoussadi'], proximity: true, spark: [2,3,2,4,3,5,4] },
    { name: 'Parrainage entre amis', type: 'Acquisition', kind: 'emerald', status: 'ended', reach: 890, redeemed: 204, budget: 100, period: '1 avr – 30 avr', desc: '+500 pts au parrain et au filleul', boutiques: 'all', proximity: false, spark: [30,28,24,20,16,12,8] },
  ];

  const statusMap = {
    live: { p: <Pill kind="emerald" dot>En cours</Pill> },
    scheduled: { p: <Pill kind="gold" dot>Programmée</Pill> },
    draft: { p: <Pill kind="neutral">Brouillon</Pill> },
    ended: { p: <Pill kind="neutral" dot>Terminée</Pill> },
  };

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--heading)' }}>Campagnes & incitations</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Boostez l'engagement avec des promotions ciblées et limitées dans le temps.</div>
        </div>
        <button className="btn btn-ghost"><Ico.cal size={15}/> Calendrier</button>
        <button className="btn btn-primary" onClick={() => openModal('campaign')}><Ico.plus size={16}/> Nouvelle campagne</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Campagnes actives', v: '1', d: '+1 programmée', c: 'var(--e2)' },
          { l: 'Portée totale', v: '2 558', d: 'clients touchés', c: 'var(--g2)' },
          { l: 'Récompenses utilisées', v: '516', d: 'taux 41%', c: 'var(--tl2)' },
          { l: 'Points engagés', v: '184k', d: 'ce trimestre', c: 'var(--t2)' },
        ].map((s, i) => (
          <div key={i} className="kpi">
            <div className="kpi-bar-left" style={{ background: s.c }}/>
            <div style={{ paddingLeft: 8 }}>
              <div className="kpi-label">{s.l}</div>
              <div className="serif" style={{ fontSize: 28, color: 'var(--heading)', marginTop: 6 }}>{s.v}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {campaigns.map((c, i) => (
          <div key={i} className="card">
            <div className="card-body" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Pill kind={c.kind}>{c.type}</Pill>
                    {statusMap[c.status].p}
                  </div>
                  <div className="serif" style={{ fontSize: 22, color: 'var(--heading)', marginTop: 10 }}>{c.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.45 }}>{c.desc}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    <ScopeTag value={c.boutiques}/>
                    {c.proximity && <span className="pill pill-teal"><Ico.globe size={11}/> Proximité · 2 km</span>}
                  </div>
                </div>
                <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => openModal('campaign', c)}><Ico.more size={16}/></button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 500, color: 'var(--heading)' }}>{c.reach.toLocaleString('fr-FR')}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Portée</div>
                </div>
                <div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 500, color: 'var(--heading)' }}>{c.redeemed}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Utilisées</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textAlign: 'right' }}><Ico.cal size={11} style={{ verticalAlign: -1, marginRight: 4 }}/>{c.period}</div>
                  <Sparkline points={c.spark} color={c.status === 'ended' ? '#C26D52' : '#1FA971'} width={120} height={28}/>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {c.status === 'draft' && <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => toast('Campagne lancée', c.name, 'em')}><Ico.send size={13}/> Lancer</button>}
                {c.status === 'live' && <button className="btn btn-soft btn-sm" style={{ flex: 1 }} onClick={() => toast('Campagne mise en pause', c.name, 'tr')}><Ico.clock size={13}/> Mettre en pause</button>}
                {c.status === 'scheduled' && <button className="btn btn-soft btn-sm" style={{ flex: 1 }} onClick={() => openModal('campaign', c)}><Ico.edit size={13}/> Modifier</button>}
                {c.status === 'ended' && <button className="btn btn-soft btn-sm" style={{ flex: 1 }} onClick={() => toast('Campagne dupliquée', c.name, 'em')}><Ico.copy size={13}/> Dupliquer</button>}
                <button className="btn btn-ghost btn-sm" onClick={() => openModal('campaign', c)}>Détails</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

window.Campaigns = Campaigns;
