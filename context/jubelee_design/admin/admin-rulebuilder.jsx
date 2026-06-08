/* eslint-disable */
const PALETTE = {
  triggers: [
    { type: 'transaction', label: 'Transaction', sub: 'À chaque achat', icon: <Ico.activity size={15}/>, kind: 'em' },
    { type: 'enroll', label: 'Enrôlement', sub: '1ère inscription', icon: <Ico.user size={15}/>, kind: 'tl' },
    { type: 'birthday', label: 'Anniversaire', sub: 'Jour J du client', icon: <Ico.gift size={15}/>, kind: 'gd' },
  ],
  conditions: [
    { type: 'amount', label: 'Montant', sub: 'Valeur achat', icon: <Ico.card size={15}/>, kind: 'em' },
    { type: 'weekday', label: 'Jour semaine', sub: 'Lun → Dim', icon: <Ico.cal size={15}/>, kind: 'tl' },
    { type: 'hours', label: 'Plage horaire', sub: 'Heure du jour', icon: <Ico.clock size={15}/>, kind: 'gd' },
    { type: 'tier', label: 'Palier client', sub: 'Bronze → Platine', icon: <Ico.award size={15}/>, kind: 'tr' },
    { type: 'visits', label: 'Nb. visites', sub: 'Total ce mois', icon: <Ico.refresh size={15}/>, kind: 'em' },
    { type: 'store', label: 'Boutique', sub: 'Emplacement', icon: <Ico.store size={15}/>, kind: 'tl' },
  ],
  actions: [
    { type: 'mult', label: 'Multiplier pts', sub: '×2, ×3…', icon: <Ico.zap size={15}/>, kind: 'gd' },
    { type: 'flat', label: 'Bonus fixe', sub: '+ N points', icon: <Ico.plus size={15}/>, kind: 'em' },
    { type: 'reward', label: 'Débloquer prime', sub: 'Activer récompense', icon: <Ico.gift size={15}/>, kind: 'tl' },
    { type: 'notify', label: 'Notifier client', sub: 'SMS / Push', icon: <Ico.bell size={15}/>, kind: 'tr' },
    { type: 'tierup', label: 'Monter palier', sub: 'Upgrade immédiat', icon: <Ico.award size={15}/>, kind: 'em' },
  ],
};

