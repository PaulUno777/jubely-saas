/* Jubelee — architecture des parcours
   Data-driven lanes + auto-routed SVG edges. Vanilla JS. */

/* ────────────────────────────────────────────────────────────────
   NODES — grouped into lanes → zones → rows
   node: { id, t (title), s (sub), kind?, tag?, hub? }
   ──────────────────────────────────────────────────────────────── */
const LANES = [
  {
    portal: 'customer', mark: 'C', name: 'App Client',
    meta: 'PWA mobile · cumul de points', count: '18 écrans', tag: 'Demande',
    zones: [
      { label: 'Onboarding', rows: [
        ['c_auth', 'c_signup', 'c_otp', 'c_profil'],
      ]},
      { label: 'Cœur de l\u2019app', rows: [
        ['c_wallet'],
      ]},
      { label: '', cols: [
        { stack: ['c_walletdetail', 'c_claim', 'c_claimsuccess', 'c_myqr'] },
        { stack: ['c_map', 'c_storedetail', 'c_scanjoin', 'c_joinsheet', 'c_joinsuccess'] },
        { stack: ['c_profilhub', 'c_reglages', 'c_notifs', 'c_lock'] },
      ]},
    ],
    nodes: {
      c_auth:         { t: 'Auth', s: 'Bienvenue + connexion', kind: 'entry' },
      c_signup:       { t: 'Inscription', s: 'Téléphone + nom' },
      c_otp:          { t: 'OTP', s: 'Vérification SMS' },
      c_profil:       { t: 'Compléter profil', s: 'Genre, DOB, intérêts' },
      c_wallet:       { t: 'Wallet', s: 'Carte fidélité multi-enseigne', hub: true, tag: 'Accueil' },
      c_walletdetail: { t: 'Wallet · enseigne', s: 'Points, palier, récompenses' },
      c_claim:        { t: 'Réclamer · code', s: 'Code de remise en caisse' },
      c_claimsuccess: { t: 'Récompense remise', s: 'Reçu post-cramage', kind: 'success' },
      c_myqr:         { t: 'Mon QR', s: 'Code à montrer en caisse' },
      c_map:          { t: 'Carte', s: 'Enseignes à proximité' },
      c_storedetail:  { t: 'Fiche enseigne', s: 'Profil public + aperçu' },
      c_scanjoin:     { t: 'Scan rejoindre', s: 'QR vitrine de l\u2019enseigne', kind: 'entry' },
      c_joinsheet:    { t: 'Rejoindre · sheet', s: 'Aperçu programme + bonus' },
      c_joinsuccess:  { t: 'Bienvenue', s: 'Carte ajoutée au wallet', kind: 'success' },
      c_profilhub:    { t: 'Profil', s: 'Compte, stats, raccourcis' },
      c_reglages:     { t: 'Réglages', s: 'Infos · langue · préférences' },
      c_notifs:       { t: 'Notifications', s: 'Inbox des annonces' },
      c_lock:         { t: 'Push (lock)', s: 'Notif géolocalisée', kind: 'entry' },
    },
  },
  {
    portal: 'staff', mark: 'S', name: 'App Personnel',
    meta: 'Mobile caisse · agents', count: '12 écrans', tag: 'Point de vente',
    zones: [
      { label: 'Accueil', rows: [ ['s_home'] ]},
      { label: 'Opérations', cols: [
        { stack: ['s_scanA', 's_award', 's_awardOk'] },
        { stack: ['s_scanV', 's_validate', 's_validateOk'] },
      ]},
      { label: 'Annuaire & compte', cols: [
        { stack: ['s_clients', 's_clientDetail'] },
        { stack: ['s_newclient', 's_clientNew'] },
      ]},
      { label: '', rows: [ ['s_activity', 's_profile'] ]},
    ],
    nodes: {
      s_home:        { t: 'Accueil', s: 'Tableau de bord agent', hub: true, tag: 'Accueil' },
      s_scanA:       { t: 'Scanner · attribuer', s: 'Cible le QR client' },
      s_award:       { t: 'Attribuer points', s: '1 pt / 100 FCFA' },
      s_awardOk:     { t: 'Points crédités', s: 'Confirmation', kind: 'success' },
      s_scanV:       { t: 'Scanner · valider', s: 'Cible le code de remise' },
      s_validate:    { t: 'Valider récompense', s: 'Cramer & remettre' },
      s_validateOk:  { t: 'Code cramé', s: 'Confirmation', kind: 'success' },
      s_clients:     { t: 'Clients', s: 'Annuaire boutique' },
      s_clientDetail:{ t: 'Fiche client', s: 'Historique & palier' },
      s_newclient:   { t: 'Nouveau client', s: 'Inscription en boutique' },
      s_clientNew:   { t: 'Client créé', s: 'Carte provisionnée', kind: 'success' },
      s_activity:    { t: 'Activité', s: 'Historique 7 jours' },
      s_profile:     { t: 'Compte', s: 'Poste & boutique' },
    },
  },
  {
    portal: 'admin', mark: 'A', name: 'Back-office Admin',
    meta: 'Web app · gérant', count: '13 vues', tag: 'Back-office',
    isTree: true,
    zones: [
      { label: 'Pilotage', spine: true, rows: [
        ['a_dashboard', 'a_clients'],
        ['a_transactions', 'a_stores'],
      ]},
      { label: 'Configuration', spine: true, rows: [
        ['a_staff', 'a_rules'],
        ['a_rewards', 'a_qr'],
        ['a_ruleeditor'],
      ]},
      { label: 'Marketing', spine: true, rows: [
        ['a_campaigns', 'a_analytics'],
      ]},
      { label: 'Compte', spine: true, rows: [
        ['a_subscription', 'a_settings'],
      ]},
    ],
    nodes: {
      a_dashboard:   { t: 'Vue d\u2019ensemble', s: 'KPIs & activité', hub: true },
      a_clients:     { t: 'Clients', s: '1 248 membres' },
      a_transactions:{ t: 'Transactions', s: 'Flux temps réel' },
      a_stores:      { t: 'Boutiques', s: '3 emplacements' },
      a_staff:       { t: 'Équipe & agents', s: 'Comptes & rôles' },
      a_rules:       { t: 'Règles de points', s: 'Barème d\u2019attribution' },
      a_ruleeditor:  { t: 'Éditeur de règle', s: 'Conditions & bonus' },
      a_rewards:     { t: 'Récompenses', s: 'Catalogue' },
      a_qr:          { t: 'QR d\u2019enrôlement', s: 'jubelee.app/chez-mama' },
      a_campaigns:   { t: 'Campagnes', s: 'Push & promos' },
      a_analytics:   { t: 'Analytics', s: '30 derniers jours' },
      a_subscription:{ t: 'Abonnement', s: 'Plan & facturation' },
      a_settings:    { t: 'Paramètres', s: 'Boutique & langues' },
    },
  },
];

