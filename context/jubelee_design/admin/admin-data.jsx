/* eslint-disable */
// ===== Company / multi-store model =====
// One company "Chez Mama" with 3 centralized locations.
const COMPANY = { name: 'Chez Mama', category: 'Restaurant', slug: 'chez-mama' };

const STORES = [
  { id: 'akwa', name: 'Chez Mama · Akwa', short: 'Akwa', mark: 'A', kind: 'em',
    address: 'Rue Joffre, Akwa, Douala', lat: 4.0498, lng: 9.7009, x: 42, y: 46,
    status: 'open', clients: 642, agents: 4, ptsMonth: '214k', isHQ: true, hours: '10:00 – 23:00', rules: 4, campaigns: 2 },
  { id: 'bonanjo', name: 'Chez Mama · Bonanjo', short: 'Bonanjo', mark: 'B', kind: 'gd',
    address: 'Bd de la Liberté, Bonanjo, Douala', lat: 4.0445, lng: 9.6890, x: 24, y: 62,
    status: 'open', clients: 388, agents: 3, ptsMonth: '96k', isHQ: false, hours: '11:00 – 22:30', rules: 3, campaigns: 1 },
  { id: 'bonamoussadi', name: 'Chez Mama · Bonamoussadi', short: 'Bonamoussadi', mark: 'M', kind: 'tl',
    address: 'Carrefour Kotto, Bonamoussadi, Douala', lat: 4.0921, lng: 9.7456, x: 68, y: 28,
    status: 'soon', clients: 218, agents: 2, ptsMonth: '42k', isHQ: false, hours: 'Ouverture 1 juin', rules: 2, campaigns: 0 },
];

// ===== Plans =====
const PLANS = [
  { id: 'standard', name: 'Standard', price: '7 500', tagline: 'Pour démarrer la fidélité',
    color: '#0F766E', limits: '1 boutique · 2 agents · 500 clients',
    features: ['Règles de points basiques', 'Simulateur & détection de conflits', 'QR d\u2019enrôlement', 'Récompenses simples', 'Rapports mensuels'],
    advanced: false },
  { id: 'growth', name: 'Growth', price: '15 000', tagline: 'Le plus populaire',
    color: '#1FA971', limits: '3 boutiques · 5 agents · 5 000 clients',
    features: ['Tout Standard, plus :', 'Éditeur de règles visuel (ET/OU)', 'Conditions par palier & horaire', 'Campagnes ciblées illimitées', 'Multi-boutiques & carte', 'Analytics avancés'],
    advanced: true, popular: true },
  { id: 'scale', name: 'Scale', price: '38 000', tagline: 'Pour les enseignes',
    color: '#C89B3C', limits: 'Boutiques illimitées · agents illimités',
    features: ['Tout Growth, plus :', 'Boutiques & clients illimités', 'API & webhooks', 'Rôles & permissions avancés', 'Account manager dédié'],
    advanced: true },
];

// ===== Clients =====
const CLIENTS = [
  { name: 'Marie Kamga', init: 'MK', kind: 'em', tier: 'or', pts: '18 240', visits: 47, spent: '284 500', store: 'Akwa', last: 'Aujourd\u2019hui', joined: 'Jan 2025', phone: '+237 6 99 41 22 08' },
  { name: 'Junior Tchoumi', init: 'JT', kind: 'gd', tier: 'or', pts: '16 980', visits: 41, spent: '251 200', store: 'Akwa', last: 'Hier', joined: 'Jan 2025', phone: '+237 6 77 33 90 14' },
  { name: 'Sandra Mballa', init: 'SM', kind: 'tl', tier: 'argent', pts: '8 420', visits: 28, spent: '142 800', store: 'Bonanjo', last: 'Il y a 2 j', joined: 'Fév 2025', phone: '+237 6 90 18 55 71' },
  { name: 'Paul Ndongo', init: 'PN', kind: 'tr', tier: 'argent', pts: '6 180', visits: 22, spent: '98 400', store: 'Akwa', last: 'Il y a 3 j', joined: 'Mar 2025', phone: '+237 6 55 72 03 46' },
  { name: 'Aline Fotso', init: 'AF', kind: 'nu', tier: 'bronze', pts: '2 340', visits: 9, spent: '38 900', store: 'Bonamoussadi', last: 'Il y a 1 sem', joined: 'Avr 2025', phone: '+237 6 71 64 28 90' },
  { name: 'Éric Nkeng', init: 'EN', kind: 'em', tier: 'platine', pts: '42 600', visits: 88, spent: '612 000', store: 'Akwa', last: 'Aujourd\u2019hui', joined: 'Déc 2024', phone: '+237 6 98 11 47 32' },
  { name: 'Carine Biya', init: 'CB', kind: 'gd', tier: 'bronze', pts: '1 120', visits: 4, spent: '18 200', store: 'Bonanjo', last: 'Il y a 2 sem', joined: 'Mai 2025', phone: '+237 6 79 05 63 18' },
  { name: 'Hervé Manga', init: 'HM', kind: 'tl', tier: 'argent', pts: '9 760', visits: 31, spent: '156 700', store: 'Bonanjo', last: 'Il y a 4 j', joined: 'Fév 2025', phone: '+237 6 60 92 14 77' },
];

