# Planification Détaillée du Projet Jubely
**Objectif :** MVP robuste en 8 semaines, avec un ordre de développement permettant de tester chaque couche avant de construire la suivante — du superadmin vers le client final.

**Dernière mise à jour :** Mai 2026 — alignée sur les maquettes interactives et l’état du dépôt `jubely-saas`.

---

## Références design (contrat UX / produit)

Les écrans attendus sont définis dans :

| Portail | Maquette | Modules JSX (données mock) |
|---------|----------|---------------------------|
| **Client PWA** | [jubelee_design/Jubelee Customer.html](jubelee_design/Jubelee%20Customer.html) | `customer-screens*.jsx`, `customer-main.jsx` |
| **Personnel (caisse)** | [jubelee_design/Jubelee Staff.html](jubelee_design/Jubelee%20Staff.html) | `screens.jsx`, `screens2.jsx`, `app.jsx` |
| **Admin boutique** | [jubelee_design/Jubelee Admin.html](jubelee_design/Jubelee%20Admin.html) | `admin/*.jsx`, `admin-data.jsx`, `admin-simulator.jsx` |
| **Flux inter-portails** | [Jubelee_Architecture.png](Jubelee_Architecture.png) | 9 flux numérotés (QR enrôlement, scan caisse, config règles/récompenses, remontée analytics) |

**Implémentation frontend actuelle :** une seule app Next.js (`apps/web`) avec préfixes `/customer/*`, `/agent/*`, `/store/*`, `/root/*` — pas deux dépôts séparés.

**Tracker d’exécution :** [docs/ROADMAP.md](../docs/ROADMAP.md) · validation Phase 3 : [docs/phase3-validation.md](../docs/phase3-validation.md)

---

## Écart design ↔ backend (décisions pilot)

| Sujet | Maquette design | Code actuel | Décision pilot |
|-------|-----------------|-------------|----------------|
| Taux de points par défaut | 1 pt / **100** FCFA ([screens.jsx](jubelee_design/screens.jsx)) | 1 pt / **500** FCFA (hard-codé) | Remplacer par **moteur de règles** ; règle seed « Achat standard » = design |
| Identification caisse | Scan **Mon QR** (token HMAC) | Scan partiel ; API achat = téléphone seul | `POST /v1/staff/purchases` accepte `customer_qr` |
| Réclamation | QR + code `JBL-…` + expiration ~14 min | Non implémenté | Table `redemptions` + `POST /v1/staff/redemptions/validate` |
| Multi-boutiques | 3 emplacements Chez Mama ([admin-data.jsx](jubelee_design/admin/admin-data.jsx)) | 1 `tenant` = 1 boutique | **Post-MVP** ; pilot = un seul tenant |
| Paliers | Bronze → Platine + barre de progression | Colonne `tier` sans logique | Config paliers + recalcul simple post-MVP règles |
| Campagnes / carte / push / profil complet | Écrans Customer + Admin | Placeholders | **Post-MVP** |

---

## Principe directeur : ordre de validation
SuperAdmin → Tenant/Merchant Admin → Agent (Staff) → Client (PWA) → Loyalty Engine

Chaque couche est testable de bout en bout avant que la suivante soit construite. Aucune feature n'est livrée sans que son contexte parent soit fonctionnel.

**Boucle caisse prioritaire (design) :** enrôlement QR (flux 1) → scan Mon QR + attribution points (flux 2) → réclamation client + validation caisse (flux 3).

---

## Phase 1 — Infrastructure & SuperAdmin (Semaines 1–2)

**Objectif :** L'environnement tourne. Le superadmin peut créer un tenant, un merchant admin, et valider que l'isolation multi-tenant fonctionne.

**Critère de succès :** Se connecter en tant que superadmin, créer une boutique "Chez Mama", créer son admin, se connecter en tant que cet admin, voir son dashboard vide mais fonctionnel.

---

### Semaine 1 — Fondations techniques

**Backend (Go)**

- Initialisation du projet Go avec structure de dossiers (`/cmd`, `/internal/domain`, `/internal/api`, `/internal/infra`, `/pkg`)
- Configuration `go.mod`, routeur Gin, middleware de base
- Connexion PostgreSQL (Supabase) avec pool de connexions
- Schéma initial des tables :
  - `tenants` (id, name, slug, plan, active, conflict_policy, settings, created_at)
  - `users` (id, tenant_id nullable, email, password_hash, role, permissions, created_at)
  - `point_events` (append-only, structure complète dès le départ)
