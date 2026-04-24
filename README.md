# 🖐️ Chifoumi Ranked — Backend

Bienvenue sur le projet **Chifoumi Ranked**. Il s'agit d'une plateforme de duels de Pierre-Feuille-Ciseaux en temps réel, intégrant un système de matchmaking, une économie de skins et une sécurisation avancée.

Ce projet a été conçu avec une attention particulière portée à la **Clean Architecture** (Architecture Hexagonale) et aux standards de sécurité modernes.

---

## 🛠️ Installation et Lancement

Le projet utilise un `Makefile` pour simplifier toutes les opérations courantes.

### Pré-requis
- **Node.js** (v20+)
- **Yarn** (v4.x - PnP activé)
- **Docker & Docker-Compose** (pour la base de données PostgreSQL)

### Démarrage rapide (Tout-en-un)
Pour installer les dépendances, lancer la base de données, exécuter les tests et démarrer le serveur en une seule commande :
```bash
make full-run
```

### Commandes individuelles
- `make install` : Installe les dépendances (Yarn PnP).
- `make db-up` : Lance PostgreSQL via Docker.
- `make dev` : Lance l'API et le Frontend simultanément.
- `make test` : Exécute la suite de tests unitaires.
- `make lint` : Vérifie la qualité et le formatage du code.

---

## ✨ Fonctionnalités & Bonnes Pratiques

Voici les principaux piliers techniques implémentés dans ce projet :

### 🏗️ Architecture Hexagonale (Ports & Adapters)
Le cœur métier (Domain/Core) est totalement découplé des frameworks techniques (NestJS, TypeORM).
- **Domain Entities** : Logique pure du jeu (RPS, Tournois).
- **Use Cases** : Orchestration des actions métier (Login, Matchmaking).
- **Ports** : Interfaces définissant les besoins du métier (UserRepository, TokenGenerator).
- **Adapters** : Implémentations concrètes (TypeORM, JWT).
*Avantage : Testabilité maximale et facilité de changement technologique.*

### 🔐 Sécurité & Authentification
- **JWT avec Fingerprinting (fpt)** : Chaque token contient l'empreinte numérique de l'appareil (`fingerprint`) pour empêcher le vol de session. Si un token est utilisé depuis un appareil différent, il est invalidé.
- **RBAC (Role-Based Access Control)** : Les permissions sont intégrées directement dans le payload du JWT et validées par un `PermissionsGuard`.
- **Hachage Sécurisé** : Utilisation de `bcryptjs` pour le stockage des mots de passe.
- **Webhook Validation** : Sécurisation des notifications Stripe via validation de signature.

### ⚡ Concurrence & Temps Réel
- **Matchmaking (Queue Management)** : Système de file d'attente asynchrone gérant l'appairage des joueurs.
- **WebSockets (Socket.io)** : Communication bidirectionnelle pour des duels sans latence.
- **In-Memory Store** : Utilisation de `Map` optimisées pour gérer l'état des matchs actifs sans surcharger la base de données.
- **Transactions** : Intégrité des données assurée lors des opérations critiques (achats, gains).

### 💳 Intégration Stripe (Économie)
- **Paiements & Abonnements** : Gestion des upgrades "Pro" et des achats de skins cosmétiques.
- **Auto-Provisioning** : Le système crée automatiquement les produits et prix sur Stripe s'ils n'existent pas au démarrage.
- **Checkout Sessions** : Expérience d'achat sécurisée et fluide.

### 📖 Documentation API
- **Swagger / OpenAPI** : Documentation interactive auto-générée accessible sur `/api/docs`.
- **Postman Collection** : Une collection `renfo-api.postman_collection.json` est fournie à la racine pour tester les endpoints.

---

## 🧪 Tests
Le projet suit une approche rigoureuse de testabilité :
- **Tests Unitaires** (Jest) : Couvrant la logique métier et les cas limites.
- **Tests E2E** (Supertest) : Validant les flux complets (Register -> Login -> Payment).

---

## 📦 Stack Technologique
- **Framework** : NestJS (v11)
- **Langage** : TypeScript (Strict Mode)
- **Base de données** : PostgreSQL + TypeORM
- **Gestionnaire de packages** : Yarn (Plug'n'Play)
- **Containerisation** : Docker

