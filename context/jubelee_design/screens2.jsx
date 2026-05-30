// screens2.jsx — Clients list, New client form, Activity feed, Profile

// ────────────────────────────────────────────────────────────────
//   CLIENTS LIST
// ────────────────────────────────────────────────────────────────
function ClientsScreen({ nav }) {
  const [filter, setFilter] = React.useState('Tous');
  const [query, setQuery] = React.useState('');

  const filters = ['Tous', 'Or', 'Argent', 'Bronze', 'Nouveaux'];
  const list = CLIENTS.filter(c => {
    if (filter === 'Nouveaux') return c.isNew;
    if (filter !== 'Tous' && c.tier !== filter) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="pf-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ padding: '12px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="label-tag">Annuaire</div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.02, marginTop: 2 }}>Clients</div>
        </div>
        <div
          onClick={() => nav('newclient')}
          style={{
            width: 42, height: 42, borderRadius: 14, background: 'var(--card)', color: 'var(--gold-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
          <IconPlus size={20} />
        </div>
      </div>

      {/* search */}
      <div style={{ padding: '6px 20px 8px' }}>
        <div style={{
          background: 'var(--cream-2)', borderRadius: 14, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <IconSearch size={18} stroke="var(--ink-mut)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom, téléphone…"
            style={{
              border: 0, background: 'transparent', outline: 0,
              fontFamily: 'inherit', fontSize: 14, color: 'var(--ink)', flex: 1,
            }} />
        </div>
      </div>

      {/* filter chips */}
      <div style={{
        padding: '4px 20px 8px', display: 'flex', gap: 8,
        overflowX: 'auto',
      }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            appearance: 'none', border: 0, cursor: 'pointer',
            padding: '7px 14px', borderRadius: 999,
            background: filter === f ? 'var(--card)' : 'var(--cream-2)',
            color: filter === f ? 'var(--cream)' : 'var(--ink)',
            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>{f}</button>
        ))}
      </div>

      {/* result count + sort */}
      <div style={{ padding: '4px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--ink-mut)' }}>
        <span>{list.length} client{list.length > 1 ? 's' : ''}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          Récents <IconArrowDown size={12} />
        </span>
      </div>

      {/* list */}
      <div style={{ padding: '4px 20px 16px' }}>
        {list.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-mut)', fontSize: 13 }}>
            Aucun client ne correspond.
          </div>
        ) : list.map(c => (
          <div key={c.id} className="row-client" onClick={() => nav('clientdetail', { client: c })}>
            <div className={'avatar ' + c.tone}>{c.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 500, fontSize: 14.5 }}>{c.name}</span>
                {c.isNew && <span className="pill pill-green" style={{ padding: '1px 6px', fontSize: 9.5 }}>Nouveau</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-mut)', marginTop: 1 }}>
                {c.last} · {c.visits} visites
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="serif" style={{ fontSize: 18, color: 'var(--ink)', lineHeight: 1, fontStyle: 'italic' }}>
                {fmtN(c.points)}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--gold-3)', marginTop: 2, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {c.tier}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   NEW CLIENT FORM
// ────────────────────────────────────────────────────────────────
function NewClientScreen({ nav }) {
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('+237 ');
  const [email, setEmail] = React.useState('');
  const [focus, setFocus] = React.useState('phone');

  const canSubmit = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 9;

  return (
    <div className="pf-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="scr-top">
        <div className="scr-back" onClick={() => nav('clients')}><IconChevronLeft size={20} /></div>
        <div className="scr-title">Nouveau client</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '6px 20px 12px' }}>
        <div className="serif" style={{ fontSize: 24, lineHeight: 1.15, color: 'var(--ink)' }}>
          Inscris un nouveau client en moins d'une minute.
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-mut)', marginTop: 6 }}>
          Le client recevra par SMS un lien d'activation pour finaliser son compte sur l'app.
        </div>
      </div>

      <div style={{ padding: '6px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field
          label="Nom complet"
          Icon={IconUser}
          value={name} onChange={setName} placeholder="Ex. Patricia Mballa"
          focus={focus === 'name'} onFocus={() => setFocus('name')}
        />
        <Field
          label="Téléphone"
          Icon={IconPhone}
          value={phone} onChange={setPhone}
          focus={focus === 'phone'} onFocus={() => setFocus('phone')}
        />
        <Field
          label="Email (optionnel)"
          Icon={IconMail}
          value={email} onChange={setEmail} placeholder="prenom@exemple.com"
          focus={focus === 'email'} onFocus={() => setFocus('email')}
        />

        {/* bonus & default */}
        <div className="card-outline" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gold-bg)', color: 'var(--gold-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <StarSparkle size={16} color="currentColor" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>Bonus d'inscription</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-mut)' }}>+50 pts crédités automatiquement</div>
          </div>
          <span className="pill pill-gold">Inclus</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6, marginBottom: 8 }}>
          <button
            className="btn btn-primary"
            disabled={!canSubmit}
            onClick={() => nav('clientCreated')}
            style={{ width: '100%' }}>
            Créer le compte
          </button>
          <button className="btn btn-ghost" onClick={() => nav('clients')} style={{ width: '100%' }}>
            Annuler
          </button>
        </div>
      </div>

      {/* mini keyboard hint area */}
      <div className="kb-area">
        <div style={{ fontSize: 11, color: 'var(--ink-mut)', textAlign: 'center', marginBottom: 8 }}>
          {focus === 'phone' ? 'Pavé numérique' : 'AZERTY'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: focus === 'phone' ? '1fr 1fr 1fr' : 'repeat(10, 1fr)', gap: 6 }}>
          {(focus === 'phone'
            ? ['1','2','3','4','5','6','7','8','9','','0','⌫']
            : 'azertyuiop'.split('')
          ).map((k, i) => k === '' ? <div key={i} /> : (
            <button key={i} style={{
              padding: '10px 0',
              background: '#fff', border: 0, borderRadius: 8,
              fontFamily: 'inherit', fontSize: focus === 'phone' ? 18 : 13,
              fontWeight: 500, color: 'var(--ink)',
              boxShadow: '0 1px 0 rgba(26,24,20,0.06)',
              cursor: 'pointer',
            }}>{k}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, Icon, placeholder, focus, onFocus }) {
  return (
    <div className={'field' + (focus ? ' focus' : '')} onClick={onFocus}>
      <label>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon && <Icon size={16} stroke="var(--ink-mut)" />}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={onFocus}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   CLIENT CREATED success
// ────────────────────────────────────────────────────────────────
function ClientCreatedScreen({ nav }) {
  return (
    <div className="pf-scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 24px', gap: 22 }}>
      <div className="anim-pop" style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'var(--mint)', color: 'var(--green)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 14px rgba(212,234,223,0.6)',
      }}>
        <IconUser size={42} sw={2} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div className="label-tag" style={{ color: 'var(--green)' }}>Compte créé</div>
        <div className="serif" style={{ fontSize: 36, color: 'var(--ink)', lineHeight: 1.05, marginTop: 6 }}>
          Bienvenue chez Jubelee.
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-mut)', marginTop: 8, maxWidth: 290 }}>
          Un SMS d'activation a été envoyé au client avec un lien vers l'app et son QR personnel.
        </div>
      </div>

      <div className="card-cream" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="avatar green" style={{ width: 44, height: 44, fontSize: 14 }}>PM</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Patricia Mballa</div>
            <div style={{ fontSize: 12, color: 'var(--ink-mut)' }}>+237 678 90 12 34</div>
          </div>
          <span className="pill pill-gold">+50 pts</span>
        </div>
        <div style={{ borderTop: '0.5px solid rgba(26,24,20,0.08)', paddingTop: 10, fontSize: 12, color: 'var(--ink-mut)', lineHeight: 1.5 }}>
          Tu peux scanner son QR dès maintenant pour attribuer des points sur sa première commande.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 'auto' }}>
        <button className="btn btn-primary" onClick={() => nav('scanner', { mode: 'award' })} style={{ width: '100%' }}>
          <IconScan size={18} /> Scanner sa première commande
        </button>
        <button className="btn btn-ghost" onClick={() => nav('clients')} style={{ width: '100%' }}>
          Voir l'annuaire
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   CLIENT DETAIL
// ────────────────────────────────────────────────────────────────
function ClientDetailScreen({ nav, client }) {
  const c = client || CLIENTS[0];
  const history = FEED.filter(f => f.client === c.name).concat(
    // pad with synthetic entries if needed
    [
      { type: 'award',  client: c.name, amount: 6500, points: 65, time: 'avr. 20 · 13:12', meta: 'Table 3' },
      { type: 'redeem', client: c.name, reward: 'Café offert', points: -200, time: 'avr. 15 · 19:02', meta: 'Code cramé' },
      { type: 'award',  client: c.name, amount: 4200, points: 42, time: 'avr. 11 · 12:48', meta: 'Comptoir' },
    ]
  ).slice(0, 5);

  return (
    <div className="pf-scroll">
      <div className="scr-top">
        <div className="scr-back" onClick={() => nav('clients')}><IconChevronLeft size={20} /></div>
        <div className="scr-title">Fiche client</div>
        <div className="scr-back"><IconQR size={18} /></div>
      </div>

      <div style={{ padding: '4px 16px 0' }}>
        {/* client header card */}
        <div className="card-dark" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className={'avatar ' + c.tone} style={{ width: 56, height: 56, fontSize: 18, borderRadius: 16 }}>{c.initials}</div>
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 26, color: 'var(--cream)', lineHeight: 1.1 }}>{c.name}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{c.phone}</div>
            </div>
            <span className="pill" style={{ background: 'var(--gold-bg)', color: 'var(--gold-2)' }}>Palier {c.tier}</span>
          </div>

          <div style={{
            marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            background: 'rgba(255,255,255,0.05)', borderRadius: 14, overflow: 'hidden',
          }}>
            {[
              { lbl: 'Solde', val: fmtN(c.points), suf: 'pts', accent: true },
              { lbl: 'Visites', val: c.visits, suf: '' },
              { lbl: 'Panier moy.', val: '8 400', suf: 'FCFA' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '12px 10px',
                borderRight: i < 2 ? '0.5px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{s.lbl}</div>
                <div className="serif" style={{ fontSize: 22, color: s.accent ? 'var(--gold-2)' : 'var(--cream)', lineHeight: 1.1, marginTop: 2 }}>
                  {s.val}{s.suf && <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginLeft: 4, fontStyle: 'italic' }}>{s.suf}</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500, marginBottom: 6 }}>
              <span>Bronze</span><span>Argent</span><span style={{ color: 'var(--gold-2)' }}>Or</span><span>Platine</span>
            </div>
            <div className="tier-bar"><i style={{ width: '72%' }} /></div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
              <span style={{ color: 'var(--gold-2)' }}>1 160 pts</span> jusqu'au palier Platine
            </div>
          </div>
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn btn-primary" onClick={() => nav('scanner', { mode: 'award' })} style={{ flex: 1 }}>
            <IconPlus size={16} /> Points
          </button>
          <button className="btn btn-ghost" style={{ flex: 1 }}>
            <IconGift size={16} /> Récompense
          </button>
          <button className="btn btn-ghost" style={{ width: 48, padding: 0 }}>
            <IconPhone size={16} />
          </button>
        </div>

        {/* history */}
        <div style={{ marginTop: 22 }}>
          <div className="label-tag" style={{ marginBottom: 4 }}>Historique</div>
          {history.map((f, i) => <ActivityRow key={i} item={f} />)}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   ACTIVITY FEED (full)
