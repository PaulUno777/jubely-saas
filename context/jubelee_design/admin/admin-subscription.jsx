/* eslint-disable */
const Subscription = ({ plan, setPlan, toast }) => {
  const [selected, setSelected] = React.useState(plan);
  const [pay, setPay] = React.useState('momo'); // momo | orange | stripe
  const [period, setPeriod] = React.useState('month');
  React.useEffect(() => setSelected(plan), [plan]);

  const chosen = PLANS.find(p => p.id === selected);
  const isChange = selected !== plan;

  const confirmPlan = () => {
    setPlan(selected);
    const method = pay === 'momo' ? 'MTN MoMo' : pay === 'orange' ? 'Orange Money' : 'carte bancaire';
    toast('Abonnement mis à jour', `Plan ${chosen.name} · paiement par ${method}.`, 'em');
  };

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--heading)' }}>Abonnement</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Changez de plan pour débloquer plus de fonctionnalités — l'interface s'adapte instantanément.</div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 3, borderRadius: 10 }}>
          {[['month','Mensuel'],['year','Annuel −15%']].map(([id,l]) => (
            <button key={id} className="btn btn-sm" style={{ background: period === id ? 'var(--surface)' : 'transparent', color: period === id ? 'var(--heading)' : 'var(--muted)', boxShadow: period === id ? 'var(--shadow-card)' : 'none' }} onClick={() => setPeriod(id)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Current plan banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1A1610, #2A2318)', color: '#F2EBDC', border: 'none' }}>
        <div className="card-body" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(200,155,60,0.2)', color: 'var(--g1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico.spark size={22}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, color: 'rgba(232,226,213,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Plan actuel</div>
            <div className="serif" style={{ fontSize: 26, color: '#F2EBDC', lineHeight: 1.1 }}>{PLANS.find(p => p.id === plan).name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12.5, color: 'rgba(232,226,213,0.7)' }}>{PLANS.find(p => p.id === plan).limits}</div>
            <div style={{ fontSize: 12, color: 'rgba(232,226,213,0.5)', marginTop: 3 }}>Prochain prélèvement · 1 juin 2026</div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {PLANS.map(p => {
          const active = selected === p.id;
          const current = plan === p.id;
          return (
            <div key={p.id} className="card" onClick={() => setSelected(p.id)} style={{
              cursor: 'pointer', position: 'relative', overflow: 'visible',
              border: active ? `1.5px solid ${p.color}` : '1px solid var(--border)',
              boxShadow: active ? '0 0 0 4px ' + p.color + '1a, var(--shadow-card)' : 'var(--shadow-card)',
            }}>
              {p.popular && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: p.color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>★ Populaire</div>}
              <div className="card-body" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="serif" style={{ fontSize: 24, color: 'var(--heading)' }}>{p.name}</span>
                  {current && <Pill kind="emerald" dot>Actuel</Pill>}
                  <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', border: active ? `6px solid ${p.color}` : '2px solid var(--n4)' }}/>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{p.tagline}</div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span className="serif" style={{ fontSize: 34, color: 'var(--heading)' }}>{period === 'year' ? Math.round(parseInt(p.price.replace(/\s/g,''))*0.85).toLocaleString('fr-FR') : p.price}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>FCFA / mois</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>{p.limits}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: f.endsWith(':') ? 'var(--muted)' : 'var(--body)', fontWeight: f.endsWith(':') ? 600 : 400 }}>
                      {!f.endsWith(':') && <span style={{ color: p.color, flex: 'none', marginTop: 1 }}><Ico.check size={14}/></span>}
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment + checkout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><div className="grow"><h3>Moyen de paiement</h3><div className="sub">Mobile Money est crédité instantanément</div></div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PayOption id="momo" cur={pay} set={setPay} title="MTN Mobile Money" sub="+237 6 •• •• 56" color="#FFCC00" badge="MoMo" dark/>
            <PayOption id="orange" cur={pay} set={setPay} title="Orange Money" sub="+237 6 •• •• 14" color="#FF6600" badge="OM"/>
            <PayOption id="stripe" cur={pay} set={setPay} title="Carte bancaire" sub="Visa · Mastercard — via Stripe" color="#635BFF" badge={<Ico.card size={16}/>}/>
            {pay === 'momo' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, padding: 14, background: 'var(--n1)', borderRadius: 12 }}>
                <div><label className="lbl">Numéro MoMo</label><input className="input num" defaultValue="+237 6 99 00 11 56"/></div>
                <div style={{ alignSelf: 'flex-end' }}><button className="btn btn-soft" onClick={() => toast('Code envoyé', 'Confirmez sur votre téléphone.', 'gd')}>Vérifier</button></div>
              </div>
            )}
            {pay === 'stripe' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 10, padding: 14, background: 'var(--n1)', borderRadius: 12 }}>
                <div><label className="lbl">Numéro de carte</label><input className="input num" placeholder="4242 4242 4242 4242"/></div>
                <div><label className="lbl">Expire</label><input className="input num" placeholder="12/28"/></div>
                <div><label className="lbl">CVC</label><input className="input num" placeholder="•••"/></div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="grow"><h3>Récapitulatif</h3></div></div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' }}><span style={{ color: 'var(--muted)' }}>Plan {chosen.name}</span><span className="num" style={{ color: 'var(--heading)' }}>{period === 'year' ? Math.round(parseInt(chosen.price.replace(/\s/g,''))*0.85).toLocaleString('fr-FR') : chosen.price} F</span></div>
            {period === 'year' && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' }}><span style={{ color: 'var(--e3)' }}>Remise annuelle</span><span className="num" style={{ color: 'var(--e3)' }}>−15%</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border)' }}><span style={{ color: 'var(--muted)' }}>Facturation</span><span style={{ color: 'var(--heading)' }}>{period === 'year' ? 'Annuelle' : 'Mensuelle'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '12px 0 4px' }}><span style={{ fontWeight: 600, color: 'var(--heading)' }}>Total</span><span className="serif" style={{ fontSize: 24, color: 'var(--heading)' }}>{period === 'year' ? Math.round(parseInt(chosen.price.replace(/\s/g,''))*0.85*12).toLocaleString('fr-FR') : chosen.price}<small style={{ fontSize: 13 }}> F</small></span></div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 14 }} onClick={confirmPlan}>
              {isChange ? <><Ico.zap size={15}/> Confirmer le changement</> : <><Ico.check size={15}/> Plan actif</>}
            </button>
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Ico.lock size={11}/> Paiement sécurisé · annulable à tout moment</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PayOption = ({ id, cur, set, title, sub, color, badge, dark }) => (
  <div onClick={() => set(id)} style={{
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
    border: cur === id ? '1.5px solid var(--e2)' : '1px solid var(--border-2)',
    background: cur === id ? 'var(--e0)' : 'var(--surface)',
  }}>
    <div style={{ width: 40, height: 30, borderRadius: 7, background: color, color: dark ? '#1A1610' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flex: 'none' }}>{badge}</div>
    <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--heading)' }}>{title}</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{sub}</div></div>
    <div style={{ width: 18, height: 18, borderRadius: '50%', border: cur === id ? '5px solid var(--e2)' : '2px solid var(--n4)', flex: 'none' }}/>
  </div>
);

window.Subscription = Subscription;
