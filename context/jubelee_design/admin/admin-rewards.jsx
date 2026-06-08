/* eslint-disable */
const Rewards = ({ toast, confirm }) => {
  const [rewardModal, setRewardModal] = React.useState(undefined); // undefined=closed, null=new, obj=edit
  const iconFor = (k) => ({ cup: <Ico.cup size={20}/>, card: <Ico.card size={20}/>, gift: <Ico.gift size={20}/>, award: <Ico.award size={20}/> }[k] || <Ico.gift size={20}/>);

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--heading)' }}>Récompenses</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Le catalogue que vos clients débloquent avec leurs points.</div>
        </div>
        <button className="btn btn-ghost"><Ico.eye size={15}/> Aperçu client</button>
        <button className="btn btn-primary" onClick={() => setRewardModal(null)}><Ico.plus size={16}/> Nouvelle récompense</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {REWARDS.map((r, i) => (
          <div key={i} className="card" style={{ opacity: r.active ? 1 : 0.62 }}>
            <div className="card-body" style={{ padding: 18, display: 'flex', gap: 14 }}>
              <div className={`ava ava-${r.kind}`} style={{ width: 52, height: 52, borderRadius: 14, flex: 'none' }}>{iconFor(r.icon)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="serif" style={{ fontSize: 20, color: 'var(--heading)' }}>{r.name}</span>
                  {!r.active && <Pill kind="neutral">En pause</Pill>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{r.desc}</div>
                <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
                  <div><div className="num" style={{ fontSize: 16, fontWeight: 600, color: 'var(--g3)' }}>{r.cost.toLocaleString('fr-FR')}</div><div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>points</div></div>
                  <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 14 }}><div className="num" style={{ fontSize: 16, fontWeight: 500, color: 'var(--heading)' }}>{r.claimed}</div><div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>utilisées</div></div>
                  <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 14 }}><div className="num" style={{ fontSize: 16, fontWeight: 500, color: 'var(--heading)' }}>{r.stock}</div><div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>stock</div></div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                <Pill kind={r.tier === 'Tous' ? 'neutral' : 'gold'}>{r.tier}</Pill>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setRewardModal(r)}><Ico.edit size={13}/></button>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => confirm('delete-rule', { name: r.name })}><Ico.trash size={13}/></button>
                </div>
                <Switch on={r.active} onChange={() => toast(r.active ? 'Récompense en pause' : 'Récompense activée', r.name, r.active ? 'tr' : 'em')}/>
              </div>
            </div>
          </div>
        ))}
        {/* Add card */}
        <div className="card" style={{ border: '1px dashed var(--border-2)', background: 'var(--n1)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 116, cursor: 'pointer' }} onClick={() => setRewardModal(null)}>
          <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
            <div className="empty-ico" style={{ width: 44, height: 44, margin: '0 auto 8px' }}><Ico.plus size={20}/></div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>Ajouter une récompense</div>
          </div>
        </div>
      </div>
      {rewardModal !== undefined && <Portal><RewardModal data={rewardModal} onClose={() => setRewardModal(undefined)} toast={toast}/></Portal>}
    </div>
  );
};

window.Rewards = Rewards;
