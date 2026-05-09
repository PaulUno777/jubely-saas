# Planification Détaillée du Projet Jubilee
**Objectif :** MVP robuste en 8 semaines, avec un ordre de développement permettant de tester chaque couche avant de construire la suivante — du superadmin vers le client final.

---

## Principe directeur : ordre de validation
SuperAdmin → Tenant/Merchant Admin → Agent → Client → Loyalty Engine

Chaque couche est testable de bout en bout avant que la suivante soit construite. Aucune feature n'est livrée sans que son contexte parent soit fonctionnel.

---

## Phase 1 — Infrastructure & SuperAdmin (Semaines 1–2)

**Objectif :** L'environnement tourne. Le superadmin peut créer un tenant, un merchant admin, et valider que l'isolation multi-tenant fonctionne.

**Critère de succès :** Se connecter en tant que superadmin, créer une boutique "Chez Mama", créer son admin, se connecter en tant que cet admin, voir son dashboard vide mais fonctionnel.

---

### Semaine 1 — Fondations techniques

**Backend (Go)**

- Initialisation du projet Go avec structure de dossiers (`/cmd`, `/internal/domain`, `/internal/api`, `/internal/infra`, `/pkg`)
- Configuration `go.mod`, routeur Fiber, middleware de base
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

- Initialisation des deux projets : `jubilee-web` (dashboard/admin) et `jubilee-pwa` (client)
- Configuration Zustand + TanStack Query
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

**Objectif :** Le merchant admin peut configurer son espace, ajouter ses agents, générer son QR d'enrôlement, et voir son tableau de bord. Aucun client ni règle encore — juste la configuration complète du tenant.

**Critère de succès :** L'admin de "Chez Mama" configure son programme, crée deux agents, génère son QR, et l'un des agents peut se connecter à l'app agent.

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

**Objectif :** Un vrai client peut s'enrôler via QR code ou via un agent, et une transaction peut être enregistrée. Les points sont crédités (règle fixe unique pour l'instant). Le client peut voir son wallet.

**Critère de succès :** Scanner le QR de "Chez Mama", s'enrôler, recevoir un SMS, ouvrir le wallet, faire enregistrer une transaction par Kofi, voir les points apparaître.

---

### Semaine 5 — Enrôlement complet (tous les flux)

**Backend (Go)**

- Modèle et table `customers` (id, phone UK, name, birth_date, created_at)
- OTP : `POST /auth/otp/send` (phone) — envoi SMS via Nexah
- OTP : `POST /auth/otp/verify` (phone, code) — vérification, création customer si inexistant, retourne JWT
- Enrollment idempotent : `POST /enroll/:tenantSlug` — `INSERT INTO enrollments ... ON CONFLICT (customer_id, tenant_id) DO NOTHING RETURNING *`
- Statuts customer : `PENDING` (créé par agent sans OTP) → `ACTIVE` (OTP vérifié) → `ENROLLED` (enrollment créé) → `TRANSACTING` (première transaction)
- `GET /customer/me/enrollments` — liste de tous les programmes rejoints
- `GET /customer/me/enrollments/:tenantId` — détail wallet pour un tenant
- Enrollment par agent : `POST /agent/customers/enroll` — crée customer (PENDING) + enrollment, envoie SMS d'activation
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
- Règle fixe MVP (hard-codée, sans Rule Engine complet) : `1 point par tranche de 500 FCFA`
- `POST /agent/transactions` — enregistre une transaction, calcule les points, appende les events, met à jour `enrollment.point_balance`
- Idempotency key sur les transactions (header `X-Idempotency-Key`) — évite les doubles crédits si réseau instable
- `GET /customer/me/enrollments/:tenantId/transactions` — historique des transactions
- `GET /customer/me/enrollments/:tenantId/events` — historique des points (gains/dépenses)
- Projection : `enrollment.point_balance` = sum des deltas depuis les events (recalculable à tout moment)

**Frontend (app agent)**

- Flux de transaction en 3 étapes :
  1. Identification client (saisie téléphone ou scan QR)
  2. Saisie montant + aperçu des points à attribuer
  3. Confirmation avec récapitulatif (points gagnés, nouveau solde)
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