// ===== Transactions =====
const TRANSACTIONS = [
  { id: 'TX-8841', client: 'Marie Kamga', init: 'MK', kind: 'em', agent: 'Aïcha B.', store: 'Akwa', amount: '12 400', pts: '+124', type: 'earn', time: '12:42', date: 'Auj.' },
  { id: 'TX-8840', client: 'Éric Nkeng', init: 'EN', kind: 'gd', agent: 'Fatou D.', store: 'Akwa', amount: '—', pts: '−1 500', type: 'redeem', reward: 'Café offert', time: '12:31', date: 'Auj.' },
  { id: 'TX-8839', client: 'Sandra Mballa', init: 'SM', kind: 'tl', agent: 'Yaw O.', store: 'Bonanjo', amount: '8 600', pts: '+172', type: 'earn', note: 'Happy hour x2', time: '11:58', date: 'Auj.' },
  { id: 'TX-8838', client: 'Paul Ndongo', init: 'PN', kind: 'tr', agent: 'Aïcha B.', store: 'Akwa', amount: '5 200', pts: '+52', type: 'earn', time: '11:20', date: 'Auj.' },
  { id: 'TX-8837', client: 'Carine Biya', init: 'CB', kind: 'gd', agent: 'Système', store: 'Bonanjo', amount: '—', pts: '+200', type: 'bonus', note: 'Bienvenue', time: '10:47', date: 'Auj.' },
  { id: 'TX-8836', client: 'Hervé Manga', init: 'HM', kind: 'tl', agent: 'Yaw O.', store: 'Bonanjo', amount: '14 800', pts: '+148', type: 'earn', time: '10:12', date: 'Auj.' },
  { id: 'TX-8835', client: 'Junior Tchoumi', init: 'JT', kind: 'gd', agent: 'Fatou D.', store: 'Akwa', amount: '—', pts: '−3 000', type: 'redeem', reward: '−5% addition', time: '09:34', date: 'Hier' },
  { id: 'TX-8834', client: 'Aline Fotso', init: 'AF', kind: 'nu', agent: 'Kwame A.', store: 'Bonamoussadi', amount: '3 100', pts: '+31', type: 'earn', time: '18:50', date: 'Hier' },
];

// ===== Rewards catalog =====
const REWARDS = [
  { name: 'Café offert', cost: 1500, kind: 'em', icon: 'cup', stock: '∞', claimed: 412, tier: 'Tous', active: true, desc: 'Un café ou thé au choix' },
  { name: '−5% sur l\u2019addition', cost: 3000, kind: 'gd', icon: 'card', stock: '∞', claimed: 286, tier: 'Argent +', active: true, desc: 'Remise immédiate en caisse' },
  { name: 'Dessert maison', cost: 2200, kind: 'tl', icon: 'gift', stock: '∞', claimed: 198, tier: 'Tous', active: true, desc: 'Dessert du jour offert' },
  { name: 'Menu VIP Platine', cost: 12000, kind: 'tr', icon: 'award', stock: '20 / mois', claimed: 34, tier: 'Platine', active: true, desc: 'Entrée + plat + dessert + boisson' },
  { name: 'Boisson offerte', cost: 1000, kind: 'em', icon: 'cup', stock: '∞', claimed: 134, tier: 'Tous', active: false, desc: 'Soft ou jus de fruit frais' },
];

Object.assign(window, { COMPANY, STORES, PLANS, CLIENTS, TRANSACTIONS, REWARDS });
