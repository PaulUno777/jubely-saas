/* eslint-disable */
const Rules = ({ toast, openModal, confirm, plan, openEditor }) => {
  const [tab, setTab] = React.useState('rules');
  const advanced = PLANS.find(p => p.id === plan)?.advanced;
  const createRule = () => openEditor();

  const rules = [
    { name: 'Achat standard', desc: '1 point attribué par tranche de 100 FCFA dépensée', tag: 'Base', kind: 'emerald', on: true, scope: 'Tous les clients', boutiques: 'all', earned: '284k pts', triggers: '8 420' },
    { name: 'Happy hour', desc: 'Multiplicateur x2 sur les points · 17h–19h, lun–ven', tag: 'Multiplicateur', kind: 'gold', on: true, scope: 'En boutique', boutiques: ['akwa','bonanjo'], earned: '62k pts', triggers: '1 240' },
    { name: 'Première visite', desc: '+200 points de bienvenue au premier achat', tag: 'Bonus', kind: 'teal', on: true, scope: 'Nouveaux clients', boutiques: 'all', earned: '38k pts', triggers: '190' },
    { name: 'Anniversaire client', desc: '+500 points bonus le jour de l\u2019anniversaire', tag: 'Bonus', kind: 'terra', on: false, scope: 'Clients enrôlés', boutiques: ['akwa'], earned: '12k pts', triggers: '24' },
  ];

  const tiers = [
    { name: 'Bronze', cls: 'tier-bronze', min: '0', perks: 'Accès au programme · enrôlement', members: 642, color: '#B07A4A' },
    { name: 'Argent', cls: 'tier-silver', min: '5 000', perks: '−5% sur l\u2019addition · accès file prioritaire', members: 384, color: '#9AA0A6' },
    { name: 'Or', cls: 'tier-or', min: '15 000', perks: 'Café offert chaque semaine · dessert anniversaire', members: 168, color: '#C89B3C' },
    { name: 'Platine', cls: 'tier-plat', min: '40 000', perks: 'Table réservée · −15% · invitations événements', members: 54, color: '#0F766E' },
  ];

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--heading)' }}>Règles de points</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Définissez comment vos clients gagnent des points et montent en palier.</div>
        </div>
        <button className="btn btn-ghost" onClick={() => setTab('sim')}><Ico.eye size={15}/> Simuler</button>
        <button className="btn btn-primary" onClick={createRule}><Ico.plus size={16}/> {advanced ? 'Éditeur de règle' : 'Créer une règle'}</button>
      </div>

      {/* Plan-aware banner */}
      {advanced ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'var(--g0)', border: '1px solid var(--g1)' }}>
          <div className="ava ava-gd" style={{ width: 34, height: 34 }}><Ico.zap size={16}/></div>
          <div style={{ flex: 1, fontSize: 12.5, color: 'var(--g4)' }}><strong>Éditeur visuel débloqué</strong> — créez des règles conditionnelles (ET/OU, paliers, horaires) avec votre plan {PLANS.find(p => p.id === plan).name}.</div>
          <button className="btn btn-gold btn-sm" onClick={() => openEditor()}>Ouvrir l'éditeur</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="ava ava-nu" style={{ width: 34, height: 34, color: 'var(--n6)' }}><Ico.lock size={16}/></div>
          <div style={{ flex: 1, fontSize: 12.5, color: 'var(--muted)' }}>Vous utilisez l'éditeur <strong style={{ color: 'var(--body)' }}>basique</strong> du plan Standard. Passez à Growth pour l'éditeur visuel conditionnel.</div>
          <button className="btn btn-soft btn-sm" onClick={() => toast('Abonnement', 'Ouvrez l\u2019onglet Abonnement pour changer de plan.', 'gd')}>Comparer les plans</button>
        </div>
      )}

      <Tabs items={[
        { id: 'rules', label: 'Règles d\u2019attribution', count: rules.length },
        { id: 'tiers', label: 'Paliers de fidélité', count: tiers.length },
        { id: 'sim', label: 'Simulation & conflits' },
      ]} active={tab} onChange={setTab}/>

      {tab === 'sim' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <ConflictPanel rules={SIM_RULES}/>
          <Simulator rules={SIM_RULES}/>
        </div>
      )}

      {tab === 'rules' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          <div className="card">
            <div className="card-head">
              <div className="grow"><h3>Ordre d'application</h3><div className="sub">Glissez pour réordonner — les règles s'appliquent de haut en bas</div></div>
              <button className="btn btn-soft btn-sm" onClick={createRule}><Ico.plus size={14}/> Règle</button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rules.map((r, i) => (
                <div key={i} className={`rule-row ${r.on ? '' : 'disabled'}`} style={{ padding: '14px 16px' }}>
                  <span className="drag"><Ico.drag size={16}/></span>
                  <span className="rule-rank">{i+1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--heading)' }}>{r.name}</span>
                      <Pill kind={r.kind}>{r.tag}</Pill>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{r.desc}</div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11.5, color: 'var(--soft)' }}><Ico.users size={11} style={{ verticalAlign: -1, marginRight: 4 }}/>{r.scope}</span>
                      <ScopeTag value={r.boutiques}/>
                      <span style={{ fontSize: 11.5, color: 'var(--soft)' }}><Ico.star size={11} style={{ verticalAlign: -1, marginRight: 4 }}/>{r.earned} générés</span>
                      <span style={{ fontSize: 11.5, color: 'var(--soft)' }}><Ico.zap size={11} style={{ verticalAlign: -1, marginRight: 4 }}/>{r.triggers} déclenchements</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                    <Switch on={r.on} onChange={() => toast(r.on ? 'Règle désactivée' : 'Règle activée', r.name, r.on ? 'tr' : 'em')}/>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => openEditor(r)}><Ico.edit size={13}/></button>
                      <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => confirm('delete-rule', r)}><Ico.trash size={13}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ background: 'linear-gradient(160deg, #FBF0D4, #FFFFFF 60%)' }}>
              <div className="card-body" style={{ padding: 18 }}>
                <div className="ava ava-gd" style={{ width: 38, height: 38 }}><Ico.spark size={18}/></div>
                <div className="serif" style={{ fontSize: 20, color: 'var(--heading)', marginTop: 12 }}>Comment ça marche</div>
                <div style={{ fontSize: 12.5, color: 'var(--g4)', marginTop: 6, lineHeight: 1.55 }}>
                  Les règles s'évaluent dans l'ordre. Les multiplicateurs s'appliquent après les règles de base. Désactivez une règle sans la supprimer pour la mettre en pause.
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><div className="grow"><h3>Impact ce mois-ci</h3></div></div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0 4px' }}>
                  <Donut size={150} thickness={24} centerLabel="396k" centerSub="POINTS"
                    data={[
                      { label: 'Standard', value: 284, color: '#1FA971' },
                      { label: 'Happy hour', value: 62, color: '#C89B3C' },
                      { label: 'Bienvenue', value: 38, color: '#0F766E' },
                      { label: 'Autres', value: 12, color: '#C26D52' },
                    ]}/>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {[['Standard','#1FA971','284k'],['Happy hour','#C89B3C','62k'],['Bienvenue','#0F766E','38k'],['Anniversaire','#C26D52','12k']].map(([l,c,v]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: c }}/>
                      <span style={{ color: 'var(--body)' }}>{l}</span>
                      <span className="num" style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'tiers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {tiers.map((t, i) => (
            <div key={i} className="card">
              <div className="card-body" style={{ padding: 18, display: 'flex', gap: 14 }}>
                <div style={{ width: 6, borderRadius: 6, background: t.color, flex: 'none' }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="serif" style={{ fontSize: 22, color: 'var(--heading)' }}>{t.name}</span>
                    <span className="pill pill-neutral" style={{ marginLeft: 'auto' }}>{t.members} membres</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>À partir de <span className="num" style={{ color: 'var(--body)', fontWeight: 500 }}>{t.min} pts</span></div>
                  <div style={{ fontSize: 12.5, color: 'var(--body)', marginTop: 10, lineHeight: 1.5, paddingTop: 10, borderTop: '1px solid var(--border)' }}>{t.perks}</div>
                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditor()}><Ico.edit size={13}/> Modifier le palier</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

window.Rules = Rules;