- Seed script : création du premier `superadmin` en base au démarrage si aucun n'existe
- Implémentation JWT : génération, validation, refresh token
- Middleware d'authentification global
- Middleware RBAC basique : vérification du rôle sur chaque route
- Tests unitaires : JWT, RBAC, validation des entrées

**Frontend (Next.js)**

- Application unifiée `apps/web` (admin `/store` + superadmin `/root` + staff `/agent` + client `/customer`) — alignée maquettes Jubelee Admin / Staff / Customer
- Configuration TanStack Query + BFF auth HttpOnly (`/api/v1/*`)
- Écran de login commun (email + password)
- Routing protégé par rôle (superadmin, merchant_admin, agent, client)
- Layout superadmin : sidebar, header, zone de contenu

**Infrastructure**

- Dépôts Git, branching strategy (main, develop, feature/*)
- GitHub Actions : lint + test + deploy sur push vers develop
- Déploiement Go sur Fly.io (instance free tier)
- Déploiement Next.js sur Vercel
- Variables d'environnement configurées (DATABASE_URL, JWT_SECRET, etc.)
- Base de données Supabase opérationnelle avec migrations versionnées (goose ou atlas)

---

### Semaine 2 — SuperAdmin : gestion des tenants et des merchant admins

**Backend (Go)**

- `POST /superadmin/tenants` — créer un tenant (name, slug, plan)
- `GET /superadmin/tenants` — liste avec pagination
- `GET /superadmin/tenants/:id` — détail d'un tenant
- `PATCH /superadmin/tenants/:id` — modifier (active, plan, settings)
- `POST /superadmin/tenants/:id/users` — créer un merchant_admin pour ce tenant
- `GET /superadmin/tenants/:id/users` — lister les utilisateurs d'un tenant
- Toutes ces routes protégées par le middleware `requireRole("superadmin")`
- Isolation multi-tenant : chaque requête non-superadmin injecte `tenant_id` depuis le JWT dans toutes les queries

**Frontend (Next.js — dashboard superadmin)**

- Page "Tenants" : tableau avec statut, plan, actions
- Modal "Créer tenant" : name, slug, plan (Starter/Growth/Business)
- Page "Détail tenant" : infos, liste des utilisateurs, bouton "Créer merchant admin"
- Modal "Créer merchant admin" : email, mot de passe temporaire
- Toast de confirmation + gestion des erreurs

**Tests de validation manuels**

- [ ] Se connecter en superadmin
- [ ] Créer le tenant "Chez Mama" avec slug `chez-mama`
- [ ] Créer l'utilisateur `admin@chezmama.cm` avec rôle `merchant_admin`
- [ ] Se déconnecter, se connecter en tant que `admin@chezmama.cm`
- [ ] Vérifier que cet admin ne voit que les données de son tenant
- [ ] Vérifier qu'il ne peut pas accéder aux routes `/superadmin/*`

**Documentation**

- Démarrage de la documentation API (Swagger/OpenAPI ou fichier Markdown)
- Modèle de données documenté

---

## Phase 2 — Tenant Admin : configuration complète (Semaines 3–4)

**Statut dépôt :** ✅ largement livré (settings, branding, QR, équipe, invitations, listes clients/transactions en lecture).

**Objectif :** Le merchant admin peut configurer son espace, ajouter ses agents, générer son QR d'enrôlement, et voir son tableau de bord. Aucun client ni règle configurable encore au moment du pilot — configuration opérationnelle du tenant.

**Critère de succès :** L'admin de "Chez Mama" configure son programme, crée deux agents, génère son QR, et l'un des agents peut se connecter à l'app agent.

**Écrans admin design ([Jubelee Admin.html](jubelee_design/Jubelee%20Admin.html)) — statut :**

| Page design | Route web | Backend |
|-------------|-----------|---------|
| Dashboard KPIs + feed + graphiques | `/store` | Métriques partielles (`GET /v1/store/metrics`) — KPIs/charts à compléter |
| Clients (tableau riche) | `/store/customers` | ✅ liste — enrichir visites / dépensé / dernière visite |
| Transactions (earn/redeem/bonus) | `/store/transactions` | ✅ events — filtres par type + agent |
| Équipe & agents | `/store/agents` | ✅ |
| QR d'enrôlement | `/store/enrollment-qr` | ✅ |
| Règles + paliers + simulateur | `/store/points-rules` | 📋 Phase 4 |
| Récompenses (catalogue) | `/store/rewards` | 📋 Phase 4 |
| Boutiques (multi-emplacements) | — | ⏸ post-MVP |
| Campagnes / Analytics / Abonnement | sidebar | ⏸ post-MVP (placeholders) |

---

### Semaine 3 — Configuration tenant et gestion des agents

**Backend (Go)**

- Modèle et table `enrollments` (id, customer_id, tenant_id, point_balance, tier, visit_count, enrolled_at)
- Modèle et table `rewards` (id, tenant_id, name, point_cost, min_tier, active, expires_at)
- API tenant admin (toutes protégées par `requireRole("merchant_admin")` + `injectTenantCtx`) :
  - `GET /tenant/me` — infos du tenant courant
  - `PATCH /tenant/me` — modifier les settings (nom affiché, logo_url, conflict_policy)
  - `POST /tenant/users` — créer un agent ou manager
  - `GET /tenant/users` — lister les agents/managers du tenant
  - `DELETE /tenant/users/:id` — désactiver un agent
  - `PATCH /tenant/users/:id/permissions` — modifier les permissions d'un utilisateur
- Génération du QR code d'enrôlement : `GET /tenant/qr` — retourne l'URL `jubilee.app/join/:slug` encodée en QR (PNG base64 ou SVG)
- Endpoint public : `GET /public/tenant/:slug` — retourne les infos publiques du tenant (nom, logo) pour la page d'accueil QR

**Frontend (Next.js — dashboard merchant admin)**

- Layout merchant admin avec sidebar : Dashboard, Clients, Agents, Récompenses, Règles, Paramètres
- Page "Paramètres" :
  - Informations générales (nom, description, logo)
  - Configuration de la politique de conflit de règles
  - Section "Mon QR Code" : affichage grand format, bouton télécharger PNG, bouton copier lien
- Page "Équipe" : tableau des agents/managers, bouton "Ajouter", modal de création, toggle actif/inactif
- Page "Dashboard" : squelette avec placeholders pour les KPIs (clients, points, transactions) — données vides pour l'instant

**Frontend (Next.js — app agent)**

- Écran de login agent
- Écran d'accueil agent : état "Aucune transaction" — fonctionnel mais vide

**Tests de validation manuels**

- [ ] Se connecter en merchant_admin `admin@chezmama.cm`
- [ ] Modifier le nom d'affichage et sauvegarder
- [ ] Créer l'agent `kofi@chezmama.cm`
- [ ] Créer le manager `sarah@chezmama.cm`
- [ ] Se déconnecter, se connecter en tant que `kofi@chezmama.cm`
- [ ] Vérifier que l'agent ne peut pas accéder aux paramètres
- [ ] Retourner en merchant_admin, générer et télécharger le QR code
- [ ] Ouvrir le lien QR dans un navigateur — vérifier que la page publique s'affiche

---

### Semaine 4 — Stabilisation & RBAC affiné

**Backend (Go)**

- Système de permissions granulaires :
  - `manage_rules` — créer/modifier/supprimer des règles
  - `manage_rewards` — gérer le catalogue de récompenses
  - `manage_staff` — gérer les agents et managers
  - `view_analytics` — voir les dashboards
  - `record_transaction` — enregistrer une transaction (agents)
  - `apply_reward` — valider une réclamation de récompense (agents)
  - `enroll_customer` — enrôler un client (agents)
- Middleware `requirePermission("record_transaction")` applicable sur chaque route concernée
- Révision complète de la gestion des erreurs : codes d'erreur structurés, messages localisés
- Tests d'intégration : isolation multi-tenant vérifiée (un tenant ne peut pas lire les données d'un autre)
- Rate limiting sur les routes publiques et d'authentification

**Frontend (Next.js)**

- Page "Paramètres > Rôles" : le merchant_admin peut créer des rôles personnalisés avec un subset de permissions
- Interface de permissions : checkboxes groupées par domaine métier (pas par verbe CRUD)
- Gestion des erreurs globale côté frontend : intercepteur axios/fetch, affichage des erreurs API

**Tests de validation manuels**

- [ ] Créer un rôle "Caissier senior" avec `record_transaction + apply_reward + enroll_customer`
- [ ] Assigner ce rôle à Kofi
- [ ] Vérifier que Kofi ne peut pas accéder à la gestion des règles
- [ ] Tenter un accès non autorisé — vérifier le 403
- [ ] Test d'isolation : créer un second tenant "PharmExpress", vérifier que ses données sont invisibles depuis "Chez Mama"

**Documentation**

- Mise à jour OpenAPI avec tous les endpoints des phases 1 et 2
- Documentation du système de permissions

---

## Phase 3 — Enrôlement client & transactions (Semaines 5–6)

**Statut dépôt :** 🚧 code livré, validation manuelle en cours ; écart design : scan Mon QR non branché sur l’API achat.

**Objectif :** Un vrai client peut s'enrôler via QR code ou via un agent, et une transaction peut être enregistrée. Les points sont crédités (règle fixe unique pour l'instant). Le client peut voir son wallet.

**Critère de succès :** Scanner le QR de "Chez Mama", s'enrôler, recevoir un SMS (ou OTP log en pilot), ouvrir le wallet, **Kofi scanne le Mon QR** du client, enregistre un achat, le client voit les points.

**Écrans client design ([Jubelee Customer.html](jubelee_design/Jubelee%20Customer.html)) — statut :**

| Écran | Route | Statut |
|-------|-------|--------|
| Auth / OTP / Rejoindre | `/join/[slug]` | ✅ |
| Wallet multi-enseignes | `/customer/wallet`, `/customer/stores` | ✅ |
| Wallet détail + barre palier | wallet detail design | 🚧 barre palier à brancher (tiers API) |
| Mon QR | `/customer/qr` | ✅ |
| Récompenses + code réclamation | `/customer/rewards` | 📋 demo UI — Phase 4 |
| Carte / fiche enseigne / inbox / push | design map & notifs | ⏸ post-MVP |

**Écrans staff design ([Jubelee Staff.html](jubelee_design/Jubelee%20Staff.html)) — statut :**

| Écran | Route | Statut |
|-------|-------|--------|
| Accueil + KPIs journée + feed | `/agent` | ✅ feed ; KPIs journée à étendre côté API |
| Scanner (Attribuer / Valider) | `/agent/scanner` | 🚧 Attribuer OK partiel ; **Valider** = Phase 4 |
| Numpad achat + succès solde | `/agent/purchase` | ✅ téléphone ; 📋 scan QR client |
| Clients / détail / nouveau | `/agent/customers/*` | ✅ |
| Activité 7 j | `/agent/activity` | ✅ |

---

### Semaine 5 — Enrôlement complet (tous les flux)

**Backend (Go)**

- Modèle et table `customers` (id, phone UK, name, birth_date, created_at)
- OTP : `POST /v1/public/otp/send` + `verify` — SMS Nexah en prod ; **pilot :** `PUBLIC_OTP_LOG_CODE` (codes dans les logs)
- Enrollment idempotent : `POST /v1/pwa/enrollments/scan` (QR boutique) — `loyalty_enrollments` ON CONFLICT
- Statuts customer : `PENDING` (créé par agent sans OTP) → `ACTIVE` (OTP vérifié) → `ENROLLED` (enrollment créé) → `TRANSACTING` (première transaction)
- `GET /customer/me/enrollments` — liste de tous les programmes rejoints
- `GET /customer/me/enrollments/:tenantId` — détail wallet pour un tenant
- Enrollment par agent : `POST /v1/staff/customers` — crée customer + enrollment + `customer_qr`
- `GET /public/tenant/:slug` — infos publiques pour la page de join

**Frontend (PWA client — jubilee-pwa)**

- Page `/join/:slug` — page d'accueil d'enrôlement :
  - Logo et nom du tenant
  - Saisie du numéro de téléphone
  - Vérification OTP (6 chiffres)
  - Champ nom optionnel
  - Redirect vers wallet après confirmation
- Wallet principal :
  - Carte de fidélité style physique (logo tenant en coin, solde de points, palier actuel)
  - Barre de progression vers le palier suivant
  - Raccourcis : Mon QR, Récompenses, Historique
- Écran QR Code : QR personnel grand format + numéro de téléphone

**Frontend (app agent — dashboard)**

- Page "Enrôler un client" :
  - Saisie numéro de téléphone
  - Affichage du profil si client connu (nom, palier dans d'autres enseignes)
  - Bouton "Enrôler ici" si pas encore membre
  - Confirmation visuelle

**Tests de validation manuels**

- [ ] Scanner le QR "Chez Mama" sur mobile
- [ ] Saisir un numéro, recevoir l'OTP, vérifier
- [ ] Voir le wallet vide (0 pts, palier Bronze)
- [ ] Scanner le même QR une deuxième fois — vérifier "Déjà membre"
- [ ] Kofi enrôle manuellement un second client via l'app agent
- [ ] Le second client reçoit un SMS d'activation
- [ ] Créer un second tenant "PharmExpress", scanner son QR avec le même téléphone — vérifier deux cartes dans le wallet

---

### Semaine 6 — Transactions & points (règle fixe MVP)

**Backend (Go)**

- Table `transactions` (id, enrollment_id, amount_fcfa, channel, pos_id, occurred_at)
- Table `point_events` complète (id, enrollment_id, transaction_id, rule_id nullable, event_type, delta, balance_after, metadata, created_at)
- Règle fixe MVP (hard-codée jusqu’à Phase 4) : actuellement `1 point / 500 FCFA` — **à aligner design : 1 pt / 100 FCFA** via règle seed en Phase 4
- `POST /v1/staff/purchases` — enregistre un achat, append `point_events` (type `purchase_award` → renommer `earn` pour l’admin design)
- **À livrer (design) :** corps `{ customer_qr | phone_e164, amount_fcfa }` — résolution client par token HMAC Mon QR
- Idempotency key sur les transactions (header `X-Idempotency-Key`) — évite les doubles crédits si réseau instable
- `GET /customer/me/enrollments/:tenantId/transactions` — historique des transactions
- `GET /customer/me/enrollments/:tenantId/events` — historique des points (gains/dépenses)
- Projection : `enrollment.point_balance` = sum des deltas depuis les events (recalculable à tout moment)

**Frontend (app agent — maquette Staff)**

- Flux **Attribuer** (design) :
  1. Scanner **Mon QR** client (mode « Attribuer ») — prioritaire sur la saisie téléphone
  2. Numpad montant FCFA + aperçu points (libellé règle dynamique post Phase 4)
  3. Écran succès : +pts, solde avant/après, palier (design `AwardSuccessScreen`)
- Flux **Valider** (design, Phase 4) : scanner QR réclamation → détail récompense + expiration → confirmation « code cramé »
- Mode offline partiel : transaction mise en queue si réseau absent, sync automatique au retour

**Frontend (PWA client)**

- Wallet mis à jour dynamiquement après transaction (polling ou WebSocket simple)
- Historique des transactions avec delta points (+120 pts, -200 pts)
- Animation de crédit de points

**Frontend (dashboard merchant admin)**

- Page "Dashboard" maintenant active :
  - Nombre de clients actifs
  - Total de points distribués
  - Nombre de transactions (30 derniers jours)
  - Graphique des transactions par jour (barres simples)

**Tests de validation manuels**

- [ ] Kofi scanne le Mon QR d’Ama (ou téléphone), enregistre 4500 FCFA → points selon règle active (ex. +45 pts à 100 FCFA/pt)
- [ ] Ama ouvre son wallet, voit le solde mis à jour et la transaction dans l'historique
- [ ] L'admin voit la transaction dans son dashboard
- [ ] Couper le réseau de l'app agent, enregistrer une transaction offline, rétablir — vérifier la sync
- [ ] Vérifier que les events sont bien append-only (pas de UPDATE sur point_events)

---

## Phase 4 — Loyalty Engine, récompenses & lancement (Semaines 7–8)

**Statut dépôt :** 📋 non démarré (placeholders UI `/store/points-rules`, `/store/rewards`, récompenses client en demo).

**Objectif :** Remplacer la règle fixe par le Rule Engine configurable (schéma aligné `admin-simulator.jsx`). Activer le catalogue récompenses et le cycle réclamation/validation. Audit sécurité. Déploiement pilote free tier.

**Critère de succès :** L'admin crée une règle "Happy hour ×2" ou "double points week-end", la teste via le simulateur (onglet design), crée « Café offert », un client réclame (QR + code JBL + expiration), Kofi valide en caisse.

---

### Semaine 7 — Rule Engine & récompenses

**Backend (Go)**

- Tables `rules` (id, tenant_id, name, priority, active, trigger, condition_tree JSONB, actions JSONB, stop_on_match, created_at)
- Tables `redemptions` (id, enrollment_id, reward_id, points_spent, status, claimed_at)
- Rule Engine (schéma prototype `SIM_RULES` dans [admin-simulator.jsx](jubelee_design/admin/admin-simulator.jsx)) :
  - **Triggers :** `transaction`, `enroll` (`birthday` post-MVP)
  - **Actions :** `rate` (per/pts), `mult` (factor), `flat` (bonus pts)
  - **Conditions :** jours, heures, palier, montant min, client nouveau
  - Ordre d’évaluation : rate → flat → mult ; **détection conflits** (multiplicateurs cumulables) comme dans la maquette
  - Politique tenant `conflict_policy` ; events `ConflictResolved` dans `point_events`
- **Pilot :** pas de cache Redis — lecture Postgres suffisante
- `POST /v1/staff/purchases` via le moteur (remplace hard-code)
- API récompenses (alignées [admin-rewards.jsx](jubelee_design/admin/admin-rewards.jsx)) :
  - `GET/POST/PATCH /v1/store/rewards` — `point_cost`, `min_tier`, `active`, `stock_limit`, stats `claimed_count`
  - `GET /v1/pwa/rewards` — catalogue côté client
  - `POST /v1/pwa/rewards/:id/claim` — débit atomique, `claim_qr` HMAC, `display_code` (ex. JBL-4F7K-29), `expires_at` (~15 min)
  - `POST /v1/staff/redemptions/validate` — scan claim QR, statut `burned`, event `redeem`
- Simulateur : `POST /v1/store/rules/simulate` — trace comme l’UI design
- Paliers : `GET/POST /v1/store/tiers` ou config dans tenant settings — Bronze/Argent/Or/Platine ([admin-rules.jsx](jubelee_design/admin/admin-rules.jsx))

**Frontend (dashboard merchant admin — maquette Admin)**

- **Pilot UI :** formulaires + liste + simulateur (pas l’éditeur visuel drag-and-drop [admin-rulebuilder.jsx](jubelee_design/admin/admin-rulebuilder.jsx) — réservé plan Growth / post-MVP)
- Page Règles : onglets **Règles d’attribution** / **Paliers** / **Simulation & conflits** (comme design)
- Page Récompenses : grille cartes, coût pts, palier min, stock, compteur utilisations, aperçu client
- Dashboard : 4 KPIs design (points distribués, clients actifs, récompenses validées, rétention) + feed agents + graphique hebdo

**Frontend (PWA client)**

- Page "Récompenses" : catalogue avec points requis, bouton "Réclamer", QR de réclamation
- Notification push PWA à la réception de points

**Frontend (app agent)**

- Écran "Valider récompense" : scanner le QR de réclamation du client, affichage des détails, confirmation

**Tests de validation manuels**

- [ ] Créer la règle "Double points weekend" (montant ≥ 2000 FCFA, samedi ou dimanche, ×2)
- [ ] Simuler une transaction de 3500 FCFA un samedi — vérifier que la règle se déclenche
- [ ] Simuler la même transaction un lundi — vérifier qu'elle ne se déclenche pas
- [ ] Créer la récompense "Café offert" (design : 1 500 pts — ajuster selon seed pilot)
- [ ] Un client avec 210 pts réclame la récompense — recevoir le QR
- [ ] Kofi scanne le QR de réclamation — vérifier la déduction des points et le statut "burned"
- [ ] Tenter de re-scanner le même QR — vérifier le rejet

---

### Semaine 8 — Audit, préparation lancement & pilote

**Sécurité**

- Audit OWASP Top 10 : injection SQL, XSS, CSRF, exposition de données sensibles, authentification
- Vérification que les tokens OTP expirent correctement (5 min, max 3 tentatives)
- Headers de sécurité HTTP (HSTS, CSP, X-Frame-Options)
- Revue des logs : aucun secret ni donnée PII dans les logs
- Test de pénétration basique : tentative d'accès cross-tenant

**Performance**

- Index PostgreSQL vérifiés :
  - `enrollments(customer_id, tenant_id)` — unique
  - `point_events(enrollment_id, created_at)` — pour les projections
  - `transactions(enrollment_id, occurred_at)` — pour l'historique
  - `rules(tenant_id, active, priority)` — pour le Rule Engine
- Test de charge léger : 50 transactions simultanées, vérifier la cohérence des balances
- Optimisation des requêtes N+1 identifiées lors des tests

**Documentation**

- Guide d'onboarding commerçant (PDF ou Notion) : créer son programme, ajouter ses agents, configurer une règle, définir une récompense
- Guide agent : enrôler un client, enregistrer une transaction, valider une récompense
- Guide client : rejoindre, voir ses points, réclamer

**Déploiement (pilot = production unique, free tiers)**

- **DB :** Supabase PostgreSQL (pooler SSL pour Fly)
- **API :** Fly.io — `Dockerfile` prod, `fly.toml`, health check
- **Web :** Vercel Hobby — `apps/web` (les 3 portails)
- **OTP pilot :** `PUBLIC_OTP_LOG_CODE=true` (pas Nexah tant que pilot fermé)
- **Fichiers :** volume Fly ou Cloudflare R2 pour logos
- Migrations versionnées ; rollback = redeploy release Fly
- Monitoring : Sentry optionnel post-pilot

**Lancement pilote (fin semaine 8)**

- Accès accordé aux commerçants pilotes (Chez Mama, + 1 ou 2 autres)
- Canal support dédié (groupe WhatsApp ou Telegram)
- Collecte de feedback structurée : formulaire post-utilisation hebdomadaire
- KPIs suivis dès J1 :
  - Nombre de tenants actifs
  - Nombre de clients enrôlés
  - Nombre de transactions enregistrées
  - Taux d'activation client (PENDING → TRANSACTING)
  - Nombre de récompenses réclamées et validées

---

## Récapitulatif des livrables par semaine

| Semaine | Qui peut tester | Ce qui est validé |
|---------|----------------|-------------------|
| 1 | SuperAdmin | Login, création tenant, création merchant admin |
| 2 | SuperAdmin + Merchant Admin | Isolation tenant, accès limité par rôle |
| 3 | Merchant Admin | Configuration tenant, gestion agents, QR généré |
| 4 | Merchant Admin + Agent | Permissions granulaires, login agent, isolation vérifiée |
| 5 | Agent + Client | Enrôlement QR, enrôlement par agent, wallet vide |
| 6 | Agent + Client + Merchant Admin | Transactions, points crédités, historique, dashboard |
| 7 | Tous | Règles configurables, récompenses, réclamation validée |
| 8 | Pilotes réels | MVP complet en production |

---

## Notes d'implémentation critiques

**Idempotence** — Trois endpoints doivent être strictement idempotents :
- `POST /enroll/:tenantSlug` — `ON CONFLICT (customer_id, tenant_id) DO NOTHING`
- `POST /agent/transactions` — clé d'idempotence via header `X-Idempotency-Key`
- `POST /customer/rewards/:rewardId/claim` — vérification du solde en transaction PostgreSQL atomique

**Event sourcing scope** — Uniquement sur la table `point_events`. Tout le reste (profils, règles, config) est du CRUD classique. Ne pas sur-ingénierer.

**Ordre de création des données** — Tenant → User (merchant_admin) → Rules + Rewards → Customer → Enrollment → Transaction → PointEvent. Respecter cet ordre dans les seeds de test et dans les scripts d'onboarding.

**Flag self_serve** — Ajouter `tenants.self_serve BOOLEAN DEFAULT false` dès la semaine 1. En MVP, tous les tenants sont créés par le superadmin. En phase 3 (post-MVP), basculer ce flag à `true` pour ouvrir le register public sans refactoring.

**Préfixe API réel** — Toutes les routes ci-dessus sont exposées sous `/v1/` (ex. `/v1/store/*`, `/v1/staff/*`, `/v1/pwa/*`, `/v1/superadmin/*`). Les chemins historiques `/tenant/*`, `/agent/*` du document initial correspondent au domaine métier, pas aux URLs.

**Hors scope MVP (présent dans les maquettes, pas dans le pilot)** — Multi-boutiques par enseigne, campagnes marketing, analytics 30j, abonnements Standard/Growth/Scale, carte découverte géolocalisée, inbox notifications push, profil client (genre, date de naissance), éditeur de règles visuel complet, mode offline agent.