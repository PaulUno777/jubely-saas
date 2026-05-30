/* eslint-disable */
// Structured rules for evaluation + conflict analysis
const SIM_RULES = [
  { id: 'std', name: 'Achat standard', tag: 'Base', kind: 'emerald', on: true,
    trigger: 'transaction', cond: { days: [0,1,2,3,4,5,6], hours: null, tier: 'all', minAmount: 0 },
    action: { type: 'rate', per: 100, pts: 1 } },
  { id: 'hh', name: 'Happy hour', tag: 'Multiplicateur', kind: 'gold', on: true,
    trigger: 'transaction', cond: { days: [0,1,2,3,4], hours: [17,19], tier: 'all', minAmount: 0 },
    action: { type: 'mult', factor: 2 } },
  { id: 'first', name: 'Première visite', tag: 'Bonus', kind: 'teal', on: true,
    trigger: 'enroll', cond: { days: [0,1,2,3,4,5,6], hours: null, tier: 'new', minAmount: 0 },
    action: { type: 'flat', pts: 200 } },
  { id: 'vip', name: 'Bonus Or week-end', tag: 'Multiplicateur', kind: 'gold', on: true,
    trigger: 'transaction', cond: { days: [5,6], hours: null, tier: 'or', minAmount: 2000 },
    action: { type: 'mult', factor: 2 } },
  { id: 'birth', name: 'Anniversaire client', tag: 'Bonus', kind: 'terra', on: false,
    trigger: 'birthday', cond: { days: [0,1,2,3,4,5,6], hours: null, tier: 'all', minAmount: 0 },
    action: { type: 'flat', pts: 500 } },
];

const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

// Detect overlaps / conflicts between active rules
function detectConflicts(rules) {
  const out = [];
  const active = rules.filter(r => r.on && r.trigger === 'transaction');
  const mults = active.filter(r => r.action.type === 'mult');
  // Two multipliers that can co-fire (overlapping days)
  for (let i = 0; i < mults.length; i++) {
    for (let j = i+1; j < mults.length; j++) {
      const a = mults[i], b = mults[j];
      const dayOverlap = a.cond.days.some(d => b.cond.days.includes(d));
      const hourOverlap = !a.cond.hours || !b.cond.hours || (a.cond.hours[0] < b.cond.hours[1] && b.cond.hours[0] < a.cond.hours[1]);
      if (dayOverlap && hourOverlap) {
        out.push({ level: 'warn', rules: [a.name, b.name],
          msg: `« ${a.name} » et « ${b.name} » peuvent se cumuler le même jour — un client Or pourrait obtenir un multiplicateur ×4 involontaire.` });
      }
    }
  }
  // Base rule missing
  if (!active.some(r => r.action.type === 'rate')) {
    out.push({ level: 'error', rules: [], msg: 'Aucune règle de base active : les achats ne génèrent aucun point par défaut.' });
  }
  // Disabled bonus note
  if (rules.some(r => !r.on && r.tag === 'Bonus')) {
    out.push({ level: 'info', rules: [], msg: 'Une règle bonus est désactivée — réactivez-la pour récompenser l\u2019événement concerné.' });
  }
  return out;
}

// Evaluate a test transaction against rules → trace
function evaluate(rules, ctx) {
  // ctx: { amount, day (0-6), hour, tier, isNew }
  const trace = [];
  let base = 0, total = 0;
  const active = rules.filter(r => r.on);
  // base rate first
  active.filter(r => r.action.type === 'rate' && r.trigger === 'transaction').forEach(r => {
    if (r.cond.days.includes(ctx.day) && ctx.amount >= r.cond.minAmount) {
      const pts = Math.floor(ctx.amount / r.action.per) * r.action.pts;
      base += pts; total += pts;
      trace.push({ rule: r, applied: true, pts: '+' + pts, detail: `${ctx.amount} F ÷ ${r.action.per} × ${r.action.pts}` });
    } else trace.push({ rule: r, applied: false, reason: 'Hors conditions' });
  });
  // flat bonuses
  active.filter(r => r.action.type === 'flat').forEach(r => {
    const tierOk = r.cond.tier === 'all' || (r.cond.tier === 'new' && ctx.isNew);
    const trigOk = r.trigger === 'transaction' || (r.trigger === 'enroll' && ctx.isNew);
    if (tierOk && trigOk && r.cond.days.includes(ctx.day)) {
      total += r.action.pts;
      trace.push({ rule: r, applied: true, pts: '+' + r.action.pts, detail: 'Bonus fixe' });
    } else trace.push({ rule: r, applied: false, reason: ctx.isNew ? 'Hors conditions' : 'Client existant' });
  });
  // multipliers applied to base
  let factor = 1;
  active.filter(r => r.action.type === 'mult' && r.trigger === 'transaction').forEach(r => {
    const dayOk = r.cond.days.includes(ctx.day);
    const hourOk = !r.cond.hours || (ctx.hour >= r.cond.hours[0] && ctx.hour < r.cond.hours[1]);
    const tierOk = r.cond.tier === 'all' || r.cond.tier === ctx.tier;
    const amtOk = ctx.amount >= r.cond.minAmount;
    if (dayOk && hourOk && tierOk && amtOk) {
      factor *= r.action.factor;
      trace.push({ rule: r, applied: true, pts: '×' + r.action.factor, detail: 'Multiplicateur' });
    } else {
      const reason = !dayOk ? 'Mauvais jour' : !hourOk ? 'Hors plage horaire' : !tierOk ? 'Palier non éligible' : 'Montant insuffisant';
      trace.push({ rule: r, applied: false, reason });
    }
  });
  const bonus = total - base;
  const final = Math.round(base * factor) + bonus;
  return { trace, base, factor, bonus, final };
}