// ────────────────────────────────────────────────────────────────
function ActivityScreen({ nav }) {
  const groups = [
    { label: "Aujourd'hui", items: FEED.slice(0, 3) },
    { label: "Hier",        items: FEED.slice(3) },
  ];
  const totals = {
    in: FEED.filter(f => f.type === 'award').reduce((a,b) => a + b.points, 0),
    out: -FEED.filter(f => f.type === 'redeem').reduce((a,b) => a + b.points, 0),
  };
  return (
    <div className="pf-scroll">
      {/* header */}
      <div style={{ padding: '12px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="label-tag">Mouvements</div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.02, marginTop: 2 }}>Activité</div>
        </div>
        <span className="pill pill-cream" style={{ whiteSpace: 'nowrap' }}>7 derniers jours</span>
      </div>

      {/* summary */}
      <div style={{ padding: '4px 16px 0' }}>
        <div className="card-cream" style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                Attribués
              </div>
              <div className="serif" style={{ fontSize: 28, color: 'var(--green)', marginTop: 4, lineHeight: 1 }}>+{fmtN(totals.in)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mut)', marginTop: 4 }}>sur 12 transactions</div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-3)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
                Réclamés
              </div>
              <div className="serif" style={{ fontSize: 28, color: 'var(--gold-3)', marginTop: 4, lineHeight: 1 }}>–{fmtN(totals.out)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mut)', marginTop: 4 }}>sur 4 récompenses</div>
            </div>
          </div>
          {/* tiny sparkline */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginTop: 14, height: 28 }}>
            {[18, 26, 14, 22, 30, 16, 28, 35, 20, 24, 32, 22, 28].map((h, i) => (
              <div key={i} style={{
                flex: 1, height: h, borderRadius: 3,
                background: i === 7 ? 'var(--green)' : i === 11 ? 'var(--gold)' : 'rgba(26,24,20,0.18)',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* filter chips */}
      <div style={{ padding: '14px 20px 6px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {['Tous', 'Points attribués', 'Récompenses', 'Inscriptions'].map((f, i) => (
          <button key={f} style={{
            appearance: 'none', border: 0, cursor: 'pointer',
            padding: '6px 12px', borderRadius: 999,
            background: i === 0 ? 'var(--card)' : 'var(--cream-2)',
            color: i === 0 ? 'var(--cream)' : 'var(--ink)',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>{f}</button>
        ))}
      </div>

      {/* feed grouped */}
      <div style={{ padding: '6px 20px 16px' }}>
        {groups.map((g, gi) => (
          <div key={gi} style={{ marginTop: gi === 0 ? 8 : 18 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-mut)', letterSpacing: '0.04em', marginBottom: 4 }}>{g.label}</div>
            {g.items.map((f, i) => <ActivityRow key={i} item={f} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   PROFILE / COMPTE
// ────────────────────────────────────────────────────────────────
function ProfileScreen({ nav }) {
  return (
    <div className="pf-scroll">
      {/* header */}
      <div style={{ padding: '12px 20px 6px' }}>
        <div className="label-tag">Compte</div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.02, marginTop: 2 }}>Mon poste</div>
      </div>

      {/* staff card */}
      <div style={{ padding: '4px 16px 0' }}>
        <div className="card-dark" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="avatar dark" style={{ width: 56, height: 56, fontSize: 18, borderRadius: 18, background: 'var(--gold-2)', color: 'var(--card)' }}>
              {STAFF.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 26, color: 'var(--cream)', lineHeight: 1.1 }}>{STAFF.name}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {STAFF.role} · {STAFF.badge}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="pill" style={{ background: 'rgba(212,174,108,0.15)', color: 'var(--gold-2)', whiteSpace: 'nowrap' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-2)', display: 'inline-block', animation: 'pulseDot 1.8s ease-in-out infinite' }} />
              En service
            </span>
            <span className="pill pill-dark" style={{ whiteSpace: 'nowrap' }}>Caisse 1</span>
            <span className="pill pill-dark" style={{ whiteSpace: 'nowrap' }}>Permissions Pro</span>
          </div>

          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Service en cours</div>
                <div style={{ fontSize: 13.5, color: 'var(--cream)', marginTop: 2 }}>Ouvert depuis {STAFF.shiftStart}</div>
              </div>
              <div className="serif" style={{ fontSize: 26, color: 'var(--gold-2)', whiteSpace: 'nowrap', lineHeight: 1, flexShrink: 0 }}>3h 47</div>
            </div>
          </div>
        </div>
      </div>

      {/* merchant */}
      <div style={{ padding: '20px 20px 6px' }}>
        <div className="label-tag" style={{ marginBottom: 8 }}>Boutique</div>
        <div className="card-outline" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="avatar gold" style={{ width: 40, height: 40, fontSize: 13 }}>CM</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>{MERCHANT.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-mut)' }}>{MERCHANT.type}</div>
          </div>
          <IconChevronRight size={16} stroke="var(--ink-mut)" />
        </div>
      </div>

      {/* settings list */}
      <div style={{ padding: '14px 20px 6px' }}>
        <div className="label-tag" style={{ marginBottom: 8 }}>Préférences</div>
        <div className="card-outline" style={{ padding: 0 }}>
          {[
            { Icon: IconBell,    title: 'Notifications', sub: 'Alertes scan, palier atteint…' },
            { Icon: IconStore,   title: 'Règle de cumul', sub: MERCHANT.ruleLabel },
            { Icon: IconReceipt, title: 'Historique des codes' },
            { Icon: IconShield,  title: 'Sécurité & PIN' },
          ].map(({ Icon, title, sub }, i, arr) => (
            <div key={i} style={{
              padding: '14px 16px',
              borderBottom: i < arr.length - 1 ? '0.5px solid rgba(26,24,20,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'var(--cream-2)', color: 'var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
                {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-mut)', marginTop: 1 }}>{sub}</div>}
              </div>
              <IconChevronRight size={14} stroke="var(--ink-mut)" />
            </div>
          ))}
        </div>
      </div>

      {/* sign out */}
      <div style={{ padding: '14px 20px 24px' }}>
        <button className="btn btn-danger" style={{ width: '100%' }}>
          <IconLogout size={16} /> Fermer le service
        </button>
        <div style={{ fontSize: 11, color: 'var(--ink-mut)', textAlign: 'center', marginTop: 12 }}>
          Jubelee Staff · v1.0 · build 2604
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ClientsScreen, NewClientScreen, ClientCreatedScreen, ClientDetailScreen,
  ActivityScreen, ProfileScreen, Field,
});
