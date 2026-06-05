/* eslint-disable */
const Settings = ({ toast, langs = ['fr','en'], setLangs }) => {
  const [tab, setTab] = React.useState('store');
  const [notif, setNotif] = React.useState({ ptsEarn: true, reward: true, tier: true, weekly: true, dormant: false, sms: false });

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div className="serif" style={{ fontSize: 26, color: 'var(--heading)' }}>Paramètres</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Configurez votre boutique, votre marque et vos notifications.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Side nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 84 }}>
          {[
            { id: 'store', label: 'Enseigne', icon: <Ico.store size={15}/> },
            { id: 'brand', label: 'Marque & QR', icon: <Ico.spark size={15}/> },
            { id: 'notif', label: 'Notifications', icon: <Ico.bell size={15}/> },
            { id: 'billing', label: 'Abonnement', icon: <Ico.card size={15}/> },
            { id: 'security', label: 'Sécurité', icon: <Ico.shield size={15}/> },
          ].map(t => (
            <div key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
              background: tab === t.id ? 'var(--surface)' : 'transparent',
              border: tab === t.id ? '1px solid var(--border)' : '1px solid transparent',
              color: tab === t.id ? 'var(--heading)' : 'var(--muted)',
              boxShadow: tab === t.id ? 'var(--shadow-card)' : 'none',
            }}>
              <span style={{ color: tab === t.id ? 'var(--e3)' : 'var(--soft)' }}>{t.icon}</span>{t.label}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tab === 'store' && (
            <>
              <div className="card">
                <div className="card-head"><div className="grow"><h3>Informations de l'enseigne</h3><div className="sub">Identité de votre marque — visible par vos clients dans l'app Jubelee</div></div></div>
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="sb-store-mark" style={{ width: 64, height: 64, fontSize: 30, borderRadius: 16 }}>C</div>
                    <div>
                      <button className="btn btn-ghost btn-sm" onClick={() => toast('Logo mis à jour', 'Votre nouveau logo est enregistré.', 'em')}><Ico.download size={13}/> Changer le logo</button>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>PNG ou SVG, min. 512×512px</div>
                    </div>
                  </div>
                  <div><label className="lbl">Nom de l'enseigne</label><input className="input" defaultValue="Chez Mama"/></div>
                  <div><label className="lbl">Catégorie</label><select className="select"><option>Restaurant</option><option>Café</option><option>Commerce de détail</option></select></div>
                  <div><label className="lbl">Contact général</label><input className="input" defaultValue="+237 6 99 00 11 22"/></div>
                  <div><label className="lbl">Siège social</label><input className="input" defaultValue="Rue Joffre, Akwa, Douala"/></div>
                  <div style={{ gridColumn: '1 / -1' }}><label className="lbl">Description</label><textarea className="textarea" rows="2" defaultValue="Cuisine camerounaise authentique, ambiance familiale au cœur d'Akwa."/></div>
                </div>
                <div className="modal-foot" style={{ borderRadius: '0 0 16px 16px' }}>
                  <div className="grow"/>
                  <button className="btn btn-soft">Annuler</button>
                  <button className="btn btn-primary" onClick={() => toast('Enseigne enregistrée', 'Vos modifications sont en ligne.', 'em')}>Enregistrer</button>
                </div>
              </div>
              <div className="card">
                <div className="card-head"><div className="grow"><h3>Points de vente</h3><div className="sub">Adresse, coordonnées GPS et horaires se gèrent par boutique</div></div><span className="pill pill-neutral">{(window.STORES||[]).length} boutiques</span></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(window.STORES || []).map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div className={`ava ava-${s.kind}`} style={{ width: 32, height: 32 }}>{s.mark}</div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>{s.short}</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{s.address} · {s.hours}</div></div>
                      {s.isHQ && <Pill kind="emerald">Siège</Pill>}
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Ico.info size={13}/> Ouvrez l'onglet <strong style={{ color: 'var(--body)' }}>Boutiques</strong> (menu de gauche) pour ajouter ou modifier un point de vente.
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'brand' && (<>
            <div className="card">
              <div className="card-head"><div className="grow"><h3>Marque & QR d'enrôlement</h3><div className="sub">Personnalisez l'expérience de vos clients</div></div></div>
              <div className="card-body">
                <div className="qr-box" style={{ marginBottom: 18 }}>
                  <QRGrid pattern={QR_PATTERN}/>
                  <div>
                    <div className="qr-name">Chez Mama</div>
                    <div className="qr-slug">jubelee.app/chez-mama</div>
                    <div className="qr-actions">
                      <button className="qr-btn" onClick={() => toast('QR téléchargé', 'Format imprimable A5.', 'gd')}><Ico.download size={13}/> Affiche A5</button>
                      <button className="qr-btn"><Ico.copy size={13}/> Copier le lien</button>
                    </div>
                  </div>
                </div>
                <label className="lbl">Couleur d'accent de la marque</label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  {['#C89B3C','#1FA971','#0F766E','#C26D52','#8A3D28'].map((c, i) => (
                    <div key={c} style={{ width: 36, height: 36, borderRadius: 10, background: c, cursor: 'pointer', boxShadow: i === 0 ? '0 0 0 2px var(--surface), 0 0 0 4px ' + c : 'none' }}/>
                  ))}
                </div>
                <label className="lbl">Lien personnalisé</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--muted)' }}>jubelee.app/<span style={{ color: 'var(--heading)', fontWeight: 600 }}>chez-mama</span></div>
                  <button className="btn btn-ghost">Modifier</button>
                </div>
              </div>
            </div>
            <LanguagesCard langs={langs} setLangs={setLangs} toast={toast}/>
            </>
          )}

          {tab === 'notif' && (
            <div className="card">
              <div className="card-head"><div className="grow"><h3>Notifications</h3><div className="sub">Choisissez ce qui déclenche un message à vos clients et à vous</div></div></div>
              <div className="card-body">
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Vers les clients</div>
                {[
                  ['ptsEarn', 'Points gagnés', 'Notification push après chaque transaction', <Ico.star size={15}/>],
                  ['reward', 'Récompense disponible', 'Quand un client peut débloquer une récompense', <Ico.gift size={15}/>],
                  ['tier', 'Changement de palier', 'Félicitations lors d\u2019une montée de palier', <Ico.award size={15}/>],
                ].map(([k, t, d, ic]) => (
                  <NotifRow key={k} icon={ic} title={t} desc={d} on={notif[k]} onChange={() => setNotif(p => ({ ...p, [k]: !p[k] }))}/>
                ))}
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', margin: '18px 0 10px' }}>Vers l'équipe</div>
                {[
                  ['weekly', 'Rapport hebdomadaire', 'Résumé de performance chaque lundi par e-mail', <Ico.mail size={15}/>],
                  ['dormant', 'Alerte clients dormants', 'Quand plus de 50 clients deviennent inactifs', <Ico.alert size={15}/>],
                  ['sms', 'Notifications SMS', 'Recevoir les alertes critiques par SMS', <Ico.phone size={15}/>],
                ].map(([k, t, d, ic]) => (
                  <NotifRow key={k} icon={ic} title={t} desc={d} on={notif[k]} onChange={() => setNotif(p => ({ ...p, [k]: !p[k] }))}/>
                ))}
              </div>
              <div className="modal-foot" style={{ borderRadius: '0 0 16px 16px' }}>
                <div className="grow"/>
                <button className="btn btn-primary" onClick={() => toast('Préférences enregistrées', 'Vos notifications sont à jour.', 'em')}>Enregistrer</button>
              </div>
            </div>
          )}

          {tab === 'billing' && (
            <div className="card">
              <div className="card-head"><div className="grow"><h3>Abonnement</h3></div></div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18, borderRadius: 14, background: 'linear-gradient(160deg, #E8F7EE, #FFFFFF 70%)', border: '1px solid var(--e1)' }}>
                  <div className="ava ava-em" style={{ width: 48, height: 48 }}><Ico.spark size={22}/></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="serif" style={{ fontSize: 22, color: 'var(--heading)' }}>Plan Growth</span>
                      <Pill kind="emerald" dot>Actif</Pill>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Jusqu'à 5 000 clients · 5 agents · campagnes illimitées</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="serif" style={{ fontSize: 26, color: 'var(--heading)' }}>15 000<small style={{ fontSize: 14 }}> F/mois</small></div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Prochain prélèvement 1 juin</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-gold">Passer au plan Scale</button>
                  <button className="btn btn-ghost">Historique de facturation</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="card">
              <div className="card-head"><div className="grow"><h3>Sécurité</h3></div></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  ['Authentification à deux facteurs', 'Protégez votre compte avec un code SMS', true],
                  ['Validation PIN pour récompenses', 'Exiger un code agent pour valider une récompense', true],
                  ['Déconnexion automatique', 'Après 30 min d\u2019inactivité en caisse', false],
                ].map(([t, d, on], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                    <div className="ava ava-nu" style={{ width: 36, height: 36, color: 'var(--n6)' }}><Ico.lock size={15}/></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--heading)' }}>{t}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{d}</div>
                    </div>
                    <Switch on={on} onChange={() => toast('Paramètre mis à jour', t, 'em')}/>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LanguagesCard = ({ langs, setLangs, toast }) => {
  const toggle = (id) => {
    if (id === 'fr') return; // primary, always on
    const next = langs.includes(id) ? langs.filter(l => l !== id) : [...langs, id];
    setLangs(next);
    toast('Langues mises à jour', `${next.length} langue${next.length > 1 ? 's' : ''} active${next.length > 1 ? 's' : ''}.`, 'em');
  };
  return (
    <div className="card">
      <div className="card-head">
        <div className="grow"><h3>Langues du programme</h3><div className="sub">Le contenu vu par vos clients (récompenses, campagnes, fiche QR) sera traduisible dans ces langues</div></div>
        <span className="pill pill-emerald">{langs.length} active{langs.length > 1 ? 's' : ''}</span>
      </div>
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {ALL_LANGS.map(l => {
          const on = langs.includes(l.id);
          const primary = l.id === 'fr';
          return (
            <div key={l.id} onClick={() => toggle(l.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12,
              cursor: primary ? 'default' : 'pointer',
              border: on ? '1.5px solid var(--e2)' : '1px solid var(--border-2)',
              background: on ? 'var(--e0)' : 'var(--surface)',
            }}>
              <span style={{ fontSize: 20 }}>{l.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--heading)' }}>{l.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{primary ? 'Langue principale' : on ? 'Active' : 'Inactive'}</div>
              </div>
              {primary
                ? <Pill kind="gold">Par défaut</Pill>
                : <Switch on={on} onChange={() => toggle(l.id)}/>}
            </div>
          );
        })}
      </div>
      <div style={{ padding: '0 20px 18px', fontSize: 11.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Ico.info size={13}/> Le client voit automatiquement la langue de son téléphone, avec repli sur le français.
      </div>
    </div>
  );
};

const NotifRow = ({ icon, title, desc, on, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
    <div className="ava ava-nu" style={{ width: 36, height: 36, color: 'var(--n6)' }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--heading)' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</div>
    </div>
    <Switch on={on} onChange={onChange}/>
  </div>
);

window.Settings = Settings;