const Simulator = ({ rules, compact }) => {
  const [amount, setAmount] = React.useState(5000);
  const [day, setDay] = React.useState(5);
  const [hour, setHour] = React.useState(18);
  const [tier, setTier] = React.useState('or');
  const [isNew, setIsNew] = React.useState(false);

  const result = evaluate(rules, { amount, day, hour, tier, isNew });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '320px 1fr', gap: 18, alignItems: 'start' }}>
      {/* Inputs */}
      <div className="card">
        <div className="card-head"><div className="grow"><h3>Transaction test</h3><div className="sub">Ajustez les paramètres</div></div></div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="lbl">Montant de l'achat (FCFA)</label>
            <input className="input num" type="number" value={amount} onChange={e => setAmount(+e.target.value || 0)}/>
          </div>
          <div>
            <label className="lbl">Jour</label>
            <div style={{ display: 'flex', gap: 5 }}>
              {DAYS_FR.map((d, i) => (
                <div key={d} onClick={() => setDay(i)} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500, background: day === i ? 'var(--e2)' : 'var(--surface-2)', color: day === i ? '#fff' : 'var(--muted)' }}>{d}</div>
              ))}
            </div>
          </div>
          <div>
            <label className="lbl">Heure · <span className="num">{hour}h00</span></label>
            <input type="range" min="8" max="23" value={hour} onChange={e => setHour(+e.target.value)} style={{ width: '100%', accentColor: 'var(--e2)' }}/>
          </div>
          <div>
            <label className="lbl">Palier du client</label>
            <select className="select" value={tier} onChange={e => setTier(e.target.value)}>
              <option value="bronze">Bronze</option><option value="argent">Argent</option><option value="or">Or</option><option value="platine">Platine</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <Switch on={isNew} onChange={setIsNew}/>
            <span style={{ fontSize: 13, color: 'var(--body)' }}>Nouveau client (1ère visite)</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #E8F7EE, #FFFFFF 70%)' }}>
          <div className="card-body" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--e4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Points attribués</div>
              <div className="serif" style={{ fontSize: 48, color: 'var(--e4)', lineHeight: 1 }}>+{result.final}</div>
            </div>
            <div style={{ display: 'flex', gap: 22, marginLeft: 'auto' }}>
              <div><div className="num" style={{ fontSize: 20, color: 'var(--heading)', fontWeight: 500 }}>{result.base}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>base</div></div>
              <div><div className="num" style={{ fontSize: 20, color: 'var(--g3)', fontWeight: 500 }}>×{result.factor}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>multipl.</div></div>
              <div><div className="num" style={{ fontSize: 20, color: 'var(--tl3)', fontWeight: 500 }}>+{result.bonus}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>bonus</div></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="grow"><h3>Détail d'évaluation</h3><div className="sub">Règles évaluées dans l'ordre</div></div></div>
          <div className="card-body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.trace.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 10, background: t.applied ? 'var(--n1)' : 'transparent', border: '1px solid ' + (t.applied ? 'var(--border)' : 'transparent'), opacity: t.applied ? 1 : 0.55 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.applied ? 'var(--e2)' : 'var(--n2)', color: t.applied ? '#fff' : 'var(--n5)', flex: 'none' }}>{t.applied ? <Ico.check size={13}/> : <Ico.x size={12}/>}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>{t.rule.name}</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{t.applied ? t.detail : t.reason}</div></div>
                {t.applied && <span className="num" style={{ fontSize: 14, fontWeight: 600, color: t.pts.startsWith('×') ? 'var(--g3)' : 'var(--e3)' }}>{t.pts}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ConflictPanel = ({ rules }) => {
  const conflicts = detectConflicts(rules);
  const styles = {
    error: { bg: 'var(--t0)', bd: 'var(--t1)', fg: 'var(--t3)', ic: <Ico.alert size={16}/> },
    warn: { bg: 'var(--g0)', bd: 'var(--g1)', fg: 'var(--g4)', ic: <Ico.alert size={16}/> },
    info: { bg: 'var(--tl0)', bd: 'var(--tl1)', fg: 'var(--tl3)', ic: <Ico.info size={16}/> },
  };
  return (
    <div className="card">
      <div className="card-head">
        <div className="grow"><h3>Détection de conflits</h3><div className="sub">Analyse automatique des chevauchements de règles</div></div>
        {conflicts.length === 0
          ? <Pill kind="emerald" dot>Aucun conflit</Pill>
          : <Pill kind="gold">{conflicts.length} à vérifier</Pill>}
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {conflicts.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--e0)', borderRadius: 12 }}>
            <div className="ava ava-em" style={{ width: 36, height: 36 }}><Ico.check size={17}/></div>
            <div style={{ fontSize: 13, color: 'var(--e4)' }}>Vos règles sont cohérentes. Aucun cumul involontaire détecté.</div>
          </div>
        )}
        {conflicts.map((c, i) => {
          const s = styles[c.level];
          return (
            <div key={i} style={{ display: 'flex', gap: 12, padding: 14, background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 12 }}>
              <span style={{ color: s.fg, flex: 'none' }}>{s.ic}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: s.fg, lineHeight: 1.5 }}>{c.msg}</div>
                {c.rules.length > 0 && <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>{c.rules.map(r => <span key={r} className="pill" style={{ background: 'rgba(255,255,255,0.6)', color: s.fg }}>{r}</span>)}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, { SIM_RULES, DAYS_FR, detectConflicts, evaluate, Simulator, ConflictPanel });
