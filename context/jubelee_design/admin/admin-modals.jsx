/* eslint-disable */
// ===== Multi-language helpers (client-facing content) =====
// The active language list is configurable (Settings → Marque) via LangContext.
const MultiLangField = ({ label, help, value = {}, onChange, textarea, placeholder, rows = 2 }) => {
  const { langs } = useLangs();
  const active = ALL_LANGS.filter(l => langs.includes(l.id));
  const [lang, setLang] = React.useState(langs[0] || 'fr');
  React.useEffect(() => { if (!langs.includes(lang)) setLang(langs[0] || 'fr'); }, [langs]);
  const set = (v) => onChange({ ...value, [lang]: v });
  const translated = active.filter(l => value[l.id] && value[l.id].trim()).length;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <label className="lbl" style={{ margin: 0, whiteSpace: 'nowrap' }}>{label}</label>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', padding: 2, borderRadius: 7, flexWrap: 'wrap' }}>
          {active.map(l => {
            const filled = value[l.id] && value[l.id].trim();
            return (
              <button key={l.id} onClick={() => setLang(l.id)} title={l.name} style={{
                appearance: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit',
                padding: '3px 9px', borderRadius: 5, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: lang === l.id ? 'var(--surface)' : 'transparent',
                color: lang === l.id ? 'var(--heading)' : 'var(--muted)',
                boxShadow: lang === l.id ? 'var(--shadow-card)' : 'none',
              }}>
                {l.label}
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: filled ? 'var(--e2)' : 'var(--n3)' }}/>
              </button>
            );
          })}
        </div>
      </div>
      {textarea
        ? <textarea className="textarea" rows={rows} placeholder={placeholder} value={value[lang] || ''} onChange={e => set(e.target.value)}/>
        : <input className="input" placeholder={placeholder} value={value[lang] || ''} onChange={e => set(e.target.value)}/>}
      <div className="field-help">
        {help || 'Affiché dans la langue du client.'}
        {' '}<span style={{ color: 'var(--muted)' }}>{translated}/{active.length} traduites</span>
      </div>
    </div>
  );
};

// ===== Reward Rule Modal =====
const RuleModal = ({ data, onClose, toast }) => {
  const [type, setType] = React.useState(data?.tag === 'Multiplicateur' ? 'mult' : data?.tag === 'Bonus' ? 'bonus' : 'base');
  const [name, setName] = React.useState(data?.name || '');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="ava ava-em" style={{ width: 40, height: 40 }}><Ico.star size={18}/></div>
          <div className="grow">
            <h2>{data ? 'Modifier la règle' : 'Nouvelle règle de points'}</h2>
            <div className="sub">Définissez comment vos clients gagnent des points.</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Ico.x size={16}/></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="lbl">Type de règle</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { id: 'base', t: 'Base', d: 'Points par montant', ic: <Ico.star size={16}/>, k: 'emerald' },
                { id: 'mult', t: 'Multiplicateur', d: 'x2, x3 sur période', ic: <Ico.zap size={16}/>, k: 'gold' },
                { id: 'bonus', t: 'Bonus', d: 'Points fixes sur événement', ic: <Ico.gift size={16}/>, k: 'teal' },
              ].map(o => (
                <div key={o.id} onClick={() => setType(o.id)} style={{
                  padding: 14, borderRadius: 12, cursor: 'pointer',
                  border: type === o.id ? '1.5px solid var(--e2)' : '1px solid var(--border-2)',
                  background: type === o.id ? 'var(--e0)' : 'var(--surface)',
                }}>
                  <div className={`ava ava-${o.k}`} style={{ width: 34, height: 34 }}>{o.ic}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--heading)', marginTop: 10 }}>{o.t}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{o.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label className="lbl">Nom de la règle</label><input className="input" placeholder="ex. Happy hour" value={name} onChange={e => setName(e.target.value)}/></div>
            <div><label className="lbl">Cible</label><select className="select"><option>Tous les clients</option><option>Nouveaux clients</option><option>Clients enrôlés</option><option>Palier Or et +</option></select></div>
          </div>

          {type === 'base' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: 14, background: 'var(--n1)', borderRadius: 12 }}>
              <div><label className="lbl">Points attribués</label><input className="input num" defaultValue="1"/></div>
              <div><label className="lbl">Par tranche de (FCFA)</label><input className="input num" defaultValue="100"/></div>
              <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: 'var(--e3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ico.info size={14}/> Un achat de 5 000 FCFA rapportera <strong style={{ marginLeft: 2 }}>50 points</strong>.
              </div>
            </div>
          )}
          {type === 'mult' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, padding: 14, background: 'var(--g0)', borderRadius: 12 }}>
              <div><label className="lbl">Multiplicateur</label><select className="select"><option>x2</option><option>x3</option><option>x5</option></select></div>
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
              {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((d, i) => (
                <div key={d} style={{
                  flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', fontWeight: 500,
                  background: i < 5 ? 'var(--e2)' : 'var(--surface-2)',
                  color: i < 5 ? '#fff' : 'var(--muted)',
                }}>{d}</div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
            <Switch on={true} onChange={() => {}}/>
            <div><div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--heading)' }}>Activer immédiatement</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>La règle s'appliquera dès l'enregistrement.</div></div>
          </div>
        </div>
        <div className="modal-foot">
          <span style={{ fontSize: 12, color: 'var(--muted)' }}><Ico.eye size={13} style={{ verticalAlign: -2, marginRight: 5 }}/>Aperçu mis à jour en temps réel</span>
          <div className="grow"/>
          <button className="btn btn-soft" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={() => { onClose(); toast(data ? 'Règle mise à jour' : 'Règle créée', name || 'Nouvelle règle', 'em'); }}>{data ? 'Enregistrer' : 'Créer la règle'}</button>
        </div>
      </div>
    </div>
  );
};

