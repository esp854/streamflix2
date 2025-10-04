# StreamFlix

StreamFlix est une plateforme de streaming légal pour films et séries.

## Fonctionnalités

- Streaming de films et séries en haute qualité
- Système d'authentification utilisateur
- Lecteur vidéo responsive avec support mobile
- Publicités VAST intégrées pour les utilisateurs non authentifiés
- Interface utilisateur moderne et intuitive

## Technologies utilisées

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL
- Lecteur vidéo: Video.js avec support VAST
- Authentification: JWT, OAuth
- Paiements: PayPal

## Installation

1. Cloner le repository
2. Installer les dépendances:
   ```bash
   npm install
   cd client && npm install
   ```
3. Configurer les variables d'environnement (voir `.env.example`)
4. Démarrer le serveur de développement:
   ```bash
   npm run dev
   ```

## Lecteur VAST

Le lecteur vidéo utilise Video.js avec videojs-ima pour afficher les publicités VAST. Voici comment cela fonctionne :

### Fonctionnalités

- **Responsive**: Le lecteur s'adapte à tous les écrans (mobile et desktop)
- **Publicités VAST**: Affichage des publicités avant la lecture du contenu
- **Compatibilité mobile**: Gestion des restrictions d'autoplay sur mobile
- **Muted autoplay**: Sur mobile, le son est coupé pour permettre l'autoplay

### Configuration

L'URL VAST utilisée est :
```
https://selfishzone.com/d.mqFkzHdMGxNZvKZVGfUL/jeIm/9puTZTUSl/kuPZTQYc2hN/jvY_waNfTokUtRNzjnYO2qNvjWAU2-MkAf
```

### Comportement par appareil

- **Mobile**: Le lecteur démarre en mode muet pour contourner les restrictions d'autoplay
- **Desktop**: Le lecteur démarre normalement avec le son

### Pour les utilisateurs authentifiés

Les utilisateurs authentifiés n'ont pas de publicités et accèdent directement au contenu.

## Déploiement

Pour déployer l'application :

1. Construire le projet:
   ```bash
   npm run build
   ```
2. Démarrer le serveur:
   ```bash
   npm start
   ```

## Tests

Pour exécuter les tests :

```bash
npm test
```

## Contribution

Les contributions sont les bienvenues ! Veuillez lire le guide de contribution avant de soumettre une pull request.

## Licence

MIT