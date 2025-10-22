# StreamFlix - Plateforme de Streaming

StreamFlix est une plateforme de streaming de films et séries avec système d'abonnement, gestion de contenu et interface utilisateur moderne.

## Fonctionnalités

- 🔐 Authentification utilisateur (inscription/connexion)
- 🎬 Catalogue de films et séries
- ❤️ Système de favoris
- 💰 Système d'abonnement avec PayPal
- 📱 Interface responsive
- 🔍 Recherche et filtrage de contenu
- 🛡️ Sécurité avancée (CSRF, rate limiting, etc.)
- 📈 SEO optimisé (balises meta, sitemap, robots.txt)

## Configuration requise

- Node.js 16+
- PostgreSQL
- Compte PayPal pour les paiements (sandbox/production)
- Compte Gmail pour l'envoi d'emails

## Installation

1. Cloner le dépôt
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Configurer la base de données PostgreSQL
4. Configurer les variables d'environnement (voir `.env.example`)
5. Exécuter les migrations Drizzle :
   ```bash
   npx drizzle-kit push
   ```

## Configuration PayPal

Pour configurer les paiements PayPal et les webhooks :

1. Créer une application PayPal sur https://developer.paypal.com/
2. Obtenir le Client ID et Client Secret
3. Configurer les variables d'environnement :
   ```
   PAYPAL_CLIENT_ID=votre_client_id
   PAYPAL_CLIENT_SECRET=votre_client_secret
   PAYPAL_MODE=sandbox # ou 'live' pour la production
   PAYPAL_WEBHOOK_ID=votre_webhook_id # Obtenu après création du webhook
   ```
4. Créer un webhook PayPal avec l'URL : `https://votre-domaine.com/api/webhook/paypal`
5. Sélectionner les événements suivants :
   - PAYMENT.CAPTURE.COMPLETED
   - PAYMENT.CAPTURE.DENIED
   - PAYMENT.CAPTURE.REFUNDED
   - BILLING.SUBSCRIPTION.CREATED
   - BILLING.SUBSCRIPTION.CANCELLED

## Configuration Email

Pour que les utilisateurs reçoivent des emails de bienvenue lors de l'inscription :

1. Configurer EMAIL_USER et EMAIL_PASS dans le fichier `.env`
2. Suivre les instructions détaillées dans `EMAIL_CONFIGURATION.md`
3. Suivre le guide détaillé dans `GMAIL_SETUP_GUIDE.md` pour configurer Gmail
4. Si vous rencontrez des problèmes d'authentification, consulter `server/TROUBLESHOOTING_CHECKLIST.md`
5. Tester la configuration avec `npx tsx server/test-email.ts`

### Outils de diagnostic

- `npx tsx server/verify-gmail-setup.ts` - Vérifie la configuration des variables d'environnement
- `npx tsx server/test-smtp-connection.ts` - Teste la connexion SMTP directement
- `npx tsx server/test-email.ts` - Envoie un email de test complet
- `npx tsx server/advanced-diagnostics.ts` - Tests approfondis de diagnostic
- `npx tsx server/final-diagnostic.ts` - Diagnostic final avec logs détaillés

## Optimisation SEO

StreamFlix est entièrement optimisé pour le référencement naturel avec :

- Balises meta optimisées (description, keywords, author, etc.)
- Balises Open Graph pour le partage sur les réseaux sociaux
- Balises Twitter Card pour le partage sur Twitter
- Données structurées (JSON-LD) pour améliorer l'affichage dans les résultats de recherche
- Fichier sitemap.xml pour aider les moteurs de recherche à indexer le contenu
- Fichier robots.txt pour guider l'exploration par les robots
- URLs canoniques pour éviter le contenu dupliqué
- Préconnexion aux domaines externes pour améliorer les performances

Les fichiers SEO se trouvent dans le dossier `client/public/` :
- `index.html` - Contient toutes les balises meta et données structurées
- `robots.txt` - Instructions pour les robots d'indexation
- `sitemap.xml` - Carte du site pour les moteurs de recherche

## Génériques d'univers

StreamFlix inclut des génériques d'ambiance pour chaque univers de streaming (Netflix, Disney+, etc.) qui s'affichent au survol des logos dans la page d'accueil.

Pour télécharger les génériques officiels :

1. Exécutez le script de téléchargement : `node scripts/download-trailers.js`
2. Ou suivez le guide détaillé : `scripts/download-universe-trailers.md`

Les vidéos seront automatiquement intégrées dans l'interface utilisateur.

## Démarrage

```bash
# Démarrer le serveur backend
npm run dev:server

# Démarrer le client (dans un autre terminal)
npm run dev:client
```

## Structure du projet

- `client/` - Application frontend React
- `server/` - Serveur Express avec API
- `shared/` - Schémas partagés entre client et serveur
- `drizzle/` - Migrations de base de données

## Technologies utilisées

- Frontend : React, TypeScript, Tailwind CSS, TanStack Query
- Backend : Express.js, TypeScript
- Base de données : PostgreSQL avec Drizzle ORM
- Authentification : JWT
- Paiements : PayPal REST API
- Emails : Nodemailer avec Gmail

## Documentation

- `ADMIN_DASHBOARD_README.md` - Documentation du tableau de bord admin
- `IMPROVED_ADMIN_DASHBOARD_README.md` - Documentation du tableau de bord admin amélioré
- `INSTALLATION_POSTGRESQL.md` - Guide d'installation PostgreSQL
- `LYGOS_INTEGRATION_SUMMARY.md` - Documentation de l'intégration Lygos
- `EMAIL_CONFIGURATION.md` - Guide de configuration des emails
- `GMAIL_SETUP_GUIDE.md` - Guide détaillé de configuration Gmail
- `server/TROUBLESHOOTING_CHECKLIST.md` - Liste de vérification pour le dépannage des emails
- `scripts/download-universe-trailers.md` - Guide pour télécharger les génériques d'univers