// ===== Staff Modal =====
const StaffModal = ({ data, onClose, toast }) => {
  const [perm, setPerm] = React.useState('attrib');
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="ava ava-tl" style={{ width: 40, height: 40 }}><Ico.user size={18}/></div>
          <div className="grow">
            <h2>{data ? 'Modifier l\u2019agent' : 'Ajouter un agent'}</h2>
            <div className="sub">{data ? 'Mettez à jour le rôle et les permissions.' : 'Un e-mail d\u2019invitation sera envoyé.'}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Ico.x size={16}/></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label className="lbl">Nom complet</label><input className="input" defaultValue={data?.name || ''} placeholder="ex. Aïcha Bello"/></div>
            <div><label className="lbl">Rôle</label><select className="select" defaultValue={data?.role}><option>Caissière</option><option>Serveur</option><option>Manager</option><option>Hôte d'accueil</option></select></div>
            <div><label className="lbl">E-mail</label><input className="input" defaultValue={data?.email || ''} placeholder="agent@chezmama.cm"/></div>
            <div><label className="lbl">Téléphone</label><input className="input" defaultValue={data?.phone || ''} placeholder="+237 6 …"/></div>
          </div>
          <div>
            <label className="lbl">Niveau de permission</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'attrib', t: 'Attribution de points', d: 'Scanner et créditer les clients' },
                { id: 'rewards', t: 'Attribution + récompenses', d: 'Valider aussi les récompenses' },
                { id: 'full', t: 'Accès complet', d: 'Gérer règles, équipe et paramètres' },
              ].map(o => (
                <div key={o.id} onClick={() => setPerm(o.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  border: perm === o.id ? '1.5px solid var(--e2)' : '1px solid var(--border-2)',
                  background: perm === o.id ? 'var(--e0)' : 'var(--surface)',
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: perm === o.id ? '5px solid var(--e2)' : '2px solid var(--n4)', flex: 'none' }}/>
                  <div><div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--heading)' }}>{o.t}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{o.d}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          {data && <button className="btn btn-danger btn-sm"><Ico.trash size={13}/> Supprimer</button>}
          <div className="grow"/>
          <button className="btn btn-soft" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={() => { onClose(); toast(data ? 'Agent mis à jour' : 'Invitation envoyée', data ? data.name : 'Un e-mail a été envoyé.', 'em'); }}>{data ? 'Enregistrer' : 'Envoyer l\u2019invitation'}</button>
        </div>
      </div>
    </div>
  );
};