const PaletteBlock = ({ block, onAdd }) => (
  <div onClick={() => onAdd(block)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', transition: 'background .12s' }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--n1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
    <div className={`ava ava-${block.kind}`} style={{ width: 30, height: 30, borderRadius: 8 }}>{block.icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--heading)' }}>{block.label}</div><div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{block.sub}</div></div>
    <Ico.plus size={14} style={{ color: 'var(--n4)' }}/>
  </div>
);

// ===== PAGE WRAPPER: chooses basic vs advanced editor by plan =====
const RuleEditorPage = ({ plan, data, onBack, toast }) => {
  const advanced = PLANS.find(p => p.id === plan)?.advanced;
  return (
    <div style={{ padding: '20px 28px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="icon-btn" onClick={onBack} title="Retour"><Ico.chevR size={16} style={{ transform: 'rotate(180deg)' }}/></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={onBack}>Règles de points <Ico.chevR size={11}/> <span style={{ color: 'var(--body)' }}>Éditeur</span></div>
          <div className="serif" style={{ fontSize: 24, color: 'var(--heading)', lineHeight: 1.1 }}>{data ? data.name : (advanced ? 'Nouvelle règle conditionnelle' : 'Nouvelle règle de points')}</div>
        </div>
        <span className={`pill ${advanced ? 'pill-gold' : 'pill-neutral'}`}>{advanced ? <><Ico.zap size={12}/> Éditeur visuel · Growth</> : <><Ico.lock size={12}/> Éditeur basique · Standard</>}</span>
      </div>
      {advanced ? <AdvancedEditor data={data} onBack={onBack} toast={toast}/> : <BasicEditor data={data} onBack={onBack} toast={toast}/>}
    </div>
  );
};

// ===== BASIC EDITOR (Standard plan) — simple cumul rule, as a page =====
const BasicEditor = ({ data, onBack, toast }) => {
  const [type, setType] = React.useState(data?.tag === 'Multiplicateur' ? 'mult' : data?.tag === 'Bonus' ? 'bonus' : 'base');
  const [name, setName] = React.useState(data?.name || '');
  const [days, setDays] = React.useState([0,1,2,3,4]);
  const [pts, setPts] = React.useState(1);
  const [per, setPer] = React.useState(100);
  const [boutiques, setBoutiques] = React.useState(data?.boutiques || 'all');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <div className="card-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="lbl">Type de règle</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { id: 'base', t: 'Cumul standard', d: 'Points par montant', ic: <Ico.star size={16}/>, k: 'emerald' },
                  { id: 'mult', t: 'Multiplicateur', d: '×2, ×3 sur période', ic: <Ico.zap size={16}/>, k: 'gold' },
                  { id: 'bonus', t: 'Bonus', d: 'Points fixes', ic: <Ico.gift size={16}/>, k: 'teal' },
                ].map(o => (
                  <div key={o.id} onClick={() => setType(o.id)} style={{ padding: 14, borderRadius: 12, cursor: 'pointer', border: type === o.id ? '1.5px solid var(--e2)' : '1px solid var(--border-2)', background: type === o.id ? 'var(--e0)' : 'var(--surface)' }}>
                    <div className={`ava ava-${o.k}`} style={{ width: 34, height: 34 }}>{o.ic}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--heading)', marginTop: 10 }}>{o.t}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{o.d}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><label className="lbl">Nom de la règle</label><input className="input" placeholder="ex. Cumul standard" value={name} onChange={e => setName(e.target.value)}/></div>
              <div><label className="lbl">Cible (clients)</label><select className="select"><option>Tous les clients</option><option>Nouveaux clients</option><option>Clients enrôlés</option></select></div>
            </div>

            <BoutiqueScope value={boutiques} onChange={setBoutiques} help="Choisissez les points de vente où cette règle s'applique."/>

            {type === 'base' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: 14, background: 'var(--n1)', borderRadius: 12 }}>
                <div><label className="lbl">Points attribués</label><input className="input num" value={pts} onChange={e => setPts(+e.target.value||0)}/></div>
                <div><label className="lbl">Par tranche de (FCFA)</label><input className="input num" value={per} onChange={e => setPer(+e.target.value||1)}/></div>
                <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: 'var(--e3)', display: 'flex', alignItems: 'center', gap: 6 }}><Ico.info size={14}/> Un achat de 5 000 FCFA rapportera <strong style={{ marginLeft: 2 }}>{Math.floor(5000/per)*pts} points</strong>.</div>
              </div>
            )}
            {type === 'mult' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, padding: 14, background: 'var(--g0)', borderRadius: 12 }}>
                <div><label className="lbl">Multiplicateur</label><select className="select"><option>×2</option><option>×3</option><option>×5</option></select></div>
                <div><label className="lbl">De</label><input className="input" type="time" defaultValue="17:00"/></div>
                <div><label className="lbl">À</label><input className="input" type="time" defaultValue="19:00"/></div>
              </div>
            )}
            {type === 'bonus' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: 14, background: 'var(--tl0)', borderRadius: 12 }}>
                <div><label className="lbl">Points bonus</label><input className="input num" defaultValue="500"/></div>
                <div><label className="lbl">Déclencheur</label><select className="select"><option>Anniversaire</option><option>Première visite</option><option>Parrainage</option></select></div>
              </div>
            )}

            <div>
              <label className="lbl">Jours actifs</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {DAYS_FR.map((d, i) => { const on = days.includes(i); return (
                  <div key={d} onClick={() => setDays(on ? days.filter(x=>x!==i) : [...days, i])} style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', fontWeight: 500, background: on ? 'var(--e2)' : 'var(--surface-2)', color: on ? '#fff' : 'var(--muted)' }}>{d}</div>
                ); })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
              <Switch on={true} onChange={() => {}}/>
              <div><div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--heading)' }}>Activer immédiatement</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>La règle s'appliquera dès l'enregistrement.</div></div>
            </div>
          </div>
          <div className="modal-foot" style={{ borderRadius: '0 0 16px 16px' }}>
            <button className="btn btn-soft" onClick={onBack}>Annuler</button>
            <div className="grow"/>
            <button className="btn btn-primary" onClick={() => { onBack(); toast(data ? 'Règle mise à jour' : 'Règle créée', name || 'Nouvelle règle', 'em'); }}>{data ? 'Enregistrer' : 'Créer la règle'}</button>
          </div>
        </div>
      </div>

      {/* live preview */}
      <div className="card" style={{ position: 'sticky', top: 84 }}>
        <div className="card-head"><div className="grow"><h3>Aperçu</h3><div className="sub">Mise à jour en temps réel</div></div></div>
        <div className="card-body">
          <div style={{ padding: 16, borderRadius: 12, background: 'var(--n1)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--heading)' }}>{name || 'Sans nom'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
              {type === 'base' && <>Le client gagne <strong>{pts} point{pts>1?'s':''}</strong> par tranche de <strong>{per} FCFA</strong> dépensée.</>}
              {type === 'mult' && <>Les points sont <strong>multipliés</strong> pendant la plage horaire définie.</>}
              {type === 'bonus' && <>Le client reçoit un <strong>bonus de points fixe</strong> sur l'événement choisi.</>}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>{days.map(d => <span key={d} className="pill pill-neutral">{DAYS_FR[d]}</span>)}</div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <ScopeTag value={boutiques}/>
          </div>
          <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: 'var(--surface-2)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Ico.lock size={15} style={{ color: 'var(--g3)', flex: 'none', marginTop: 1 }}/>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>Besoin de conditions avancées (paliers, ET/OU, montant minimum) ? <strong style={{ color: 'var(--g4)' }}>Passez à Growth</strong> pour l'éditeur visuel.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== ADVANCED EDITOR (Growth+) — visual builder, as a page =====
const AdvancedEditor = ({ data, onBack, toast }) => {
  const [name, setName] = React.useState(data?.name || 'Double points week-end client Or+');
  const [trigger, setTrigger] = React.useState(PALETTE.triggers[0]);
  const [conditions, setConditions] = React.useState([
    { type: 'amount', op: '≥', value: 2000 },
    { type: 'weekday', days: [5,6] },
    { type: 'tier', tiers: ['or','platine'] },
  ]);
  const [logic, setLogic] = React.useState('ET');
  const [actions, setActions] = React.useState([
    { type: 'mult', factor: 2 },
    { type: 'notify', via: 'SMS' },
  ]);
  const [scope, setScope] = React.useState(data?.boutiques || 'all');
  const [showTest, setShowTest] = React.useState(false);

  const addCondition = (b) => setConditions(c => [...c, defaultCond(b.type)]);
  const addAction = (b) => setActions(a => [...a, defaultAction(b.type)]);
  const rmCond = (i) => setConditions(c => c.filter((_, j) => j !== i));
  const rmAct = (i) => setActions(a => a.filter((_, j) => j !== i));

  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)' }}>
        <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Glissez des blocs depuis la palette · la règle se traduit en temps réel</div>
        <div className="grow"/>
        <button className="btn btn-ghost btn-sm" onClick={() => toast('JSON copié', 'Définition exportée.', 'gd')}>{'{ }'} Voir JSON</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', minHeight: 560 }}>
        {/* palette */}
        <div style={{ borderRight: '1px solid var(--border)', padding: '14px 12px', background: 'var(--n1)' }}>
          {[['Déclencheurs','triggers'],['Conditions','conditions'],['Actions','actions']].map(([title, key]) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, padding: '4px 10px 6px' }}>{title}</div>
              {PALETTE[key].map(b => <PaletteBlock key={b.type} block={b} onAdd={key === 'triggers' ? setTrigger : key === 'conditions' ? addCondition : addAction}/>)}
            </div>
          ))}
        </div>

        {/* canvas */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input className="input" value={name} onChange={e => setName(e.target.value)} style={{ fontSize: 16, fontWeight: 600, padding: '12px 14px' }}/>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--e1)', background: 'var(--e0)' }}>
            <div className="ava ava-em" style={{ width: 34, height: 34 }}>{trigger.icon}</div>
            <div><div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--heading)' }}>Déclencheur — {trigger.label}</div><div style={{ fontSize: 12, color: 'var(--e4)' }}>Cette règle s'active {trigger.type === 'transaction' ? 'à chaque achat enregistré' : trigger.sub.toLowerCase()}</div></div>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border-2)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Ico.store size={15} style={{ color: 'var(--tl2)' }}/>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>Portée — points de vente</span>
            </div>
            <BoutiqueScope label={null} value={scope} onChange={setScope} help="La règle ne s'exécute que dans les boutiques sélectionnées."/>
          </div>

          <SectionDivider>Si (conditions)</SectionDivider>
          {conditions.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', padding: 3, borderRadius: 8 }}>
                    {['ET','OU'].map(l => <button key={l} onClick={() => setLogic(l)} className="btn btn-sm" style={{ padding: '3px 12px', background: logic === l ? 'var(--e2)' : 'transparent', color: logic === l ? '#fff' : 'var(--muted)' }}>{l}</button>)}
                  </div>
                </div>
              )}
              <ConditionCard cond={c} idx={i} onRemove={() => rmCond(i)} update={(patch) => setConditions(cs => cs.map((x, j) => j === i ? { ...x, ...patch } : x))}/>
            </React.Fragment>
          ))}
          <div style={{ padding: 14, borderRadius: 12, border: '1px dashed var(--border-2)', textAlign: 'center', fontSize: 12.5, color: 'var(--muted)' }}><Ico.plus size={14} style={{ verticalAlign: -2, marginRight: 6 }}/>Cliquez une condition dans la palette pour l'ajouter</div>

          <SectionDivider>Alors (actions)</SectionDivider>
          <div style={{ borderRadius: 12, border: '1px solid var(--e1)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'var(--e0)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--e4)' }}><Ico.zap size={15}/> Actions à exécuter</div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {actions.map((a, i) => <ActionCard key={i} act={a} onRemove={() => rmAct(i)} update={(patch) => setActions(as => as.map((x, j) => j === i ? { ...x, ...patch } : x))}/>)}
            </div>
          </div>

          <div style={{ padding: 16, borderRadius: 12, background: 'var(--n1)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, marginBottom: 8 }}>Traduction en langage naturel</div>
            <div style={{ fontSize: 14, color: 'var(--heading)', lineHeight: 1.6 }}>{naturalLanguage(trigger, conditions, logic, actions)}</div>
          </div>

          {showTest && (
            <div style={{ borderRadius: 12, border: '1px solid var(--border)', padding: 16, background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}><h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: 'var(--heading)' }}>Test avec données</h3><div className="grow"/><button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setShowTest(false)}><Ico.x size={13}/></button></div>
              <Simulator rules={SIM_RULES}/>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--n1)' }}>
        <Pill kind="emerald" dot>Règle valide</Pill>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{conditions.length} conditions · {actions.length} actions</span>
        <ScopeTag value={scope}/>
        <div className="grow"/>
        <button className="btn btn-ghost" onClick={() => setShowTest(s => !s)}><Ico.play size={14}/> Tester avec données</button>
        <button className="btn btn-soft" onClick={() => toast('Règle dupliquée', name, 'em')}><Ico.copy size={14}/> Dupliquer</button>
        <button className="btn btn-primary" onClick={() => { onBack(); toast('Règle enregistrée', name, 'em'); }}><Ico.check size={15}/> Sauvegarder la règle</button>
      </div>
    </div>
  );
};

