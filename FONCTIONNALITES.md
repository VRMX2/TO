# Fonctionnalités de CyberGameGT

Ce document liste l'ensemble des fonctionnalités de l'application **CyberGameGT**, une plateforme éducative qui modélise les stratégies de cybersécurité à l'aide de la théorie des jeux et de l'intelligence artificielle.

## 1. Tableau de Bord Réseau (Network Dashboard)
- **Visualisation Graphique :** Représentation visuelle d'un réseau d'entreprise simulé incluant différents nœuds (Endpoints, Serveurs, Routeurs/Core, Pare-feu) et les liens entre eux.
- **Contrôles de l'Agent IA :** Interface permettant d'interagir avec le moteur d'IA, de calculer les équilibres de Nash et de lancer des simulations interactives.
- **Suivi de la Menace :** Affichage en temps réel des niveaux de menace et des statuts des nœuds du réseau.

## 2. Moteur de Théorie des Jeux (Game Theory Engine)
- **Modélisation de Jeu à Somme Nulle :** Modélise le conflit entre un défenseur et un attaquant où le gain de l'un est la perte de l'autre.
- **Calcul de l'Équilibre de Nash :** Utilisation de calculs mathématiques (via NumPy/SciPy) pour déterminer l'équilibre en stratégies mixtes. Cela permet de trouver la combinaison optimale de défenses (statistiquement parlant) pour minimiser les gains de l'attaquant.
- **Gestion de Matrice des Gains (Payoff Matrix) :** Interface et API pour configurer et ajuster la matrice qui définit les récompenses/risques pour chaque combinaison d'attaque et de défense.

## 3. Modélisation des Stratégies (Attaque vs Défense)
- **Stratégies de Défense (Défenseur) :**
  - *Firewall* (Pare-feu) : Mise à jour statique des règles.
  - *IDS* (Système de Détection d'Intrusion) : Détection basée sur les signatures.
  - *Patch System* : Déploiement de correctifs de sécurité.
  - *Honey Pot* : Déploiement de systèmes leurres.
- **Stratégies d'Attaque (Attaquant) :**
  - *SQLi* (Injection SQL).
  - *DDoS Flood* (Attaque par déni de service distribué).
  - *Zero-Day Exploit* (Exploitation de failles inconnues).
  - *Phishing APT* (Menace persistante avancée via hameçonnage).

## 4. Simulation et Apprentissage IA (Learning Loop)
- **Simulations Dynamiques :** Exécution de scénarios d'attaque/défense étape par étape pour observer le déroulement d'une cyber-attaque.
- **Boucle d'Apprentissage :** L'agent IA analyse les résultats des attaques passées, calcule les nouveaux équilibres et adapte dynamiquement sa stratégie de défense pour contrer le comportement de l'adversaire de façon itérative.

## 5. Sécurité et Contrôle d'Accès de l'API
- **Authentification :** Sécurisation de l'API via une clé d'accès (`X-API-Key`).
- **Limitation de Débit (Rate Limiting) :** Protections contre le spam et les abus (particulièrement sur les endpoints liés à l'IA).
- **Validation des Entrées :** Plafonds stricts sur la taille des matrices de calcul et validation typée des requêtes réseaux.
- **Endpoints de Santé :** Routes dédiées (`/health` et `/ready`) pour vérifier la disponibilité du service, utiles pour le déploiement sur Docker ou Kubernetes.

## 6. Architecture Full-Stack Moderne
- **API REST Robuste :** Développée en Python avec FastAPI pour de hautes performances.
- **Frontend Réactif :** Construit avec React.js et Vite.js.
- **Conteneurisation :** Déploiement simplifié via Docker et Docker Compose, incluant une configuration pour la mise en production avec Nginx (Reverse Proxy).
