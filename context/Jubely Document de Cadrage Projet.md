# Document de Cadrage Projet : Jubely

**Date :** 27 Avril 2026
**Version :** 1.0

## 1. Vision du Produit

- **Problème résolu :** Les PME commerciales en Afrique (ex: boutiques d'équipement électronique, restaurants, salons de coiffure) luttent pour fidéliser leurs clients et les faire revenir efficacement. Leurs méthodes actuelles (principalement les groupes WhatsApp génériques) sont perçues comme inefficaces, agaçantes et manquent de structure pour récompenser la fidélité, comprendre les comportements d'achat et personnaliser les interactions, ce qui limite leur valeur vie client (LTV) et leur chiffre d'affaires.

- **Solution proposée (Jubely) :** Une plateforme de fidélisation client digitalisée et modulaire, composée d'une Progressive Web App (PWA) pour les clients finaux, et d'applications métier (web/mobile) pour le personnel des commerçants et les administrateurs. Jubely remplace les communications génériques et inefficaces par des récompenses structurées (système de points), des offres personnalisées et des notifications ciblées, facilitant le retour en magasin et une connaissance client approfondie.

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
    - **Technologie :** React ou Next.js (pour les applications web/PWA).
    - **Justification :** Modernité, performance, capacité à créer des Progressive Web Apps (PWA) pour une distribution facile et une expérience mobile native sans passer par les stores d'applications au démarrage, et des interfaces web réactives pour le personnel/admin.

- **Infrastructure de déploiement :**
    - **Cible :** Plateformes cloud optimisées pour free tier / bas coût (Fly.io, Railway pour le backend ; Vercel, Netlify pour le frontend statique/PWA).
    - **Justification :** Maîtrise des coûts opérationnels, essentielle pour atteindre la rentabilité sur un marché où l'ARPU (Revenu Moyen par Utilisateur) est intrinsèquement plus bas.

## 3. Fonctionnalités Clés & Portée du Produit

**Objectif Général :** Fournir un système de fidélisation complet et évolutif, commençant par un MVP ciblé.

### 3.1. Jubely Essentiel (MVP - Freemium)

- **Cible :** Petites entreprises sans solution de fidélité ou utilisant des méthodes inefficaces (WhatsApp).

- **Fonctionnalités :**
    1.  **Enrôlement Client :** Création simple et rapide de comptes clients via l'application du personnel (Nom, Téléphone, Email) ou directement par le client via la PWA.
    2.  **Attribution de Points :** Personnel scanne un QR code unique du client, saisit le montant de l'achat ; les points sont automatiquement attribués selon 1 règle de cumul simple et fixe (ex: 1 point par tranche de X FCFA).
    3.  **Expérience Client PWA :**
        - Connexion/déconnexion sécurisée.
        - Affichage clair du solde de points actuel.
        - Visualisation d'une unique récompense générique disponible (ex: "5% de réduction" ou "produit Y gratuit" une fois X points atteints).
        - Génération d'un QR code de réclamation pour la récompense.
    4.  **Réclamation & Validation de Récompense :** Le personnel scanne le QR code de réclamation du client, valide la transaction, et le code est "cramé" (non réutilisable).
    5.  **Tableau de Bord Commerçant (Web/Mobile) :**
        - Vue basique : nombre total de clients enregistrés, total des points distribués, liste des récompenses réclamées.
        - Gestion d'une seule règle de cumul de points et d'une seule récompense.

- **Limites du plan Essentiel** (pour inciter à l'upgrade) : Nombre limité de clients (ex: jusqu'à 100 ou 200 actifs), 1 seule règle de cumul, 1 seul type de récompense, pas de segmentation client, pas de notifications ciblées, rapports basiques.

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
    - Gestion Multi-Points de Vente : Administration centralisée et rapports consolidés pour plusieurs boutiques.
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

*Cette roadmap est une estimation et pourra être ajustée après les premiers retours utilisateurs et la phase de développement.*

- **Sprint 1 : Semaines 1-2 - Infrastructure & Enrôlement Basique**
    - **Objectifs :** Mettre en place l'environnement de développement et de déploiement. Permettre la création de comptes pour les commerçants et les clients.
    - **Tâches Clés :**
        - Initialisation des dépôts Git, CI/CD de base.
        - Mise en place de l'infrastructure Go (backend) et React/Next (frontend) sur Free Tiers (Supabase/PostgreSQL).
        - Développement des API d'authentification et de gestion utilisateur de base.
        - Application "Jubely Personnel" (MVP minimal) : Fonctionnalité de création de compte client (nom, téléphone, email), connexion/déconnexion.
        - Application "Jubely Client" (PWA MVP) : Création de compte client, connexion/déconnexion, affichage d'un QR code client unique personnel.
        - Définition d'une seule règle simple de cumul de points.

- **Sprint 2 : Semaines 3-4 - Attribution de Points & Noyau Fidélité**
    - **Objectifs :** Implémenter le cœur du système de points et permettre l'attribution.
    - **Tâches Clés :**
        - Développement du moteur de points en Event Sourcing (table events PostgreSQL).
        - Application "Jubely Personnel" : Intégration de la fonctionnalité "Attribuer des points" (scan QR code client, saisie du montant d'achat, affichage des points attribués).
        - Application "Jubely Client" (PWA) : Affichage dynamique du solde de points du client.
        - Développement d'une seule récompense générique ("5% de réduction pour X points").

- **Sprint 3 : Semaines 5-6 - Réclamation Récompense & Tableau de Bord Minimal**
    - **Objectifs :** Compléter le cycle de fidélisation côté client et fournir un aperçu au commerçant.
    - **Tâches Clés :**
        - Application "Jubely Client" (PWA) : Affichage de la récompense disponible, génération d'un QR code de réclamation temporaire.
        - Application "Jubely Personnel" : Fonctionnalité "Valider récompense" (scan QR code de réclamation, validation, "cramage" du code).
        - Développement du tableau de bord administrateur (web/mobile) pour le commerçant : Vue simplifiée (nombre de clients, points distribués, récompenses réclamées).
        - Mise en place du tracking des métriques clés d'activation des commerçants.

- **Sprint 4 : Semaines 7-8 - Affinement, Tests & Préparation au Lancement**
    - **Objectifs :** Stabiliser le MVP, améliorer l'expérience et préparer le déploiement initial.
    - **Tâches Clés :**
        - Tests complets end-to-end, corrections de bugs critiques.
        - Amélioration de l'UX/UI du MVP (selon les standards visés comme Max It, en gardant la simplicité).
        - Préparation du matériel d'onboarding et de documentation pour les commerçants.
        - Mise en place des canaux de feedback utilisateur pour le groupe pilote.
        - Déploiement initial auprès d'un groupe de "beta-testeurs" (Monsieur Kamga et quelques autres PME cibles).

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

Ce document de cadrage est désormais complet et constitue une base solide pour la suite du projet.