function defaultCond(type) {
  return { amount: { type, op: '≥', value: 2000 }, weekday: { type, days: [5,6] }, hours: { type, from: 17, to: 19 }, tier: { type, tiers: ['or'] }, visits: { type, op: '≥', value: 3 }, store: { type, store: 'Akwa' } }[type] || { type };
}
function defaultAction(type) {
  return { mult: { type, factor: 2 }, flat: { type, pts: 200 }, reward: { type, reward: 'Café offert' }, notify: { type, via: 'SMS' }, tierup: { type } }[type] || { type };
}

const ConditionCard = ({ cond, onRemove, update }) => {
  const meta = {
    amount: { icon: <Ico.card size={16}/>, title: "Montant de l'achat", sub: 'Filtrer selon la valeur' },
    weekday: { icon: <Ico.cal size={16}/>, title: 'Jour de la semaine', sub: 'Cibler certains jours' },
    hours: { icon: <Ico.clock size={16}/>, title: 'Plage horaire', sub: 'Heure de la transaction' },
    tier: { icon: <Ico.award size={16}/>, title: 'Palier du client', sub: 'Cibler un niveau de fidélité' },
    visits: { icon: <Ico.refresh size={16}/>, title: 'Nombre de visites', sub: 'Fréquentation du mois' },
    store: { icon: <Ico.store size={16}/>, title: 'Boutique', sub: 'Emplacement concerné' },
  }[cond.type] || { icon: <Ico.info size={16}/>, title: cond.type };
  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--border-2)', overflow: 'hidden' }}>
      <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 11, background: 'var(--surface)' }}>
        <div className="ava ava-nu" style={{ width: 32, height: 32, color: 'var(--n6)' }}>{meta.icon}</div>
        <div className="grow"><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>{meta.title}</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{meta.sub}</div></div>
        <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={onRemove}><Ico.x size={13}/></button>
      </div>
      <div style={{ padding: 14, background: 'var(--n1)', borderTop: '1px solid var(--border)' }}>
        {cond.type === 'amount' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="select" value={cond.op} onChange={e => update({ op: e.target.value })} style={{ flex: 1 }}><option>≥ supérieur ou égal</option><option>≤ inférieur ou égal</option><option>= égal à</option></select>
            <input className="input num" style={{ width: 120 }} value={cond.value} onChange={e => update({ value: +e.target.value || 0 })}/>
          </div>
        )}
        {cond.type === 'weekday' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {DAYS_FR.map((d, i) => { const on = cond.days.includes(i); return <div key={d} onClick={() => update({ days: on ? cond.days.filter(x => x !== i) : [...cond.days, i] })} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500, background: on ? 'var(--e2)' : 'var(--surface)', color: on ? '#fff' : 'var(--muted)', border: '1px solid ' + (on ? 'var(--e2)' : 'var(--border-2)') }}>{d}</div>; })}
          </div>
        )}
        {cond.type === 'hours' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>De</span><input className="input num" type="number" style={{ width: 80 }} value={cond.from} onChange={e => update({ from: +e.target.value })}/>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>à</span><input className="input num" type="number" style={{ width: 80 }} value={cond.to} onChange={e => update({ to: +e.target.value })}/>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>heures</span>
          </div>
        )}
        {cond.type === 'tier' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {[['bronze','Bronze'],['argent','Argent'],['or','Or'],['platine','Platine']].map(([id,l]) => { const on = cond.tiers.includes(id); return <div key={id} onClick={() => update({ tiers: on ? cond.tiers.filter(x => x !== id) : [...cond.tiers, id] })} className="pill" style={{ cursor: 'pointer', padding: '6px 12px', background: on ? 'var(--e0)' : 'var(--surface)', color: on ? 'var(--e4)' : 'var(--muted)', border: '1px solid ' + (on ? 'var(--e1)' : 'var(--border-2)') }}>{l} {on && <Ico.check size={11}/>}</div>; })}
          </div>
        )}
        {cond.type === 'visits' && (
          <div style={{ display: 'flex', gap: 10 }}><select className="select" style={{ flex: 1 }}><option>≥ au moins</option><option>≤ au plus</option></select><input className="input num" style={{ width: 100 }} value={cond.value} onChange={e => update({ value: +e.target.value })}/></div>
        )}
        {cond.type === 'store' && (
          <select className="select" value={cond.store} onChange={e => update({ store: e.target.value })}><option>Akwa</option><option>Bonanjo</option><option>Bonamoussadi</option><option>Toutes les boutiques</option></select>
        )}
      </div>
    </div>
  );
};

