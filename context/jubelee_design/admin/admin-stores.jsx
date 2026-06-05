/* eslint-disable */
const StoreMapBg = () => (
  <svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <rect width="800" height="520" fill="#EEE7DA"/>
    {/* water / river */}
    <path d="M -20 380 Q 160 340 300 400 T 620 420 L 840 380 L 840 560 L -20 560 Z" fill="#CFE3E0" opacity="0.75"/>
    <path d="M 560 -20 Q 600 120 540 220 T 580 420" fill="none" stroke="#CFE3E0" strokeWidth="34" opacity="0.7"/>
    {/* parks */}
    <ellipse cx="120" cy="120" rx="90" ry="64" fill="#D7E3C4" opacity="0.8"/>
    <ellipse cx="700" cy="160" rx="70" ry="54" fill="#D7E3C4" opacity="0.7"/>
    {/* blocks */}
    {[[60,40],[180,60],[300,30],[420,50],[260,170],[380,190],[120,260],[250,300],[470,260],[600,300],[680,420],[160,420],[340,440]].map(([x,y],i)=>(
      <rect key={i} x={x} y={y} width={70+(i%3)*22} height={48+(i%2)*20} rx="6" fill="#E2D9C8"/>
    ))}
    {/* roads */}
    {[80,180,280,380,470].map((y,i)=><line key={'h'+i} x1="0" y1={y} x2="800" y2={y} stroke="#F5F0E8" strokeWidth="16"/>)}
    {[110,260,410,560,680].map((x,i)=><line key={'v'+i} x1={x} y1="0" x2={x} y2="520" stroke="#F5F0E8" strokeWidth="16"/>)}
    {[140,320].map((y,i)=><line key={'hd'+i} x1="0" y1={y} x2="800" y2={y} stroke="#FBF9F4" strokeWidth="7"/>)}
  </svg>
);

const Stores = ({ toast }) => {
  const [sel, setSel] = React.useState('akwa');
  const [storeModal, setStoreModal] = React.useState(undefined); // undefined=closed, null=new, obj=edit
  const store = STORES.find(s => s.id === sel);

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--heading)' }}>Boutiques</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Les points de vente de votre enseigne <strong style={{ color: 'var(--body)' }}>Chez Mama</strong> — affichés sur la carte client, ciblables par règles & campagnes.</div>
        </div>
        <button className="btn btn-ghost"><Ico.globe size={15}/> Vue carte</button>
        <button className="btn btn-primary" onClick={() => setStoreModal(null)}><Ico.plus size={16}/> Ajouter une boutique</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Boutiques actives', v: '2', c: 'var(--e2)' },
          { l: 'Ouverture prochaine', v: '1', c: 'var(--g2)' },
          { l: 'Clients (réseau)', v: '1 248', c: 'var(--tl2)' },
          { l: 'Points (mois)', v: '352k', c: 'var(--t2)' },
        ].map((s, i) => (
          <div key={i} className="kpi"><div className="kpi-bar-left" style={{ background: s.c }}/><div style={{ paddingLeft: 8 }}><div className="kpi-label">{s.l}</div><div className="serif" style={{ fontSize: 28, color: 'var(--heading)', marginTop: 6 }}>{s.v}</div></div></div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* Map */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-head">
            <div className="grow"><h3>Carte du réseau · Douala</h3><div className="sub">Cliquez sur un repère pour voir les détails de la boutique</div></div>
            <span className="pill pill-neutral"><Ico.globe size={12}/> Coordonnées GPS</span>
          </div>
          <div style={{ position: 'relative', height: 460, margin: '0 16px 16px', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <StoreMapBg/>
            {STORES.map(s => (
              <div key={s.id} onClick={() => setSel(s.id)}
                style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -100%)', cursor: 'pointer', zIndex: sel === s.id ? 5 : 2 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: sel === s.id ? '7px 12px 7px 8px' : '5px 8px',
                  background: sel === s.id ? '#1A1610' : 'var(--surface)',
                  border: '1px solid ' + (sel === s.id ? '#1A1610' : 'var(--border-2)'),
                  borderRadius: 999, boxShadow: 'var(--shadow-pop)', whiteSpace: 'nowrap',
                  transition: 'all .15s',
                }}>
                  <div className={`ava ava-${s.kind}`} style={{ width: 26, height: 26, fontSize: 11 }}>{s.mark}</div>
                  {sel === s.id && <span style={{ color: '#F2EBDC', fontSize: 12.5, fontWeight: 600 }}>{s.short}</span>}
                  {s.status === 'soon' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--g1)' }}/>}
                </div>
                <div style={{ width: 2, height: 14, background: sel === s.id ? '#1A1610' : 'var(--border-2)', margin: '0 auto' }}/>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: sel === s.id ? '#1A1610' : 'var(--n5)', margin: '-4px auto 0', boxShadow: '0 0 0 4px rgba(26,22,16,0.10)' }}/>
              </div>
            ))}
            {/* legend */}
            <div style={{ position: 'absolute', left: 14, bottom: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px', boxShadow: 'var(--shadow-card)', fontSize: 11.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--n5)' }}/> Ouverte</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--g1)' }}/> Ouverture prochaine</div>
            </div>
          </div>
        </div>

        {/* Store list + selected detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-head"><div className="grow"><h3>{store.short}</h3><div className="sub">{store.address}</div></div>{store.isHQ && <Pill kind="emerald">Siège</Pill>}</div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[['Clients', store.clients],['Agents', store.agents],['Points / mois', store.ptsMonth],['Règles actives', store.rules],['Campagnes', store.campaigns],['Statut', store.status === 'open' ? 'Ouverte' : 'Bientôt']].map(([l,v]) => (
                  <div key={l} style={{ padding: 11, borderRadius: 10, background: 'var(--n1)' }}><div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div><div className="num" style={{ fontSize: 16, color: 'var(--heading)', fontWeight: 500, marginTop: 2 }}>{v}</div></div>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Ico.globe size={13}/> <span className="num">{store.lat.toFixed(4)}, {store.lng.toFixed(4)}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ico.clock size={13}/> {store.hours}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-soft btn-sm" style={{ flex: 1 }} onClick={() => setStoreModal(store)}><Ico.edit size={13}/> Modifier</button>
                <button className="btn btn-ghost btn-sm" onClick={() => toast('QR boutique', store.short, 'gd')}><Ico.qr size={13}/></button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div className="grow"><h3>Toutes les boutiques</h3></div></div>
            <div style={{ padding: '0 12px 12px' }}>
              {STORES.map(s => (
                <div key={s.id} onClick={() => setSel(s.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '10px 10px', borderRadius: 10, cursor: 'pointer',
                  background: sel === s.id ? 'var(--n1)' : 'transparent',
                }}>
                  <div className={`ava ava-${s.kind}`} style={{ width: 34, height: 34 }}>{s.mark}</div>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>{s.short}</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{s.clients} clients</div></div>
                  {s.status === 'soon' ? <Pill kind="gold">Bientôt</Pill> : <Pill kind="emerald" dot>Ouverte</Pill>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {storeModal !== undefined && <Portal><StoreModal data={storeModal} onClose={() => setStoreModal(undefined)} toast={toast}/></Portal>}
    </div>
  );
};

window.Stores = Stores;