/* ────────────────────────────────────────────────────────────────
   EDGES — intra-portal "flow" + cross-portal "wire"
   ──────────────────────────────────────────────────────────────── */
const FLOWS = [
  // customer onboarding
  ['c_auth','c_signup'], ['c_signup','c_otp'], ['c_otp','c_profil'], ['c_profil','c_wallet'],
  // customer hub
  ['c_wallet','c_walletdetail'], ['c_wallet','c_map'], ['c_wallet','c_profilhub'],
  ['c_wallet','c_myqr','dim'],
  // rewards
  ['c_walletdetail','c_claim'], ['c_claim','c_claimsuccess'], ['c_claimsuccess','c_walletdetail','back'],
  // discovery & join
  ['c_map','c_storedetail'], ['c_storedetail','c_joinsheet'], ['c_scanjoin','c_joinsheet'],
  ['c_joinsheet','c_joinsuccess'], ['c_joinsuccess','c_walletdetail','dim'],
  // profile + notifs
  ['c_profilhub','c_reglages'], ['c_profilhub','c_notifs'],
  ['c_notifs','c_storedetail','dim'], ['c_lock','c_wallet','dim'],

  // staff
  ['s_home','s_scanA'], ['s_home','s_scanV'], ['s_home','s_clients'], ['s_home','s_newclient'],
  ['s_home','s_activity','dim'], ['s_home','s_profile','dim'],
  ['s_scanA','s_award'], ['s_award','s_awardOk'], ['s_awardOk','s_scanA','back'],
  ['s_scanV','s_validate'], ['s_validate','s_validateOk'], ['s_validateOk','s_scanV','back'],
  ['s_clients','s_clientDetail'], ['s_newclient','s_clientNew'],

  // admin tree (sidebar → section anchors, + rule editor)
  ['a_rules','a_ruleeditor'],
];