const ActionCard = ({ act, onRemove, update }) => {
  const meta = {
    mult: { icon: <Ico.zap size={15}/>, title: 'Multiplier les points par' },
    flat: { icon: <Ico.plus size={15}/>, title: 'Ajouter des points fixes' },
    reward: { icon: <Ico.gift size={15}/>, title: 'Débloquer la récompense' },
    notify: { icon: <Ico.bell size={15}/>, title: 'Notifier le client par' },
    tierup: { icon: <Ico.award size={15}/>, title: 'Faire monter le client de palier' },
  }[act.type] || { icon: <Ico.zap size={15}/>, title: act.type };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderRadius: 10, background: 'var(--e0)', border: '1px solid var(--e1)' }}>
      <div className="ava ava-em" style={{ width: 30, height: 30 }}>{meta.icon}</div>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>{meta.title}</span>
      {act.type === 'mult' && <input className="input num" style={{ width: 70 }} value={act.factor} onChange={e => update({ factor: +e.target.value })}/>}
      {act.type === 'flat' && <input className="input num" style={{ width: 90 }} value={act.pts} onChange={e => update({ pts: +e.target.value })}/>}
      {act.type === 'notify' && <select className="select" style={{ width: 110 }} value={act.via} onChange={e => update({ via: e.target.value })}><option>SMS</option><option>Push</option><option>Les deux</option></select>}
      {act.type === 'reward' && <select className="select" style={{ width: 150 }} value={act.reward} onChange={e => update({ reward: e.target.value })}><option>Café offert</option><option>Dessert maison</option><option>−5% addition</option></select>}
      <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={onRemove}><Ico.x size={13}/></button>
    </div>
  );
};

