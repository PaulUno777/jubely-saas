# Document de Cadrage Projet : Jubely

**Date :** 27 Avril 2026
**Version :** 1.1 — alignée maquettes `context/jubelee_design/` (Mai 2026)

## 0. Maquettes & architecture produit (référence UX)

Le périmètre fonctionnel du MVP est illustré par trois portails interactifs et un schéma de flux :

| Portail | Fichier | Rôle |
|---------|---------|------|
| Client (PWA) | [jubelee_design/Jubelee Customer.html](jubelee_design/Jubelee%20Customer.html) | Wallet multi-enseignes, Mon QR, récompenses, rejoindre une boutique |
| Personnel caisse | [jubelee_design/Jubelee Staff.html](jubelee_design/Jubelee%20Staff.html) | Scanner Attribuer/Valider, numpad achat, clients, activité |
| Admin boutique | [jubelee_design/Jubelee Admin.html](jubelee_design/Jubelee%20Admin.html) | Dashboard, clients, transactions, règles, récompenses, équipe, QR |
| Flux | [Jubelee_Architecture.png](Jubelee_Architecture.png) | 9 flux (QR enrôlement → scan caisse → config → analytics) |

**Implémentation cible :** une application Next.js unique (`apps/web`) + API Go (`/v1/store`, `/v1/staff`, `/v1/pwa`). Plan détaillé : [NEW_PLANING.md](NEW_PLANING.md) · suivi : [docs/ROADMAP.md](../docs/ROADMAP.md).

---

## 1. Vision du Produit

