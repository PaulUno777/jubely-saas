// customer-screens3.jsx — Auth, Sign-up, OTP, My QR, Reward claim, Profile, Personal info, Language

// ────────────────────────────────────────────────────────────────
//   AUTH (welcome / login entry)
// ────────────────────────────────────────────────────────────────
function AuthScreen({ nav }) {
  return (
    <div className="pf-scroll" style={{
      background: 'var(--cream)',
      display: 'flex', flexDirection: 'column',
      padding: '40px 24px 24px',
    }}>
      {/* brand mark */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: 'var(--card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(26,24,20,0.15)',
        }}>
          <LogoMark size={32} gold="#d4ae6c" />
        </div>
        <span className="serif" style={{ fontSize: 30, color: 'var(--ink)', lineHeight: 1 }}>Jubelee</span>
      </div>

      {/* hero copy */}
      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <div className="serif" style={{ fontSize: 32, color: 'var(--ink)', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
          Une carte de fidélité,<br />
          <span style={{ color: 'var(--gold-3)' }}>toutes tes enseignes</span>.
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-mut)', marginTop: 12, lineHeight: 1.55, maxWidth: 300, marginInline: 'auto' }}>
          Cumule des points dans tous les commerces partenaires, débloque des récompenses, sans jamais ressortir une carte plastique.
        </div>
      </div>

      {/* preview card visual */}
      <div style={{
        marginTop: 24, alignSelf: 'center',
        width: '85%',
        background: 'var(--card)', borderRadius: 18,
        padding: 14, color: 'var(--cream)',
        position: 'relative',
        transform: 'rotate(-2deg)',
        boxShadow: '0 16px 40px rgba(26,24,20,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Wordmark size={14} color="var(--cream)" />
          <span className="pill pill-dark">Or</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
          <span className="serif" style={{ fontSize: 32, color: 'var(--gold-2)', lineHeight: 1 }}>2 840</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>pts</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>AMA MBARGA</div>
      </div>

      {/* CTAs */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => nav('signup')} className="btn btn-primary" style={{ width: '100%' }}>
          Créer mon compte
        </button>
        <button onClick={() => nav('login')} className="btn btn-ghost" style={{ width: '100%' }}>
          J'ai déjà un compte
        </button>
        <div style={{ marginTop: 6, textAlign: 'center', fontSize: 11.5, color: 'var(--ink-mut)', lineHeight: 1.5 }}>
          En continuant, tu acceptes les <b style={{ color: 'var(--ink)' }}>Conditions</b> et la <b style={{ color: 'var(--ink)' }}>Politique de confidentialité</b>.
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   SIGN UP
// ────────────────────────────────────────────────────────────────
function SignupScreen({ nav }) {
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('+237 ');
  const [focus, setFocus] = React.useState('phone');
  const ok = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 9;

  return (
    <div className="pf-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => nav('auth')} style={{
          width: 36, height: 36, borderRadius: 50, background: 'var(--cream-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <IconChevronLeft size={18} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--ink-mut)' }}>Étape 1 / 3</span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '14px 20px 8px' }}>
        <div className="serif" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1.15 }}>
          Crée ton compte<br />en moins d'une minute.
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-mut)', marginTop: 8, lineHeight: 1.5 }}>
          On t'envoie un code par SMS pour vérifier ton numéro. Pas de mot de passe à retenir.
        </div>
      </div>

      <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <CField label="Nom complet" Icon={IconUser} value={name} onChange={setName}
          placeholder="Ex. Patricia Mballa" focus={focus === 'name'} onFocus={() => setFocus('name')} />
        <CField label="Téléphone" Icon={IconPhone} value={phone} onChange={setPhone}
          focus={focus === 'phone'} onFocus={() => setFocus('phone')} />

        {/* welcome bonus tease */}
        <div className="card-outline" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'var(--gold-bg)', color: 'var(--gold-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconSparkle size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>+100 pts de bienvenue</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-mut)' }}>Crédités dès ton premier scan en boutique</div>
          </div>
        </div>

        <button onClick={() => nav('otp')} className="btn btn-primary" disabled={!ok}
          style={{ width: '100%', marginTop: 8 }}>
          Recevoir le code SMS
        </button>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-mut)', marginTop: 4 }}>
          Déjà inscrit ? <span onClick={() => nav('login')} style={{ color: 'var(--ink)', fontWeight: 600, cursor: 'pointer' }}>Se connecter</span>
        </div>
      </div>

      {/* mini keyboard area */}
      <div style={{
        marginTop: 'auto',
        padding: '12px 16px 16px',
        background: 'var(--cream-2)', borderTop: '1px solid rgba(26,24,20,0.06)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mut)', textAlign: 'center', marginBottom: 8 }}>
          {focus === 'phone' ? 'Pavé numérique' : 'AZERTY'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: focus === 'phone' ? '1fr 1fr 1fr' : 'repeat(10, 1fr)', gap: 6 }}>
          {(focus === 'phone'
            ? ['1','2','3','4','5','6','7','8','9','','0','⌫']
            : 'azertyuiop'.split('')
          ).map((k, i) => k === '' ? <div key={i} /> : (
            <button key={i} style={{
              padding: '10px 0', background: '#fff', border: 0, borderRadius: 8,
              fontFamily: 'inherit', fontSize: focus === 'phone' ? 18 : 13,
              fontWeight: 500, color: 'var(--ink)',
              boxShadow: '0 1px 0 rgba(26,24,20,0.06)', cursor: 'pointer',
            }}>{k}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CField({ label, value, onChange, Icon, placeholder, focus, onFocus }) {
  return (
    <div className={'field' + (focus ? ' focus' : '')} onClick={onFocus}
      style={focus ? { boxShadow: '0 0 0 2px var(--card) inset' } : {}}>
      <label>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon && <Icon size={16} stroke="var(--ink-mut)" />}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={onFocus}
          style={{ background: 'transparent', border: 0, outline: 0, fontFamily: 'inherit', fontSize: 16, color: 'var(--ink)', width: '100%' }}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   OTP
// ────────────────────────────────────────────────────────────────
function OtpScreen({ nav }) {
  const [code, setCode] = React.useState(['', '', '', '', '', '']);
  const filled = code.filter(c => c).length;

  const setDigit = (i, v) => {
    const next = [...code];
    next[i] = v.slice(-1);
    setCode(next);
  };

  return (
    <div className="pf-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => nav('signup')} style={{
          width: 36, height: 36, borderRadius: 50, background: 'var(--cream-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><IconChevronLeft size={18} /></div>
        <span style={{ fontSize: 13, color: 'var(--ink-mut)' }}>Étape 2 / 3</span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '14px 20px 8px' }}>
        <div className="serif" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1.15 }}>
          Vérifie ton numéro.
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-mut)', marginTop: 8, lineHeight: 1.5 }}>
          On vient d'envoyer un code à <b style={{ color: 'var(--ink)' }}>+237 678 12 34 56</b>.
          <span onClick={() => nav('signup')} style={{ color: 'var(--green)', fontWeight: 600, cursor: 'pointer', marginLeft: 6 }}>Modifier</span>
        </div>
      </div>

      {/* code boxes */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          {code.map((d, i) => (
            <div key={i} style={{
              flex: 1, height: 58, borderRadius: 14,
              background: 'var(--cream-2)',
              border: filled === i ? '2px solid var(--card)' : '0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 500, color: 'var(--ink)',
              fontFamily: 'Instrument Serif', fontStyle: 'italic',
            }}>{d}</div>
          ))}
        </div>

        {/* resend */}
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12.5, color: 'var(--ink-mut)' }}>
          Pas reçu ? <span style={{ color: 'var(--green)', fontWeight: 600, cursor: 'pointer' }}>Renvoyer dans 0:42</span>
        </div>

        {/* prefilled demo */}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setCode(['4', '7', '2', '9', '1', '6'])} style={{
            appearance: 'none', border: 0, cursor: 'pointer',
            padding: '6px 12px', borderRadius: 999,
            background: 'transparent', color: 'var(--gold-3)',
            fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
            border: '1px dashed rgba(184,146,74,0.4)',
          }}>Démo · pré-remplir 472916</button>
        </div>
      </div>

      <div style={{ padding: '14px 16px 16px', marginTop: 'auto' }}>
        <button onClick={() => nav('completeprofile')} className="btn btn-primary"
          disabled={filled < 6} style={{ width: '100%' }}>
          Vérifier le code
        </button>
      </div>

      {/* keypad */}
      <div style={{
        padding: '12px 16px 16px',
        background: 'var(--cream-2)', borderTop: '1px solid rgba(26,24,20,0.06)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => k === '' ? <div key={i} /> : (
            <button key={i} onClick={() => {
              if (k === '⌫') {
                const next = [...code];
                for (let j = code.length - 1; j >= 0; j--) if (next[j]) { next[j] = ''; break; }
                setCode(next);
              } else {
                const next = [...code];
                const i2 = next.findIndex(c => !c);
                if (i2 !== -1) next[i2] = k;
                setCode(next);
              }
            }} style={{
              padding: '12px 0', background: '#fff', border: 0, borderRadius: 10,
              fontFamily: 'inherit', fontSize: 20, fontWeight: 500, color: 'var(--ink)',
              boxShadow: '0 1px 0 rgba(26,24,20,0.06)', cursor: 'pointer',
            }}>{k}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   COMPLETE PROFILE (post-OTP, optional fields)
// ────────────────────────────────────────────────────────────────
function CompleteProfileScreen({ nav }) {
  const [gender, setGender] = React.useState('');
  const [dob, setDob] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [neighborhood, setNeighborhood] = React.useState('Akwa, Douala');

  return (
    <div className="pf-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => nav('otp')} style={{
          width: 36, height: 36, borderRadius: 50, background: 'var(--cream-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><IconChevronLeft size={18} /></div>
        <span style={{ fontSize: 13, color: 'var(--ink-mut)' }}>Étape 3 / 3</span>
        <span onClick={() => nav('wallet')} style={{
          fontSize: 13, fontWeight: 600, color: 'var(--green)', cursor: 'pointer',
        }}>Passer</span>
      </div>

      <div style={{ padding: '14px 20px 8px' }}>
        <div className="serif" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1.15 }}>
          Quelques infos<br />pour <span style={{ color: 'var(--gold-3)' }}>te chouchouter</span>.
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-mut)', marginTop: 8, lineHeight: 1.5 }}>
          Tout est optionnel. Ces infos servent uniquement à recevoir des récompenses pertinentes.
        </div>
      </div>

      <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* gender — segmented */}
        <div className="field">
          <label>Genre (optionnel)</label>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {[
              { id: 'f', label: 'Femme' },
              { id: 'h', label: 'Homme' },
              { id: 'nb', label: 'Autre' },
              { id: 'na', label: 'Préfère ne pas dire' },
            ].map(g => (
              <button key={g.id} onClick={() => setGender(g.id)} style={{
                appearance: 'none', border: 0, cursor: 'pointer',
                padding: '7px 10px', borderRadius: 10,
                background: gender === g.id ? 'var(--card)' : '#fff',
                color: gender === g.id ? 'var(--cream)' : 'var(--ink)',
                fontFamily: 'inherit', fontSize: 11.5, fontWeight: 500,
                flex: 1, whiteSpace: 'nowrap',
              }}>{g.label}</button>
            ))}
          </div>
        </div>

        {/* DOB date stepper */}
        <div className="field">
          <label>Date de naissance (optionnel)</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
            <DobBlock val={dob.split('/')[0] || 'JJ'} sub="Jour" onClick={() => setDob('14/03/1992')} />
            <DobBlock val={dob.split('/')[1] || 'MM'} sub="Mois" onClick={() => setDob('14/03/1992')} />
            <DobBlock val={dob.split('/')[2] || 'AAAA'} sub="Année" wide onClick={() => setDob('14/03/1992')} />
          </div>
        </div>

        <CField label="Email (optionnel)" Icon={IconMail} value={email} onChange={setEmail}
          placeholder="prenom@exemple.com" />

        <CField label="Quartier (optionnel)" Icon={IconPin} value={neighborhood} onChange={setNeighborhood} />

        {/* interests */}
        <div className="field">
          <label>Centres d'intérêt (optionnel)</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {['Restaurants', 'Café', 'Mode', 'Beauté', 'Pharmacie', 'Supermarché', 'Sport'].map((tag, i) => (
              <button key={tag} style={{
                appearance: 'none', border: 0, cursor: 'pointer',
                padding: '6px 10px', borderRadius: 999,
                background: i < 2 ? 'var(--gold-bg)' : '#fff',
                color: i < 2 ? 'var(--gold-3)' : 'var(--ink)',
                border: i < 2 ? '1px solid var(--gold)' : '1px solid rgba(26,24,20,0.12)',
                fontFamily: 'inherit', fontSize: 11.5, fontWeight: 500,
              }}>{i < 2 ? '✓ ' + tag : tag}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 18px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => nav('wallet')} className="btn btn-primary" style={{ width: '100%' }}>
          Terminer & ouvrir mon wallet
        </button>
      </div>
    </div>
  );
}