// ===== Campaign Modal =====
const CampaignModal = ({ data, onClose, toast }) => {
  const [boutiques, setBoutiques] = React.useState(data?.boutiques || 'all');
  const [proximity, setProximity] = React.useState(data?.proximity || false);
  const targeted = boutiques === 'all' ? (window.STORES || []).length : boutiques.length;
  return (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
      <div className="modal-head">
        <div className="ava ava-gd" style={{ width: 40, height: 40 }}><Ico.megaphone size={18}/></div>
        <div className="grow">
          <h2>{data ? data.name : 'Nouvelle campagne'}</h2>
          <div className="sub">Touchez vos clients avec une offre limitée dans le temps.</div>
        </div>
        <button className="icon-btn" onClick={onClose}><Ico.x size={16}/></button>
      </div>
      <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div><label className="lbl">Nom de la campagne</label><input className="input" defaultValue={data?.name || ''} placeholder="ex. Double points week-end"/></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><label className="lbl">Type</label><select className="select"><option>Multiplicateur</option><option>Réactivation</option><option>Acquisition</option><option>Proximité</option><option>Annonce</option></select></div>
          <div><label className="lbl">Audience (clients)</label><select className="select"><option>Tous les clients</option><option>Clients inactifs</option><option>Palier Or et +</option></select></div>
          <div><label className="lbl">Date de début</label><input className="input" type="date" defaultValue="2026-06-01"/></div>
          <div><label className="lbl">Date de fin</label><input className="input" type="date" defaultValue="2026-06-15"/></div>
        </div>

        <div style={{ padding: 14, borderRadius: 12, border: '1px solid var(--border-2)', background: 'var(--surface)' }}>
          <BoutiqueScope value={boutiques} onChange={setBoutiques} label="Boutiques ciblées" help="Diffusez la campagne dans toute l'enseigne ou sur des points de vente précis."/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0 0', marginTop: 12, borderTop: '1px solid var(--border)' }}>
            <Switch on={proximity} onChange={setProximity}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>Ciblage de proximité</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Notifier les clients proches des boutiques ciblées (géolocalisation)</div>
            </div>
            {proximity && (
              <select className="select" style={{ width: 110 }}><option>1 km</option><option>2 km</option><option>5 km</option></select>
            )}
          </div>
        </div>

        <CampaignMessage/>
        <div style={{ padding: 14, background: 'var(--g0)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Ico.info size={18} style={{ color: 'var(--g3)', flex: 'none' }}/>
          <div style={{ fontSize: 12.5, color: 'var(--g4)' }}>Diffusion sur <strong>{boutiques === 'all' ? "toute l'enseigne" : `${targeted} boutique${targeted > 1 ? 's' : ''}`}</strong>{proximity ? ', clients à proximité' : ''}. Budget estimé : <strong className="num">~{boutiques === 'all' ? '120k' : (targeted * 40) + 'k'} points</strong>.</div>
        </div>
      </div>
      <div className="modal-foot">
        <div className="grow"/>
        <button className="btn btn-soft" onClick={onClose}>Enregistrer en brouillon</button>
        <button className="btn btn-primary" onClick={() => { onClose(); toast('Campagne programmée', data?.name || 'Nouvelle campagne', 'gd'); }}><Ico.send size={14}/> Programmer</button>
      </div>
    </div>
  </div>
  );
};

// ===== Confirm Dialog =====
const ConfirmDialog = ({ kind, data, onClose, toast }) => {
  const cfg = {
    'remove-staff': { title: 'Retirer cet agent ?', body: <span><strong>{data?.name}</strong> perdra l'accès à la caisse Jubelee. Son historique de transactions sera conservé.</span>, cta: 'Retirer l\u2019agent', toastT: 'Agent retiré' },
    'delete-rule': { title: 'Supprimer cette règle ?', body: <span>La règle <strong>{data?.name}</strong> sera définitivement supprimée. Les points déjà attribués ne sont pas affectés.</span>, cta: 'Supprimer', toastT: 'Règle supprimée' },
  }[kind] || {};
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '28px 28px 20px' }}>
          <div className="ava" style={{ width: 52, height: 52, background: 'var(--t0)', color: 'var(--t3)', margin: '0 auto 16px' }}><Ico.alert size={24}/></div>
          <div className="serif" style={{ fontSize: 22, color: 'var(--heading)' }}>{cfg.title}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, lineHeight: 1.55 }}>{cfg.body}</div>
        </div>
        <div className="modal-foot" style={{ background: 'transparent', borderTop: 0, paddingTop: 0, justifyContent: 'center' }}>
          <button className="btn btn-soft" style={{ flex: 1 }} onClick={onClose}>Annuler</button>
          <button className="btn" style={{ flex: 1, background: 'var(--t2)', color: '#fff' }} onClick={() => { onClose(); toast(cfg.toastT, data?.name, 'tr'); }}>{cfg.cta}</button>
        </div>
      </div>
    </div>
  );
};