function naturalLanguage(trigger, conditions, logic, actions) {
  const G = (txt) => <span style={{ color: 'var(--e3)', fontWeight: 600 }}>{txt}</span>;
  const B = (txt) => <span style={{ color: 'var(--g3)', fontWeight: 600 }}>{txt}</span>;
  const condText = conditions.map((c, i) => {
    let t = '';
    if (c.type === 'amount') t = `le montant est ${c.op} ${c.value.toLocaleString('fr-FR')} FCFA`;
    else if (c.type === 'weekday') t = `le jour est ${c.days.map(d => DAYS_FR[d]).join(', ')}`;
    else if (c.type === 'hours') t = `l'heure est entre ${c.from}h et ${c.to}h`;
    else if (c.type === 'tier') t = `le palier est ${c.tiers.join(' ou ')}`;
    else if (c.type === 'visits') t = `le client a ≥ ${c.value} visites`;
    else if (c.type === 'store') t = `la boutique est ${c.store}`;
    return <React.Fragment key={i}>{i > 0 && <span style={{ color: 'var(--muted)', fontWeight: 600 }}> {logic} </span>}{B(t)}</React.Fragment>;
  });
  const actText = actions.map((a, i) => {
    let t = '';
    if (a.type === 'mult') t = `multiplier les points × ${a.factor}`;
    else if (a.type === 'flat') t = `ajouter ${a.pts} points`;
    else if (a.type === 'notify') t = `notifier par ${a.via}`;
    else if (a.type === 'reward') t = `débloquer « ${a.reward} »`;
    else if (a.type === 'tierup') t = `faire monter de palier`;
    return <React.Fragment key={i}>{i > 0 && <span style={{ color: 'var(--muted)' }}> et </span>}{G(t)}</React.Fragment>;
  });
  return <>Lorsqu'une {G(trigger.label.toLowerCase())} est enregistrée, si {condText}, alors {actText}.</>;
}

window.RuleEditorPage = RuleEditorPage;