// wire kinds → color class; dir is just for label
// lane order on screen: Admin sits in the CENTRE (the brain that configures both apps)
const ORDER = ['customer', 'admin', 'staff'];
const WIRES = [
  { id:1, from:'a_qr',        to:'c_scanjoin',     kind:'control', label:'QR vitrine généré',     side:['l','r'] },
  { id:5, from:'a_rewards',   to:'c_walletdetail', kind:'control', label:'Catalogue récompenses', side:['l','r'] },
  { id:6, from:'a_campaigns', to:'c_notifs',       kind:'control', label:'Push ciblé',            side:['l','r'] },
  { id:4, from:'a_rules',     to:'s_award',        kind:'control', label:'Barème de points',      side:['r','l'] },
  { id:9, from:'a_staff',     to:'s_home',         kind:'control', label:'Comptes agents',        side:['r','l'] },
  { id:7, from:'s_awardOk',   to:'a_transactions', kind:'rollup',  label:'Transaction',           side:['l','r'] },
  { id:8, from:'s_validateOk',to:'a_transactions', kind:'rollup',  label:'Rachat',                side:['l','r'] },
  { id:2, from:'c_myqr',      to:'s_scanA',        kind:'event',   label:'Client scanné → +pts',  route:'bus' },
  { id:3, from:'c_claim',     to:'s_scanV',        kind:'event',   label:'Code remise → cramé',   route:'bus' },
];