// ===== Notifications Panel =====
const NotifPanel = ({ onClose }) => {
  const items = [
    { ic: <Ico.award size={15}/>, k: 'gd', t: '12 clients ont atteint le palier Or', s: 'Cette semaine', read: false },
    { ic: <Ico.alert size={15}/>, k: 'tr', t: '52 clients inactifs depuis 30 jours', s: 'Pensez à lancer une réactivation', read: false },
    { ic: <Ico.star size={15}/>, k: 'em', t: 'Aïcha a battu son record de points', s: 'Il y a 2 h', read: true },
    { ic: <Ico.gift size={15}/>, k: 'tl', t: 'Campagne « Double points » à 68% du budget', s: 'Il y a 5 h', read: true },
    { ic: <Ico.mail size={15}/>, k: 'gd', t: 'Votre rapport hebdomadaire est prêt', s: 'Hier', read: true },
  ];
  return (
    <div style={{ position: 'absolute', top: 56, right: 0, width: 360, zIndex: 40 }} onClick={e => e.stopPropagation()}>
      <div className="card" style={{ boxShadow: 'var(--shadow-pop)' }}>
        <div className="card-head" style={{ alignItems: 'center' }}>
          <div className="grow"><h3>Notifications</h3></div>
          <span className="pill pill-terra">2 non lues</span>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {items.map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 20px', borderTop: '1px solid var(--border)', background: n.read ? 'transparent' : 'var(--n1)', cursor: 'pointer' }}>
              <div className={`ava ava-${n.k}`} style={{ width: 32, height: 32 }}>{n.ic}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 600, color: 'var(--heading)', lineHeight: 1.35 }}>{n.t}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{n.s}</div>
              </div>
              {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--e2)', flex: 'none', marginTop: 6 }}/>}
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <button className="btn btn-soft btn-sm" style={{ width: '100%' }} onClick={onClose}>Tout marquer comme lu</button>
        </div>
      </div>
    </div>
  );
};

// ===== Campaign push message (multilang, client-facing) =====
const CampaignMessage = () => {
  const [msg, setMsg] = React.useState({
    fr: "Ce week-end, gagnez 2x plus de points sur toute l'addition ! 🎉",
    en: 'This weekend, earn 2x points on your whole bill! 🎉',
    dua: '',
  });
  return <MultiLangField label="Message push" textarea value={msg} onChange={setMsg}
    help="Envoyé en notification + affiché dans l'app client, dans sa langue." />;
};

// ===== Store / Boutique creation modal =====
const StoreModal = ({ data, onClose, toast }) => {
  const isEdit = !!data;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="ava ava-em" style={{ width: 40, height: 40 }}><Ico.store size={18}/></div>
          <div className="grow">
            <h2>{isEdit ? 'Modifier la boutique' : 'Ajouter une boutique'}</h2>
            <div className="sub">{isEdit ? 'Mettez à jour les informations de l\u2019emplacement.' : 'Ajoutez un nouvel emplacement à votre réseau centralisé.'}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Ico.x size={16}/></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label className="lbl">Nom de la boutique</label><input className="input" defaultValue={data?.name?.replace('Chez Mama · ','') || ''} placeholder="ex. Chez Mama · Bonapriso"/></div>
            <div><label className="lbl">Quartier</label><input className="input" defaultValue={data?.short || ''} placeholder="ex. Bonapriso"/></div>
            <div style={{ gridColumn: '1 / -1' }}><label className="lbl">Adresse complète</label><input className="input" defaultValue={data?.address || ''} placeholder="Rue, quartier, ville"/></div>
            <div><label className="lbl">Latitude</label><input className="input num" defaultValue={data?.lat || ''} placeholder="4.0511"/></div>
            <div><label className="lbl">Longitude</label><input className="input num" defaultValue={data?.lng || ''} placeholder="9.7679"/></div>
          </div>
          <div style={{ padding: 14, background: 'var(--n1)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
            <Ico.globe size={18} style={{ color: 'var(--tl2)', flex: 'none' }}/>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Les coordonnées GPS placent la boutique sur la carte du réseau et dans l'app client pour aider les clients à la trouver.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label className="lbl">Couleur du repère</label>
              <div style={{ display: 'flex', gap: 8 }}>{['#1FA971','#C89B3C','#0F766E','#C26D52'].map((c,i)=>(<div key={c} style={{ width: 30, height: 30, borderRadius: 8, background: c, cursor: 'pointer', boxShadow: i===0?'0 0 0 2px var(--surface),0 0 0 4px '+c:'none' }}/>))}</div>
            </div>
            <div><label className="lbl">Statut</label><select className="select"><option>Ouverte</option><option>Ouverture prochaine</option><option>Temporairement fermée</option></select></div>
          </div>
          <div><label className="lbl">Horaires d'ouverture</label><input className="input" defaultValue={data?.hours || ''} placeholder="ex. 10:00 – 23:00"/></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <Switch on={false} onChange={() => {}}/>
            <div><div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--heading)' }}>Définir comme siège</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>La boutique principale du réseau.</div></div>
          </div>
        </div>
        <div className="modal-foot">
          {isEdit && <button className="btn btn-danger btn-sm"><Ico.trash size={13}/> Supprimer</button>}
          <div className="grow"/>
          <button className="btn btn-soft" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={() => { onClose(); toast(isEdit ? 'Boutique mise à jour' : 'Boutique ajoutée', data?.short || 'Nouvel emplacement', 'em'); }}>{isEdit ? 'Enregistrer' : 'Ajouter la boutique'}</button>
        </div>
      </div>
    </div>
  );
};

