# Planification Détaillée du Projet Jubely

**Objectif Général :** Lancer un MVP "Essentiel" robuste et fonctionnel en **8 semaines**, validant les hypothèses clés et permettant un apprentissage rapide.

## Phase 1 : Préparation & Infrastructure (Semaines 1-2)

**Objectif du Sprint :** Mettre en place l'environnement de développement, l'infrastructure cloud initiale, et les fondations des applications.

**Livrables Clés :**
- Dépôts Git configurés avec CI/CD de base.
- Services backend Go déployables (même vides).
- Services frontend React/Next.js déployables.
- Base de données PostgreSQL sur Supabase opérationnelle.
- Maquettes UX/UI (wireframes/mockups) détaillées pour les écrans du Sprint 1.

**Tâches Détaillées :**

### 1. Semaine 1 : Architecture Fondamentale & Environnement

- **Backend (Go) :**
    - Initialisation du projet Go.
    - Mise en place de la structure des dossiers (API, services, modèles, configs).
    - Configuration du module go.mod.
    - Définition du client HTTP et du routeur web (ex: Fiber, Gin).
    - Connexion à la base de données PostgreSQL (Supabase).
    - Définition du modèle de données User (commerçant, client, personnel) et de ses repositories/CRUD de base.
    - Implémentation de l'API d'enregistrement et de connexion des utilisateurs (JWT pour l'authentification).
    - Mise en place des premiers tests unitaires.

- **Frontend (React/Next.js) :**
    - Création des projets React/Next.js pour la PWA client et l'application personnel.
    - Configuration des environnements de développement et de production.
    - Mise en place du gestionnaire d'état (Zustand ou Redux Toolkit).
    - Intégration d'une bibliothèque d'UI composants (ex: Tailwind CSS, Material UI) pour accélérer le prototypage.
    - Développement des écrans d'enregistrement et de connexion pour la PWA client et l'application personnel.
    - Développement de l'écran "Affichage QR Code client" dans la PWA client.

- **Infrastructure :**
    - Création du compte Supabase et configuration de la base de données PostgreSQL.
    - Définition du schéma initial des tables users, events (pour l'Event Sourcing), points_rules.
    - Mise en place des dépôts Git et configuration des pipelines CI/CD de base (ex: GitHub Actions) pour le déploiement sur Fly.io/Railway (Go) et Vercel/Netlify (React/Next.js).
    - Configuration des variables d'environnement.

### 2. Semaine 2 : Sécurité & Enrôlement Complet

- **Backend (Go) :**
    - Raffinement de la gestion des erreurs et de la validation des données d'entrée.
    - Implémentation des rôles de base (client, personnel).
    - API pour la création de client par le personnel (avec validation des données).
    - Mise en place des middlewares d'authentification et d'autorisation.

- **Frontend (React/Next.js) :**
    - Application "Jubely Personnel" : Intégration de l'API de création de client (écran "Créer Compte" vu précédemment).
    - Application "Jubely Client" (PWA) : Intégration de l'affichage du QR Code client unique.
    - Gestion des sessions utilisateur et de la persistance de l'état.
    - Premiers tests d'intégration entre le frontend et le backend pour l'authentification et l'enrôlement.

- **Documentation :** Démarrage de la documentation technique (API endpoints, modèles de données).

## Phase 2 : Cœur de la Fidélisation (Semaines 3-4)

**Objectif du Sprint :** Implémenter le moteur d'attribution de points et la règle de fidélité fondamentale.

**Livrables Clés :**
- Moteur de points Event Sourcing opérationnel.
- API d'attribution de points.
- Application personnel capable d'attribuer des points via scan QR.
- PWA client affichant le solde de points.
- Maquettes UX/UI détaillées pour les écrans du Sprint 2.

**Tâches Détaillées :**

### 1. Semaine 3 : Moteur de Points & Règle Unique

- **Backend (Go - Moteur de Points) :**
    - Définition de la structure des événements de points (ClientPointsAttributed, RuleUpdated, etc.).
    - Implémentation des fonctions d'agrégation d'événements pour calculer le solde de points d'un client.
    - API pour l'attribution de points (scan QR code client, montant de l'achat).
    - Logique d'application d'une seule règle de cumul de points (ex: 1 point / X FCFA).
    - API pour consulter le solde de points d'un client.
    - Tests unitaires et d'intégration spécifiques au moteur de points.

- **Frontend (React/Next.js) :**
    - Application "Jubely Personnel" : Développement de l'écran "Attribuer Points" (lecture du QR Code, saisie du montant, affichage des points cumulés). Intégration avec l'API d'attribution de points.
    - Application "Jubely Client" (PWA) : Intégration de l'API de consultation du solde de points pour l'afficher dynamiquement.

- **Infrastructure :**
    - Optimisation des index sur la table events pour des requêtes rapides.
    - Surveillance des logs et performances.

### 2. Semaine 4 : Stabilisation & Premiers Tests Manuels

- **Backend (Go) :**
    - Révision de code et optimisation des performances.
    - Amélioration de la gestion des erreurs.
    - Développement des tests de bout en bout pour le flux d'attribution de points.

- **Frontend (React/Next.js) :**
    - Refactorisation des composants.
    - Amélioration de l'UX/UI des flux d'attribution et de visualisation de points.
    - Tests manuels approfondis des applications personnel et client.

- **Documentation :** Mise à jour de la documentation API et des flux utilisateurs.

## Phase 3 : Récompenses & Expérience Complète (Semaines 5-6)

**Objectif du Sprint :** Compléter le cycle de fidélisation avec la réclamation des récompenses et fournir un premier tableau de bord.

**Livrables Clés :**
- API de gestion des récompenses.
- PWA client permettant la réclamation de récompense.
- Application personnel pour la validation des récompenses.
- Tableau de bord administrateur minimal.
- Maquettes UX/UI détaillées pour les écrans du Sprint 3.

**Tâches Détaillées :**

### 1. Semaine 5 : Récompenses & Réclamation

- **Backend (Go) :**
    - Modèle de données pour une récompense simple (ex: Reward { ID, Name, PointsRequired, Value }).
    - API pour le commerçant de définir cette récompense unique.
    - API pour le client de "réclamer" une récompense (vérification des points, génération d'un QR code de réclamation à usage unique).
    - API pour le personnel de "valider" la récompense (scan du QR de réclamation, déduction des points, "cramage" du QR).

- **Frontend (React/Next.js) :**
    - Application "Jubely Client" (PWA) : Affichage de la récompense disponible, bouton "Réclamer Récompense", génération et affichage du QR code de réclamation.
    - Application "Jubely Personnel" : Développement de l'écran "Valider Récompense" (scan QR, confirmation).

- **Documentation :** Mise à jour des flux liés aux récompenses.

### 2. Semaine 6 : Tableau de Bord Minimal & Intégration Finale

- **Backend (Go) :**
    - API pour récupérer les données agrégées pour le tableau de bord (nombre de clients, points distribués, récompenses réclamées).

- **Frontend (React/Next.js) :**
    - Application "Jubely Admin/Personnel" (web/mobile) : Développement d'un tableau de bord minimal affichant les KPIs simples pour le commerçant.
    - Intégration de toutes les API développées dans les applications.
    - Optimisation des performances de la PWA (cache, chargement rapide).
    - Tests de bout en bout complets de tous les flux.

- **Outils & Métriques :**
    - Mise en place d'un outil d'analyse simple (ex: Google Analytics) pour le tracking d'activation et d'usage.
    - Définition des alertes de base sur la performance de l'infrastructure.

## Phase 4 : Lancement & Affinement (Semaines 7-8)

**Objectif du Sprint :** Préparer le MVP pour le déploiement, le lancer auprès des premiers utilisateurs et recueillir les premiers retours.

**Livrables Clés :**
- MVP "Essentiel" déployé et accessible.
- Matériel d'onboarding et support pour les commerçants.
- Canaux de feedback utilisateurs opérationnels.
- Analyse des premières métriques.

**Tâches Détaillées :**

### 1. Semaine 7 : Préparation au Lancement

- **Sécurité :** Audit de sécurité basique (OWASP Top 10), révision des configurations serveurs.
- **Performance :** Tests de charge légers, optimisation des requêtes SQL.
- **Documentation :** Finalisation du guide d'utilisation rapide pour les commerçants et leur personnel.
- **Onboarding :** Création des comptes pour les commerçants pilotes.
- **Juridique :** Rédaction des CGU/CGV simplifiées et de la politique de confidentialité.
- **Communication :** Préparation des messages de lancement pour le groupe pilote.
- **Monitoring :** Mise en place d'outils de monitoring des applications (logs, erreurs).

### 2. Semaine 8 : Lancement Pilote & Recueil de Feedback

- **Déploiement :** Déploiement du MVP sur les environnements de production.
- **Lancement Pilote :** Accès accordé au groupe de commerçants pilotes (dont Monsieur Kamga).
- **Support :** Mise en place d'un canal de support dédié (ex: groupe WhatsApp privé, email) pour les pilotes.
- **Feedback :** Collecte active des retours utilisateurs (interviews, questionnaires, analyse des logs).
- **Analyse :** Suivi des KPIs d'activation des commerçants et des premiers signaux de retour des clients finaux.
- **Planification Future :** Analyse des résultats du pilote pour prioriser les fonctionnalités de la prochaine itération (potentiellement les fonctionnalités "Pro").

---

Cette planification fournit un chemin clair et structuré pour la mise en œuvre du MVP de Jubely. Elle est conçue pour être agile, permettre un déploiement rapide et un apprentissage continu, tout en respectant les contraintes de coûts et en visant une expérience utilisateur de qualité dès le départ.