function DobBlock({ val, sub, wide, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: wide ? 2 : 1,
      background: '#fff', borderRadius: 10,
      padding: '8px 0', textAlign: 'center',
      cursor: 'pointer',
    }}>
      <div className="serif" style={{ fontSize: 18, color: 'var(--ink)' }}>{val}</div>
      <div style={{ fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--ink-mut)', textTransform: 'uppercase', fontWeight: 600 }}>{sub}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   MY QR (presented to staff to be scanned)
// ────────────────────────────────────────────────────────────────
function MyQrScreen({ nav }) {
  return (
    <div className="pf-scroll" style={{
      background: 'var(--card)', color: 'var(--cream)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* top */}
      <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => nav('wallet')} style={{
          width: 36, height: 36, borderRadius: 50, background: 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><IconChevronLeft size={18} /></div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Mon QR</div>
        <div style={{
          width: 36, height: 36, borderRadius: 50, background: 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><IconFlash size={16} /></div>
      </div>

      {/* heading */}
      <div style={{ padding: '14px 24px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          Membre Jubelee
        </div>
        <div className="serif" style={{ fontSize: 26, color: 'var(--cream)', marginTop: 6, lineHeight: 1.1 }}>
          {ME.name}
        </div>
      </div>

      {/* big QR */}
      <div style={{
        margin: '24px auto 0',
        background: 'var(--cream)',
        borderRadius: 28, padding: 16,
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
      }}>
        <BigQR />
      </div>

      {/* helper */}
      <div style={{ padding: '20px 28px 0', textAlign: 'center' }}>
        <div className="serif" style={{ fontSize: 22, color: 'var(--gold-2)', lineHeight: 1.15 }}>
          Présente ce code à la caisse
        </div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 6, lineHeight: 1.5 }}>
          Pour cumuler des points sur ton achat ou réclamer une récompense disponible.
        </div>
      </div>

      {/* secondary actions */}
      <div style={{ padding: '20px 16px 16px', marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button style={{
          appearance: 'none', border: 0, cursor: 'pointer',
          padding: '14px 12px', borderRadius: 16,
          background: 'rgba(255,255,255,0.08)', color: 'var(--cream)',
          fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <IconBookmark size={16} /> Mettre en raccourci
        </button>
        <button style={{
          appearance: 'none', border: 0, cursor: 'pointer',
          padding: '14px 12px', borderRadius: 16,
          background: 'var(--gold-2)', color: 'var(--card)',
          fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <IconClipboard size={16} /> Partager mon QR
        </button>
      </div>
    </div>
  );
}

function BigQR() {
  return (
    <div style={{
      width: 220, height: 220, background: '#fff',
      padding: 8, borderRadius: 16,
      display: 'grid',
      gridTemplateColumns: 'repeat(21, 1fr)', gridTemplateRows: 'repeat(21, 1fr)',
      gap: 1,
    }}>
      {Array.from({ length: 441 }, (_, i) => {
        const seed = (i * 11 + 37) % 17;
        const r = Math.floor(i / 21), c = i % 21;
        // finder squares in 3 corners
        const inFinder = (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
        if (inFinder) {
          const rr = r < 7 ? r : r - 14;
          const cc = c < 7 ? c : c - 14;
          const onBorder = rr === 0 || rr === 6 || cc === 0 || cc === 6;
          const inCenter = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
          return <i key={i} style={{ background: (onBorder || inCenter) ? 'var(--card)' : 'transparent' }} />;
        }
        return <i key={i} style={{ background: seed > 8 ? 'var(--card)' : 'transparent' }} />;
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   CLAIM REWARD — code shown to staff
// ────────────────────────────────────────────────────────────────
function ClaimRewardScreen({ nav, store, reward }) {
  const s = store || STORES[0];
  const r = reward || { title: 'Café offert', cost: 200, icon: IconCoffee };
  const RIcon = r.icon || IconCoffee;
  return (
    <div className="pf-scroll" style={{
      background: 'var(--card)', color: 'var(--cream)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => nav('walletdetail', { store: s })} style={{
          width: 36, height: 36, borderRadius: 50, background: 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><IconChevronLeft size={18} /></div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Récompense</div>
        <div style={{ width: 36 }} />
      </div>

      {/* reward header */}
      <div style={{ padding: '14px 20px 0', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: 'var(--mint)', color: 'var(--green)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RIcon size={30} />
        </div>
        <div className="serif" style={{ fontSize: 28, color: 'var(--cream)', marginTop: 10, lineHeight: 1.1 }}>
          {r.title}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
          Chez <b style={{ color: 'var(--gold-2)' }}>{s.name}</b> · coût <b style={{ color: 'var(--gold-2)' }}>{r.cost} pts</b>
        </div>
      </div>

      {/* QR code + expiry */}
      <div style={{
        margin: '20px auto 0', background: 'var(--cream)',
        borderRadius: 22, padding: 14,
        boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <BigQR />
        </div>
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12,
          background: 'var(--card)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: 'var(--gold-2)',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 14, letterSpacing: '0.08em',
        }}>
          <span>JBL-4F7K-29</span>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter', letterSpacing: '0.04em' }}>
            Code unique
          </span>
        </div>
      </div>

      {/* expiry banner */}
      <div style={{
        margin: '14px 20px 0',
        padding: '10px 12px', borderRadius: 12,
        background: 'rgba(212,174,108,0.12)', color: 'var(--gold-2)',
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 12.5,
      }}>
        <IconClock size={14} />
        <span>Expire dans <b style={{ color: 'var(--gold-2)' }}>14 min</b></span>
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.55)' }}>Solde : 2 840 → 2 640 pts</span>
      </div>

      {/* instructions */}
      <div style={{ padding: '16px 24px 0', textAlign: 'center' }}>
        <div className="serif" style={{ fontSize: 18, color: 'var(--gold-2)' }}>
          Présente ce code à la caisse de {s.name}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 1.5 }}>
          Le caissier scanne le QR — ta récompense est remise immédiatement.
        </div>
      </div>

      <div style={{ padding: '14px 16px 16px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => nav('claimsuccess', { store: s, reward: r })} style={{
          appearance: 'none', border: 0, cursor: 'pointer', width: '100%',
          padding: '14px 20px', borderRadius: 16,
          background: 'var(--gold-2)', color: 'var(--card)',
          fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <IconCheck size={18} /> Simuler le scan caisse
        </button>
        <button onClick={() => nav('walletdetail', { store: s })} style={{
          appearance: 'none', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', width: '100%',
          padding: '13px 20px', borderRadius: 16,
          background: 'transparent', color: 'var(--cream)',
          fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
        }}>Annuler la réclamation</button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   CLAIM SUCCESS
// ────────────────────────────────────────────────────────────────
function ClaimSuccessScreen({ nav, store, reward }) {
  const s = store || STORES[0];
  const r = reward || { title: 'Café offert', cost: 200 };
  return (
    <div className="pf-scroll" style={{ display: 'flex', flexDirection: 'column', padding: '40px 20px 20px', gap: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'var(--mint)', color: 'var(--green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 14px rgba(212,234,223,0.6)',
        }}><IconCheck size={48} sw={2.5} /></div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div className="label-tag" style={{ color: 'var(--green)' }}>Récompense remise</div>
        <div className="serif" style={{ fontSize: 30, color: 'var(--ink)', lineHeight: 1.1, marginTop: 6 }}>
          {r.title}
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-mut)', marginTop: 8, maxWidth: 280, marginInline: 'auto' }}>
          Récupère ta récompense au comptoir de <b style={{ color: 'var(--ink)' }}>{s.name}</b>. {r.cost} pts ont été déduits de ton solde.
        </div>
      </div>

      {/* receipt */}
      <div className="card-cream">
        <div className="label-tag" style={{ marginBottom: 10 }}>Reçu</div>
        <ReceiptRow k="Récompense" v={r.title} />
        <ReceiptRow k="Enseigne" v={s.name} />
        <ReceiptRow k="Coût" v={`${r.cost} pts`} />
        <ReceiptRow k="Solde restant" v="2 640 pts" />
        <ReceiptRow k="Code" v="JBL-4F7K-29" mono last />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
        <button onClick={() => nav('walletdetail', { store: s })} className="btn btn-primary" style={{ width: '100%' }}>
          Voir ma carte
        </button>
        <button onClick={() => nav('wallet')} className="btn btn-ghost" style={{ width: '100%' }}>
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

function ReceiptRow({ k, v, mono, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '8px 0',
      borderBottom: last ? 'none' : '0.5px solid rgba(26,24,20,0.08)',
      fontSize: 13.5,
    }}>
      <span style={{ color: 'var(--ink-mut)' }}>{k}</span>
      <span className={mono ? 'mono' : ''} style={{ color: 'var(--ink)', fontWeight: mono ? 500 : 600 }}>{v}</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   PROFILE (account hub)
// ────────────────────────────────────────────────────────────────
function ProfileHubScreen({ nav }) {
  const totalPoints = PROGRAMS.reduce((a, b) => a + b.pts, 0);
  return (
    <div className="pf-scroll">
      {/* header */}
      <div style={{ padding: '12px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => nav('wallet')} style={{
          width: 36, height: 36, borderRadius: 50, background: 'var(--cream-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><IconChevronLeft size={18} /></div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Mon profil</div>
        <div style={{
          width: 36, height: 36, borderRadius: 50, background: 'var(--cream-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><IconClipboard size={16} /></div>
      </div>

      {/* user card */}
      <div style={{ padding: '14px 16px 0' }}>
        <div className="card-dark" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'var(--gold-2)', color: 'var(--card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 600,
            }}>{ME.initials}</div>
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 24, color: 'var(--cream)', lineHeight: 1.1 }}>{ME.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                +237 678 12 34 56 · membre depuis avril
              </div>
            </div>
            <span className="pill pill-dark">Or</span>
          </div>

          {/* aggregated stats */}
          <div style={{
            marginTop: 16, padding: '12px 14px', borderRadius: 14,
            background: 'rgba(255,255,255,0.05)',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          }}>
            {[
              { lbl: 'Points total', val: fmt(totalPoints), accent: true },
              { lbl: 'Programmes', val: PROGRAMS.length },
              { lbl: 'Récompenses', val: '7' },
            ].map((s, i) => (
              <div key={i} style={{
                paddingLeft: i === 0 ? 0 : 10,
                borderLeft: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{s.lbl}</div>
                <div className="serif" style={{ fontSize: 22, color: s.accent ? 'var(--gold-2)' : 'var(--cream)', marginTop: 2, lineHeight: 1 }}>
                  {s.val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* show my QR shortcut */}
      <div style={{ padding: '14px 16px 0' }}>
        <div onClick={() => nav('myqr')} className="card-cream" style={{
          padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--card)', color: 'var(--gold-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><IconQR size={22} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Présenter mon QR</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-mut)' }}>Pour gagner ou réclamer des points en caisse</div>
          </div>
          <IconChevronRight size={16} stroke="var(--ink-mut)" />
        </div>
      </div>

      {/* settings menu */}
      <div style={{ padding: '14px 16px 0' }}>
        <div className="label-tag" style={{ padding: '6px 4px' }}>Mon compte</div>
        <div className="card-outline" style={{ padding: 0 }}>
          <MenuRow Icon={IconUser}      title="Informations personnelles" sub="Genre, date de naissance, email" onClick={() => nav('personalinfo')} />
          <MenuRow Icon={IconShield}    title="Sécurité & PIN" sub="Code à 4 chiffres pour l'app" />
          <MenuRow Icon={IconBookmark}  title="Adresses enregistrées" sub="Quartier, points de livraison" last />
        </div>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <div className="label-tag" style={{ padding: '6px 4px' }}>Préférences</div>
        <div className="card-outline" style={{ padding: 0 }}>
          <MenuRow Icon={IconBell}      title="Notifications" sub="Proximité, promos, événements" onClick={() => nav('notifprefs')} />
          <MenuRow Icon={IconCompass}   title="Langue" sub="Français" onClick={() => nav('language')} />
          <MenuRow Icon={IconStore}     title="Centres d'intérêt" sub="Catégories préférées" last />
        </div>
      </div>

      <div style={{ padding: '14px 16px 18px' }}>
        <div className="label-tag" style={{ padding: '6px 4px' }}>Aide</div>
        <div className="card-outline" style={{ padding: 0 }}>
          <MenuRow Icon={IconReceipt}   title="Historique d'activité" />
          <MenuRow Icon={IconHeart}     title="Suggérer une enseigne" />
          <MenuRow Icon={IconShield}    title="Confidentialité & données" />
          <MenuRow Icon={IconLogout}    title="Se déconnecter" tone="danger" last />
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-mut)', textAlign: 'center', marginTop: 14 }}>
          Jubelee · v1.0 · build 2604
        </div>
      </div>
    </div>
  );
}

function MenuRow({ Icon, title, sub, tone, onClick, last }) {
  const danger = tone === 'danger';
  return (
    <div onClick={onClick} style={{
      padding: '14px 16px',
      borderBottom: last ? 'none' : '0.5px solid rgba(26,24,20,0.08)',
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: danger ? 'var(--red-bg)' : 'var(--cream-2)',
        color: danger ? 'var(--red)' : 'var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon size={16} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: danger ? 'var(--red)' : 'var(--ink)' }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-mut)', marginTop: 1 }}>{sub}</div>}
      </div>
      {!danger && <IconChevronRight size={14} stroke="var(--ink-mut)" />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   PERSONAL INFO (edit details)
// ────────────────────────────────────────────────────────────────
function PersonalInfoScreen({ nav }) {
  const [gender, setGender] = React.useState('f');
  const [dob, setDob] = React.useState('14 / 03 / 1992');
  const [email, setEmail] = React.useState('ama.mbarga@example.com');
  const [neighborhood, setNeighborhood] = React.useState('Akwa, Douala');
  const [job, setJob] = React.useState('Architecte');

  return (
    <div className="pf-scroll">
      <div style={{ padding: '12px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => nav('profile')} style={{
          width: 36, height: 36, borderRadius: 50, background: 'var(--cream-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><IconChevronLeft size={18} /></div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Informations</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', cursor: 'pointer' }}>Enregistrer</span>
      </div>

      <div style={{ padding: '12px 20px 0' }}>
        <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.2 }}>
          Tu décides ce que les enseignes voient.
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-mut)', marginTop: 6, lineHeight: 1.5 }}>
          Ces infos t'aident à recevoir des récompenses personnalisées (cadeau d'anniversaire, offres ciblées). Elles ne sont jamais revendues.
        </div>
      </div>

      <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* phone (locked) */}
        <div className="field" style={{ opacity: 0.7 }}>
          <label>Téléphone (vérifié)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <IconPhone size={16} stroke="var(--ink-mut)" />
            <span style={{ fontSize: 15, color: 'var(--ink)', flex: 1 }}>+237 678 12 34 56</span>
            <IconCheck size={14} stroke="var(--green)" sw={2.4} />
          </div>
        </div>

        {/* name */}
        <CField label="Nom complet" Icon={IconUser} value={ME.name} onChange={() => {}} />

        {/* gender segmented */}
        <div className="field">
          <label>Genre</label>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {[
              { id: 'f', label: 'Femme' },
              { id: 'h', label: 'Homme' },
              { id: 'nb', label: 'Autre' },
              { id: 'na', label: '—' },
            ].map(g => (
              <button key={g.id} onClick={() => setGender(g.id)} style={{
                appearance: 'none', border: 0, cursor: 'pointer',
                padding: '8px 10px', borderRadius: 10,
                background: gender === g.id ? 'var(--card)' : '#fff',
                color: gender === g.id ? 'var(--cream)' : 'var(--ink)',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
                flex: 1,
              }}>{g.label}</button>
            ))}
          </div>
        </div>

        {/* DOB */}
        <div className="field">
          <label>Date de naissance</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <IconCalendar size={16} stroke="var(--ink-mut)" />
            <span style={{ fontSize: 15, color: 'var(--ink)', flex: 1, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>{dob}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-mut)' }}>Aquarius</span>
          </div>
        </div>

        <CField label="Email" Icon={IconMail} value={email} onChange={setEmail} />
        <CField label="Quartier" Icon={IconPin} value={neighborhood} onChange={setNeighborhood} />
        <CField label="Métier (optionnel)" Icon={IconBookmark} value={job} onChange={setJob} />
      </div>

      {/* privacy footer */}
      <div style={{
        margin: '14px 16px 18px',
        padding: '12px 14px', borderRadius: 14,
        background: 'var(--cream-2)',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <IconShield size={16} stroke="var(--gold-3)" />
        <div style={{ fontSize: 11.5, color: 'var(--ink-mut)', lineHeight: 1.5 }}>
          <b style={{ color: 'var(--ink)' }}>Tes infos ne sont jamais revendues.</b> Les enseignes ne voient que ton prénom, ton palier
          et tes points dans leur programme — rien d'autre.
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//   LANGUAGE
// ────────────────────────────────────────────────────────────────
function LanguageScreen({ nav }) {
  const [lang, setLang] = React.useState('fr');
  const LANGS = [
    { id: 'fr',     name: 'Français',     sub: 'Langue par défaut', flag: 'FR', system: true },
    { id: 'en',     name: 'English',      sub: 'English', flag: 'EN' },
    { id: 'pid',    name: 'Cameroon Pidgin', sub: 'How for do?', flag: 'PG' },
    { id: 'ewo',    name: 'Ewondo',       sub: 'Mbolo', flag: 'EW' },
    { id: 'dua',    name: 'Duala',        sub: 'Idiba lam', flag: 'DU' },
    { id: 'bul',    name: 'Bulu',         sub: 'Mbembe ango', flag: 'BU' },
    { id: 'ff',     name: 'Pulaar',       sub: 'Jam tan', flag: 'PL' },
    { id: 'ar',     name: 'العربية',      sub: 'مرحبا', flag: 'AR', rtl: true },
  ];

  return (
    <div className="pf-scroll">
      <div style={{ padding: '12px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => nav('profile')} style={{
          width: 36, height: 36, borderRadius: 50, background: 'var(--cream-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><IconChevronLeft size={18} /></div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Langue</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '12px 20px 0' }}>
        <div className="serif" style={{ fontSize: 24, color: 'var(--ink)', lineHeight: 1.15 }}>
          La langue de ton wallet.
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-mut)', marginTop: 6, lineHeight: 1.5 }}>
          Affecte l'interface Jubelee. Le contenu envoyé par les enseignes reste dans leur langue d'origine.
        </div>
      </div>

      <div style={{ padding: '14px 16px 14px' }}>
        <div className="card-outline" style={{ padding: 0 }}>
          {LANGS.map((l, i) => (
            <div key={l.id} onClick={() => setLang(l.id)} style={{
              padding: '14px 16px',
              borderBottom: i < LANGS.length - 1 ? '0.5px solid rgba(26,24,20,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: lang === l.id ? 'var(--card)' : 'var(--cream-2)',
                color: lang === l.id ? 'var(--gold-2)' : 'var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
              }}>{l.flag}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--ink)' }}>{l.name}</span>
                  {l.system && <span className="pill pill-cream" style={{ padding: '1px 6px', fontSize: 9.5 }}>Système</span>}
                </div>
                <div dir={l.rtl ? 'rtl' : 'ltr'} className="serif" style={{ fontSize: 13, color: 'var(--ink-mut)', marginTop: 2, fontStyle: 'italic' }}>{l.sub}</div>
              </div>
              {lang === l.id
                ? <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--green)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><IconCheck size={14} sw={2.6} /></div>
                : <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid rgba(26,24,20,0.18)' }} />
              }
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 14, padding: '12px 14px', borderRadius: 14,
          background: 'var(--cream-2)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <IconHeart size={16} stroke="var(--gold-3)" />
          <div style={{ fontSize: 11.5, color: 'var(--ink-mut)', lineHeight: 1.5 }}>
            <b style={{ color: 'var(--ink)' }}>Tu veux Jubelee dans ta langue&nbsp;?</b> Écris-nous — on s'engage à ajouter
            toutes les langues du continent au fur et à mesure.
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  AuthScreen, SignupScreen, OtpScreen, CompleteProfileScreen,
  MyQrScreen, ClaimRewardScreen, ClaimSuccessScreen,
  ProfileHubScreen, PersonalInfoScreen, LanguageScreen,
  CField, BigQR, MenuRow, ReceiptRow,
});