// ===== Reward editor modal (client-facing → multilang) =====
const RewardModal = ({ data, onClose, toast }) => {
  const isEdit = !!data;
  const [rname, setRname] = React.useState(isEdit ? { fr: data.name, en: '', dua: '' } : { fr: '', en: '', dua: '' });
  const [rdesc, setRdesc] = React.useState(isEdit ? { fr: data.desc, en: '', dua: '' } : { fr: '', en: '', dua: '' });
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="ava ava-gd" style={{ width: 40, height: 40 }}><Ico.gift size={18}/></div>
          <div className="grow">
            <h2>{isEdit ? 'Modifier la récompense' : 'Nouvelle récompense'}</h2>
            <div className="sub">Ce que vos clients débloquent avec leurs points — visible dans l'app client.</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Ico.x size={16}/></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MultiLangField label="Nom de la récompense" value={rname} onChange={setRname} placeholder="ex. Café offert"/>
          <MultiLangField label="Description" textarea value={rdesc} onChange={setRdesc} placeholder="Décrivez la récompense"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div><label className="lbl">Coût (points)</label><input className="input num" defaultValue={data?.cost || ''} placeholder="1500"/></div>
            <div><label className="lbl">Palier requis</label><select className="select" defaultValue={data?.tier}><option>Tous</option><option>Argent +</option><option>Or +</option><option>Platine</option></select></div>
            <div><label className="lbl">Stock / mois</label><input className="input" defaultValue={data?.stock === '∞' ? '' : data?.stock} placeholder="Illimité"/></div>
          </div>
          <div>
            <label className="lbl">Icône</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['cup',<Ico.cup size={16}/>],['card',<Ico.card size={16}/>],['gift',<Ico.gift size={16}/>],['award',<Ico.award size={16}/>]].map(([id,ic],i)=>(
                <div key={id} className={`ava ava-${i===0?'em':'nu'}`} style={{ width: 38, height: 38, borderRadius: 10, cursor: 'pointer', color: i===0?'':'var(--n6)', border: i===0?'1.5px solid var(--e2)':'1px solid var(--border-2)' }}>{ic}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <span style={{ fontSize: 12, color: 'var(--muted)' }}><Ico.globe size={13} style={{ verticalAlign: -2, marginRight: 5 }}/>Traduisez pour chaque langue de vos clients</span>
          <div className="grow"/>
          <button className="btn btn-soft" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={() => { onClose(); toast(isEdit ? 'Récompense mise à jour' : 'Récompense créée', rname.fr || 'Nouvelle récompense', 'em'); }}>{isEdit ? 'Enregistrer' : 'Créer'}</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { MultiLangField, RuleModal, StaffModal, CampaignModal, CampaignMessage, ConfirmDialog, NotifPanel, StoreModal, RewardModal });