- **Problème résolu :** Les PME commerciales en Afrique (ex: boutiques d'équipement électronique, restaurants, salons de coiffure) luttent pour fidéliser leurs clients et les faire revenir efficacement. Leurs méthodes actuelles (principalement les groupes WhatsApp génériques) sont perçues comme inefficaces, agaçantes et manquent de structure pour récompenser la fidélité, comprendre les comportements d'achat et personnaliser les interactions, ce qui limite leur valeur vie client (LTV) et leur chiffre d'affaires.

- **Solution proposée (Jubely) :** Une plateforme de fidélisation client digitalisée et modulaire : **PWA client** (wallet, Mon QR, récompenses), **app personnel** (scan caisse, attribution de points, validation des réclamations), **back-office admin** (règles, catalogue, KPIs, équipe). Les maquettes Staff/Admin/Customer définissent l’expérience cible ; le MVP livre d’abord la boucle caisse (scan QR → points → réclamation → validation), puis l’enrichissement (campagnes, multi-boutiques, push).

- **Mission :** Démocratiser l'accès à des outils de fidélisation client digitalisée de qualité professionnelle pour les PME africaines, leur permettant de construire des relations durables avec leurs clients et d'augmenter significativement leur chiffre d'affaires, avec la même sophistication que les grands groupes mais une simplicité et un coût adaptés.

- **Valeur Unique (pour le commerçant) :** Jubely offre une solution de fidélisation puissante, intuitive et abordable, spécifiquement conçue pour le contexte africain. Elle se distingue par une architecture technique optimisée pour les contraintes de coût et de latence (Go backend, PWA client), un modèle économique flexible (freemium + abonnements), et une interface d'administration simplifiée basée sur des permissions abstraites, rendant la gestion de la fidélité accessible même aux non-experts.

- **Segment Client Cible Initial :** Propriétaires/gérants de petites et moyennes entreprises commerciales (boutiques d'équipement électronique, cafés, restaurants, bars, snacks, salons de coiffure/esthétique) dans les zones urbaines du Cameroun, souffrant de l'inefficacité des méthodes de fidélisation actuelles.

## 2. Architecture & Choix Techniques Structurants

- **Backend :**
    - **Technologie :** Go.
    - **Justification :** Faible consommation de RAM (5-15 Mo au repos), garantissant une meilleure performance, une latence réduite et une efficacité accrue sur des infrastructures à bas coût (free tiers type Fly.io, Railway), facteurs critiques pour la rentabilité et l'expérience utilisateur en Afrique.

- **Base de données (CRUD) :** PostgreSQL.
    - **Justification :** Cohérence forte (ACID) essentielle pour les données sensibles (clients, transactions, règles de fidélité). Robustesse, maturité et flexibilité.
    - **Hébergement DB :** Free tier de Supabase (pour démarrer).
    - **Justification :** Offre généreuse (500MB DB), facilité de gestion, transition fluide vers les paliers payants.

- **Moteur de Points (Event Sourcing) :**
    - **Technologie :** Implémenté en Go, stockant les événements dans une table dédiée de la base de données PostgreSQL.
    - **Justification :** Permet une robustesse et une auditabilité inégalées. Les soldes de points peuvent être recalculés à tout moment à partir des événements bruts, offrant une flexibilité cruciale pour l'évolution des règles de fidélité sans corruption de données. Évite la sur-ingénierie en n'appliquant cette complexité qu'au cœur du système.

- **Frontend :**
    - **Technologie :** Next.js 16 (monorepo `apps/web` — portails client `/customer`, staff `/agent`, admin `/store`, superadmin `/root`).
    - **Justification :** Une seule base de code alignée sur les trois maquettes HTML ; PWA installable (`display: standalone`) ; BFF Next pour cookies HttpOnly vers l’API Go.

- **Infrastructure de déploiement :**
    - **Cible :** Plateformes cloud optimisées pour free tier / bas coût (Fly.io, Railway pour le backend ; Vercel, Netlify pour le frontend statique/PWA).
    - **Justification :** Maîtrise des coûts opérationnels, essentielle pour atteindre la rentabilité sur un marché où l'ARPU (Revenu Moyen par Utilisateur) est intrinsèquement plus bas.

## 3. Fonctionnalités Clés & Portée du Produit

**Objectif Général :** Fournir un système de fidélisation complet et évolutif, commençant par un MVP ciblé.

### 3.1. Jubely Essentiel (MVP - Freemium)

- **Cible :** Petites entreprises sans solution de fidélité ou utilisant des méthodes inefficaces (WhatsApp).

- **Fonctionnalités (alignées maquettes — périmètre pilot) :**

    1.  **Enrôlement client**
        - Client : `/join/:slug` — OTP téléphone, nom, carte wallet (design *Rejoindre · sheet*).
        - Personnel : création client + affichage **Mon QR** (design *Nouveau client*).
        - Admin : QR d’enrôlement boutique (`jubelee.app/join/chez-mama`).

    2.  **Attribution de points (flux caisse — design Staff)**
        - Mode scanner **Attribuer** : scan du **Mon QR** client (token HMAC), pas seulement le téléphone.
        - Saisie montant FCFA (numpad), aperçu points, écran succès avec solde avant/après et palier.
        - Règle par défaut type maquette : **1 point par 100 FCFA** (configurable via moteur de règles dès Phase 4).

    3.  **Expérience client PWA (design Customer)**
        - Wallet **multi-enseignes** (plusieurs cartes si plusieurs tenants rejoints).
        - Détail par enseigne : solde, palier, barre de progression.
        - **Mon QR** personnel pour la caisse.
        - Catalogue **récompenses** par enseigne ; bouton Réclamer.

    4.  **Réclamation & validation (flux 3 architecture)**
        - Client : QR de réclamation + code lisible (ex. `JBL-4F7K-29`) + **expiration ~15 min** (design *Réclamer · code*).
        - Personnel : mode scanner **Valider**, détail récompense, confirmation — code **cramé**, points débités (`event_type: redeem`).

    5.  **Back-office admin (design Admin — pilot)**
        - Dashboard : KPIs (points distribués, clients actifs, récompenses validées), feed activité agents.
        - Clients & transactions (filtres gain / récompense / bonus).
        - Équipe & agents, QR enrôlement, paramètres boutique.
        - Règles : liste, paliers, **simulateur & détection de conflits** (UI formulaire en pilot ; éditeur visuel drag-and-drop = plan Growth).
        - Catalogue récompenses : coût en points, palier minimum, actif/pause, compteur d’utilisations.

- **Hors MVP Essentiel (visible dans les maquettes, livraison ultérieure) :** multi-boutiques (3 emplacements Chez Mama), campagnes push, carte découverte géolocalisée, inbox notifications, profil client complet (genre, date de naissance), abonnements Standard/Growth/Scale avec feature gating, intégration POS.

- **Limites du plan Essentiel** (inchangées pour la monétisation) : nombre de clients plafonné, règles et récompenses limitées en nombre, pas de segmentation ni campagnes ciblées, rapports basiques.

### 3.2. Jubely Pro (Abonnement Mensuel)

- **Cible :** PME en croissance cherchant plus d'efficacité, de contrôle et de personnalisation.

- **Fonctionnalités (en plus de l'Essentiel) :**
    - Nombre de clients illimité (ou très élevé, ex: 10 000+).
    - Gestion avancée des règles : Multiples règles de cumul de points (par produit, catégorie, montant, fréquence).
    - Récompenses personnalisables : Création de plusieurs types de récompenses (réductions variables, produits/services spécifiques, bons d'achat).
    - Segmentation Client : Possibilité de créer des segments de clients (fidèles, à risque, gros acheteurs) pour des actions ciblées.
    - Communications Ciblées : Envoi de notifications push et SMS (avec quotas inclus ou facturation à l'usage) en fonction des segments ou du comportement d'achat.
    - Tableaux de Bord Avancés : Rapports détaillés (LTV, fréquence d'achat, panier moyen, performance des promotions).
    - Modules "Tertiarisation" : Gamification simple, parrainage basique.
    - Branding Personnalisable : Personnalisation du logo et des couleurs de base de l'application client.
    - Support par email réactif.

### 3.3. Jubely Premium (Abonnement Mensuel Plus Élevé / Sur Devis)

- **Cible :** PME avec plusieurs points de vente (chaînes, franchises) ou des besoins d'intégration/support spécifiques (ex: centres commerciaux).

- **Fonctionnalités (en plus du Pro) :**
    - **Gestion multi-points de vente** (maquette Admin *Boutiques* — 3 emplacements, filtres par site, KPIs par boutique) : administration centralisée et rapports consolidés.
    - Intégration API : Possibilité d'intégration avec des systèmes de Point de Vente (POS) existants (selon faisabilité).
    - Modules Avancés : Programme de parrainage sophistiqué, gestion des bons d'achat avancée, intégration e-commerce.
    - Analyse prédictive de la fidélité.
    - Support téléphonique dédié et accompagnement personnalisé.
    - Rapports et analyses sur mesure.
    - Campagnes marketing automatisées et déclenchées par événements (ex: anniversaire client avec offre).
    - Accès à des formations et ateliers dédiés.
    - Branding et personnalisation plus poussés.

## 4. Modèle Économique & Pricing

- **Génération de Revenus :** Principalement par abonnement SaaS mensuel, complété par des revenus additionnels à l'usage ou des services.

- **Pricing (en FCFA, hors taxes) :**
    - **Jubely Essentiel :** Gratuit.
    - **Jubely Pro :** 5 000 FCFA à 15 000 FCFA / mois (~15-25 EUR).
    - **Jubely Premium :** 20 000 FCFA à 50 000 FCFA / mois (~30-75 EUR), ou sur devis pour les très grands comptes.

- **Revenus Additionnels :**
    - **SMS Marketing :** Facturation au-delà d'un quota inclus dans les paliers payants, ou à l'unité (pour les paliers Pro et Premium).
    - **Services de Setup / Onboarding :** Coût ponctuel pour l'accompagnement initial, la migration de données, les formations spécifiques, ou des développements sur mesure pour les clients Premium/Enterprise.

- **Coût d'Acquisition Client (CAC) :**
    - **Stratégie initiale :** Compter sur l'effet viral du freemium, le bouche-à-oreille et une stratégie de contenu ciblée.
    - **Stratégie d'évolution :** Partenariats avec des associations de commerçants, marketing digital ciblé (Facebook/Instagram Ads), puis éventuellement vente directe pour les paliers supérieurs.

- **Valeur Vie Client (LTV) :** LTV > 3x CAC sera l'objectif pour assurer la rentabilité à long terme. La LTV sera fortement influencée par le taux de rétention et la conversion des clients freemium vers les plans payants.

## 5. Roadmap Initiale (MVP Essentiel - 8 Semaines)

*Alignée sur [NEW_PLANING.md](NEW_PLANING.md) et les maquettes `jubelee_design/`. L’état d’avancement détaillé est dans [docs/ROADMAP.md](../docs/ROADMAP.md).*

- **Sprint 1 : Semaines 1-2 — Infrastructure & SuperAdmin** ✅ *largement livré*
    - Go + Postgres (Supabase) + JWT + RBAC + superadmin/tenants.
    - Next.js unifié, login par rôle, BFF cookies.
    - CI lint/test ; **déploiement pilot** : Fly.io (API) + Vercel (web) + Supabase.

- **Sprint 2 : Semaines 3-4 — Configuration boutique & personnel** ✅ *largement livré*
    - Admin : paramètres, branding, QR enrôlement, équipe (invitations).
    - Staff : login, accueil, liste clients, création client.
    - *Écart design :* dashboard admin KPIs/charts encore partiels.

- **Sprint 3 : Semaines 5-6 — Enrôlement & transactions** 🚧 *code livré, validation en cours*
    - PWA : `/join/:slug`, wallet, Mon QR, multi-enseignes.
    - Staff : achat par téléphone + numpad ; **à finaliser :** scan Mon QR → API.
    - `point_events` append-only ; métriques boutique de base.
    - OTP : logs en dev/pilot ; Nexah en production publique.

- **Sprint 4 : Semaines 7-8 — Règles, récompenses, pilote** 📋 *à livrer*
    - Moteur de règles (schéma `SIM_RULES` : rate / mult / flat, simulateur, conflits).
    - Catalogue récompenses + claim QR + validation staff (flux design complet).
    - Admin : écrans Règles / Récompenses / Transactions typées earn|redeem|bonus.
    - Sécurité minimale, déploiement production free tier, pilotes (ex. Chez Mama).

**Critère de bout en bout (aligné architecture) :** Admin publie QR → client s’enrôle → staff scanne Mon QR et crédite points → client réclame une récompense → staff valide le QR réclamation → admin voit KPIs et historique.

## 6. KPIs Clés (Produit & Business)

*Ces métriques seront essentielles pour évaluer le succès du MVP et orienter les évolutions futures.*

- **Acquisition/Activation Commerçants : Taux d'activation des commerçants.**
    - **Définition :** Pourcentage de commerçants inscrits sur le plan "Essentiel" qui ont enregistré au moins 10 clients et attribué des points lors d'au moins 3 transactions différentes au cours des 7 premiers jours suivant leur inscription.
    - **Objectif :** Valider l'attrait initial de la solution et la facilité d'onboarding.

- **Rétention Client Final : Taux de retour des clients finaux.**
    - **Définition :** Pourcentage des clients finaux (ceux des commerçants) ayant reçu des points via Jubely qui effectuent un deuxième (ou N-ième) achat dans la boutique dans un délai de 30 jours, comparé à leur fréquence d'achat historique ou à un groupe de contrôle.
    - **Objectif :** Mesurer l'impact direct de Jubely sur la fidélisation et la récurrence des achats, la valeur clé pour le commerçant.

- **Monétisation : Taux de conversion Freemium -> Pro.**
    - **Définition :** Pourcentage de commerçants actifs du palier "Essentiel" (selon la métrique d'activation) qui souscrivent à l'abonnement "Pro" au bout de 1 à 3 mois.
    - **Objectif :** Valider la viabilité du modèle économique et la valeur perçue des fonctionnalités des plans payants.
    - **Principale motivation de conversion :** Le besoin de flexibilité, de personnalisation accrue des programmes de fidélité, et l'accès à des données client plus approfondies pour booster davantage les ventes et se différencier plus efficacement (dès que les limites du plan gratuit sont atteintes).

---

## 7. Correspondance plans commerciaux ↔ maquettes Admin

Les plans **Standard / Growth / Scale** de la maquette ([admin-data.jsx](jubelee_design/admin/admin-data.jsx)) conditionnent l’UI (éditeur visuel, multi-boutiques, campagnes). En **MVP pilot**, toutes les boutiques sont traitées comme **plan unique** sans enforcement backend ; seules les fonctionnalités de la section 3.1 sont requises.

---

Ce document de cadrage constitue la vision produit ; le détail d’implémentation semaine par semaine et les écarts code/design sont maintenus dans [NEW_PLANING.md](NEW_PLANING.md).