const WIRE_COLOR = {
  control: { stroke: getCSS('--gold'),  dash: '7 6', dot: getCSS('--gold') },
  event:   { stroke: getCSS('--green'), dash: null,  dot: getCSS('--green') },
  rollup:  { stroke: getCSS('--rose'),  dash: '2 6', dot: getCSS('--rose') },
};
function getCSS(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#000'; }

/* ────────────────────────────────────────────────────────────────
   RENDER
   ──────────────────────────────────────────────────────────────── */
function nodeHTML(lane, id) {
  const n = lane.nodes[id];
  if (!n) return '';
  const cls = ['node'];
  if (n.hub) cls.push('hub');
  return `<div class="${cls.join(' ')}" id="${id}" data-portal="${lane.portal}"${n.kind?` data-kind="${n.kind}"`:''}>
    ${n.tag?`<span class="ntag">${n.tag}</span>`:''}
    <div class="nt">${n.t}</div>
    ${n.s?`<div class="ns">${n.s}</div>`:''}
  </div>`;
}

function zoneHTML(lane, zone) {
  let inner = '';
  if (zone.rows) {
    inner = zone.rows.map(r => `<div class="row">${r.map(id => nodeHTML(lane, id)).join('')}</div>`).join('<div style="height:16px"></div>');
  } else if (zone.cols) {
    inner = `<div class="row">${zone.cols.map(c => `<div class="stack">${c.stack.map(id => nodeHTML(lane, id)).join('')}</div>`).join('')}</div>`;
  }
  if (zone.spine) {
    inner = `<div class="row"><div class="spine"></div><div class="stack" style="gap:16px">${inner}</div></div>`;
  }
  return `<div class="zone">${zone.label?`<div class="zone-label">${zone.label}</div>`:''}${inner}</div>`;
}

function render() {
  const wrap = document.getElementById('lanes');
  const ordered = ORDER.map(p => LANES.find(l => l.portal === p)).filter(Boolean);
  wrap.innerHTML = ordered.map(lane => `
    <div class="lane" data-portal="${lane.portal}">
      <div class="lane-head">
        <div class="lane-mark">${lane.mark}</div>
        <div>
          <div class="lane-name">${lane.name}</div>
          <div class="lane-meta">${lane.meta} · <span class="mono">${lane.count}</span></div>
        </div>
        <div class="lane-tag">${lane.tag}</div>
      </div>
      ${lane.zones.map(z => zoneHTML(lane, z)).join('')}
    </div>`).join('');
}

/* ────────────────────────────────────────────────────────────────
   EDGE ROUTER — measure node rects, draw bezier paths
   ──────────────────────────────────────────────────────────────── */
const NORMAL = { t:[0,-1], b:[0,1], l:[-1,0], r:[1,0] };

function anchor(rect, side) {
  const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
  switch (side) {
    case 't': return [cx, rect.top];
    case 'b': return [cx, rect.bottom];
    case 'l': return [rect.left, cy];
    case 'r': return [rect.right, cy];
  }
}

function autoSides(a, b) {
  const acx = a.left+a.width/2, acy = a.top+a.height/2;
  const bcx = b.left+b.width/2, bcy = b.top+b.height/2;
  const dx = bcx-acx, dy = bcy-acy;
  if (Math.abs(dy) >= Math.abs(dx)) {
    return dy > 0 ? ['b','t'] : ['t','b'];
  }
  return dx > 0 ? ['r','l'] : ['l','r'];
}

function bezier(p1, s1, p2, s2, k) {
  const n1 = NORMAL[s1], n2 = NORMAL[s2];
  const c1 = [p1[0] + n1[0]*k, p1[1] + n1[1]*k];
  const c2 = [p2[0] + n2[0]*k, p2[1] + n2[1]*k];
  return { d: `M ${p1[0]} ${p1[1]} C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`,
           mid: cubicMid(p1, c1, c2, p2) };
}
function cubicMid(p0,p1,p2,p3){
  const t=0.5, mt=1-t;
  const x = mt*mt*mt*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t*t*t*p3[0];
  const y = mt*mt*mt*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t*t*t*p3[1];
  return [x,y];
}

let EDGE_INDEX = []; // {el, fromId, toId, type}

function buildEdges() {
  const svg = document.getElementById('wires');
  const labels = document.getElementById('wirelabels');
  const diagram = document.getElementById('diagram');
  svg.innerHTML = '';
  labels.innerHTML = '';
  EDGE_INDEX = [];

  // markers
  const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
  defs.innerHTML = `
    <marker id="ar-flow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 1 L9 5 L0 9 Z" fill="${getCSS('--ink-soft')}"/></marker>
    <marker id="ar-control" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 1 L9 5 L0 9 Z" fill="${getCSS('--gold')}"/></marker>
    <marker id="ar-event" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 1 L9 5 L0 9 Z" fill="${getCSS('--green')}"/></marker>
    <marker id="ar-rollup" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 1 L9 5 L0 9 Z" fill="${getCSS('--rose')}"/></marker>`;
  svg.appendChild(defs);

  const base = diagram.getBoundingClientRect();
  const scale = base.width / diagram.offsetWidth || 1; // offsetWidth = design px (ignores transform)
  const rel = (el) => {
    const r = el.getBoundingClientRect();
    return { left:(r.left-base.left)/scale, top:(r.top-base.top)/scale, width:r.width/scale, height:r.height/scale,
             right:(r.right-base.left)/scale, bottom:(r.bottom-base.top)/scale };
  };

  // ── intra flows ──
  FLOWS.forEach(([fromId, toId, mod]) => {
    const fe = document.getElementById(fromId), te = document.getElementById(toId);
    if (!fe || !te) return;
    const a = rel(fe), b = rel(te);
    let [s1, s2] = autoSides(a, b);
    const p1 = anchor(a, s1), p2 = anchor(b, s2);
    const dist = Math.hypot(p2[0]-p1[0], p2[1]-p1[1]);
    const k = Math.max(36, Math.min(dist*0.42, 120));
    const { d } = bezier(p1, s1, p2, s2, k);
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', getCSS('--ink-soft'));
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('marker-end', 'url(#ar-flow)');
    if (mod === 'back') { path.setAttribute('stroke-dasharray','3 5'); path.setAttribute('opacity','0.5'); }
    else if (mod === 'dim') { path.setAttribute('opacity','0.7'); }
    else path.setAttribute('opacity','0.85');
    path.dataset.type = 'flow';
    svg.appendChild(path);
    EDGE_INDEX.push({ el: path, fromId, toId, type: 'flow' });
  });

  // ── cross-portal wires ──
  const lanesBottom = document.getElementById('lanes').offsetHeight;
  const laneRel = (el) => rel(el.closest('.lane'));
  let busIdx = 0;
  WIRES.forEach(w => {
    const fe = document.getElementById(w.from), te = document.getElementById(w.to);
    if (!fe || !te) return;
    const a = rel(fe), b = rel(te);
    const col = WIRE_COLOR[w.kind];
    let d, labelX, labelY;

    if (w.route === 'bus') {
      // spanning wire routed along a clean bus below all lanes
      const busY = lanesBottom + 40 + busIdx * 46;
      const p1 = anchor(a, 'b'), p2 = anchor(b, 'b');
      const c1 = [p1[0], busY], c2 = [p2[0], busY];
      d = `M ${p1[0]} ${p1[1]} C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
      labelX = (p1[0] + p2[0]) / 2 + (busIdx === 0 ? -150 : 150);
      labelY = busY;
      busIdx++;
    } else {
      const [s1, s2] = w.side || autoSides(a, b);
      const p1 = anchor(a, s1), p2 = anchor(b, s2);
      const dist = Math.hypot(p2[0]-p1[0], p2[1]-p1[1]);
      const k = Math.max(50, Math.min(dist*0.5, 150));
      d = bezier(p1, s1, p2, s2, k).d;
      // place label in the gutter between the two lanes (never on a node)
      const fr = laneRel(fe), tr = laneRel(te);
      labelX = (tr.left >= fr.right) ? (fr.right + tr.left)/2 : (tr.right + fr.left)/2;
      labelY = (p1[1] + p2[1]) / 2;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', col.stroke);
    path.setAttribute('stroke-width', '2.25');
    path.setAttribute('marker-end', `url(#ar-${w.kind})`);
    if (col.dash) path.setAttribute('stroke-dasharray', col.dash);
    path.setAttribute('opacity','0.85');
    path.dataset.type = 'wire';
    svg.appendChild(path);
    EDGE_INDEX.push({ el: path, fromId: w.from, toId: w.to, type: 'wire' });

    // label chip
    const chip = document.createElement('div');
    chip.className = 'wlabel';
    chip.dataset.type = 'wire';
    chip.style.left = (labelX + (w.ldx||0)) + 'px';
    chip.style.top = (labelY + (w.ldy||0)) + 'px';
    chip.innerHTML = `<span class="num">${w.id}</span><span class="dot" style="background:${col.dot}"></span>${w.label}`;
    chip.dataset.from = w.from; chip.dataset.to = w.to;
    labels.appendChild(chip);
    EDGE_INDEX[EDGE_INDEX.length-1].chip = chip;
  });

  // ── de-collision: nudge labels clear of nodes and of each other ──
  const overlap = (a, b, m=0) =>
    !(a.right+m < b.left || a.left-m > b.right || a.bottom+m < b.top || a.top-m > b.bottom);
  const nodeRects = [...document.querySelectorAll('.node')].map(n => rel(n));
  const placed = [];
  const offsets = [0,20,-20,40,-40,60,-60,80,-80,100,-100,120,-120];
  [...labels.children].forEach(chip => {
    const baseTop = parseFloat(chip.style.top);
    let chosen = baseTop + 200; // fallback far away if nothing clears
    for (const off of offsets) {
      chip.style.top = (baseTop + off) + 'px';
      const r = rel(chip);
      const hitNode = nodeRects.some(nr => overlap(r, nr, 3));
      const hitLbl = placed.some(pr => overlap(r, pr, 7));
      if (!hitNode && !hitLbl) { chosen = baseTop + off; break; }
    }
    chip.style.top = chosen + 'px';
    placed.push(rel(chip));
  });

  applyView(CURRENT_VIEW);
}

/* ────────────────────────────────────────────────────────────────
   VIEW FILTER + HOVER FOCUS
   ──────────────────────────────────────────────────────────────── */
let CURRENT_VIEW = 'all';
function applyView(view) {
  CURRENT_VIEW = view;
  EDGE_INDEX.forEach(e => {
    const show = view === 'all' || (view === 'flow' && e.type === 'flow') || (view === 'wire' && e.type === 'wire');
    e.el.style.display = show ? '' : 'none';
    if (e.chip) e.chip.style.display = show ? '' : 'none';
  });
  // dim nodes not touched by wires when in wire-only view
  const diagram = document.getElementById('diagram');
  if (view === 'wire') {
    const live = new Set();
    WIRES.forEach(w => { live.add(w.from); live.add(w.to); });
    diagram.classList.add('has-focus');
    document.querySelectorAll('.node').forEach(n => n.classList.toggle('is-on', live.has(n.id)));
  } else {
    diagram.classList.remove('has-focus');
    document.querySelectorAll('.node').forEach(n => n.classList.remove('is-on'));
  }
}

function wireHover() {
  const diagram = document.getElementById('diagram');
  document.querySelectorAll('.node').forEach(node => {
    node.addEventListener('mouseenter', () => {
      if (CURRENT_VIEW === 'wire') return; // wire view manages its own focus
      const connected = new Set([node.id]);
      EDGE_INDEX.forEach(e => {
        if (e.el.style.display === 'none') return;
        if (e.fromId === node.id || e.toId === node.id) {
          connected.add(e.fromId); connected.add(e.toId);
          e.el.style.opacity = '1';
          e.el.style.strokeWidth = e.type === 'wire' ? '3.5' : '2.5';
          if (e.chip) e.chip.style.opacity = '1';
        } else {
          e.el.style.opacity = '0.08';
          if (e.chip) e.chip.style.opacity = '0.15';
        }
      });
      diagram.classList.add('has-focus');
      document.querySelectorAll('.node').forEach(n => n.classList.toggle('is-on', connected.has(n.id)));
    });
    node.addEventListener('mouseleave', () => {
      if (CURRENT_VIEW === 'wire') return;
      EDGE_INDEX.forEach(e => {
        e.el.style.opacity = '';
        e.el.style.strokeWidth = e.type === 'wire' ? '2.5' : '1.5';
        if (e.chip) e.chip.style.opacity = '';
      });
      diagram.classList.remove('has-focus');
      document.querySelectorAll('.node').forEach(n => n.classList.remove('is-on'));
    });
  });
}

/* ────────────────────────────────────────────────────────────────
   FIT TO WIDTH
   ──────────────────────────────────────────────────────────────── */
function fit() {
  const host = document.getElementById('host');
  const diagram = document.getElementById('diagram');
  const lanes = document.getElementById('lanes');
  const vw = host.clientWidth - 8;
  const dw = 1980;
  const scale = Math.min(1, vw / dw);
  diagram.style.transform = `scale(${scale})`;
  // diagram.offsetHeight can collapse under transform/flex; measure content + bottom padding
  const padBottom = 170;
  const contentH = lanes.offsetHeight + padBottom;
  host.style.height = (contentH * scale) + 'px';
}

/* ── boot ── */
function boot() {
  render();
  wireHover();
  document.querySelectorAll('#viewseg button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#viewseg button').forEach(x => x.dataset.active = 'false');
      b.dataset.active = 'true';
      applyView(b.dataset.view);
    });
  });
  // measure after layout settles (fonts)
  requestAnimationFrame(() => { buildEdges(); fit(); });
  setTimeout(() => { buildEdges(); fit(); }, 250);
  setTimeout(() => { buildEdges(); fit(); }, 700);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { buildEdges(); fit(); });
  let lastW = window.innerWidth, rT = null;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastW) < 30) return; // ignore scrollbar / minor jitter
    lastW = window.innerWidth;
    clearTimeout(rT);
    rT = setTimeout(() => { buildEdges(); fit(); }, 200);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