- [ ] Kofi identifie Ama par son numéro, enregistre 4500 FCFA → voir +9 pts crédités
- [ ] Ama ouvre son wallet, voit le solde mis à jour et la transaction dans l'historique
- [ ] L'admin voit la transaction dans son dashboard
- [ ] Couper le réseau de l'app agent, enregistrer une transaction offline, rétablir — vérifier la sync
- [ ] Vérifier que les events sont bien append-only (pas de UPDATE sur point_events)

---

## Phase 4 — Loyalty Engine, récompenses & lancement (Semaines 7–8)

**Objectif :** Remplacer la règle fixe par le Rule Engine configurable. Activer les récompenses. Audit sécurité. Déploiement pilote.

**Critère de succès :** L'admin crée une règle "double points le weekend", la teste via le simulateur, crée une récompense "Café offert", un client réclame et un agent valide.

---

### Semaine 7 — Rule Engine & récompenses

**Backend (Go)**

- Tables `rules` (id, tenant_id, name, priority, active, trigger, condition_tree JSONB, actions JSONB, stop_on_match, created_at)
- Tables `redemptions` (id, enrollment_id, reward_id, points_spent, status, claimed_at)
- Rule Engine complet :
  - `EvaluationContext` : construit depuis transaction + enrollment + customer
  - `ConditionEvaluator` : arbre AND/OR récursif depuis `condition_tree` JSONB
  - `ActionDispatcher` : `MultiplyPoints`, `BonusFixed`, `UnlockReward`, `Notify`
  - Politique de conflit : `HIGHEST_WINS` par défaut (configurable par tenant)
  - Chaque conflit tracé comme event `ConflictResolved` dans `point_events`
- Cache Redis des règles actives (TTL 60s) via Upstash
- `POST /agent/transactions` mis à jour pour passer par le Rule Engine (remplace la règle fixe)
- API récompenses :
  - `POST /tenant/rewards` — créer une récompense
  - `GET /tenant/rewards` — liste
  - `PATCH /tenant/rewards/:id` — modifier
  - `POST /customer/rewards/:rewardId/claim` — réclamer (vérifie points, génère QR à usage unique)
  - `POST /agent/redemptions/validate` — scanner le QR de réclamation, déduire les points, brûler le QR
- Simulateur de règle : `POST /tenant/rules/simulate` — prend une transaction fictive, retourne le résultat d'évaluation avec trace des conditions

**Frontend (dashboard merchant admin)**

- Page "Règles de fidélité" — Rule Builder complet :
  - Palette de blocs (déclencheurs, conditions, actions) glisser-déposer
  - Connecteurs logiques ET/OR entre conditions
  - Traduction en langage naturel en temps réel
  - Simulateur de test intégré
  - Bibliothèque de templates (double points weekend, bonus 1ère visite, etc.)
  - Affichage JSON généré (optionnel, pour les curieux)
- Page "Récompenses" — CRUD complet avec aperçu client
- Page "Règles actives" — liste ordonnée par priorité, toggle on/off, compteur de déclenchements

**Frontend (PWA client)**

- Page "Récompenses" : catalogue avec points requis, bouton "Réclamer", QR de réclamation
- Notification push PWA à la réception de points

**Frontend (app agent)**

- Écran "Valider récompense" : scanner le QR de réclamation du client, affichage des détails, confirmation

**Tests de validation manuels**

- [ ] Créer la règle "Double points weekend" (montant ≥ 2000 FCFA, samedi ou dimanche, ×2)
- [ ] Simuler une transaction de 3500 FCFA un samedi — vérifier que la règle se déclenche
- [ ] Simuler la même transaction un lundi — vérifier qu'elle ne se déclenche pas
- [ ] Créer la récompense "Café offert" à 200 pts
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

**Déploiement**

- Variables d'environnement de production distinctes de staging
- Migrations de base de données versionnées et testées en staging avant prod
- Procédure de rollback documentée
- Monitoring : Sentry pour les erreurs, logs structurés, alertes sur taux d'erreur > 1%

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