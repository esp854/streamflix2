# Intégration du SDK PayPal v6 JavaScript dans StreamFlix

## Aperçu

Cette documentation explique comment intégrer le SDK PayPal v6 JavaScript dans l'application StreamFlix pour permettre aux utilisateurs de payer leurs abonnements via PayPal.

## Architecture de l'intégration

### 1. Composants principaux

1. **PayPalButton.tsx** - Composant React qui gère l'intégration complète du SDK PayPal v6
2. **Payment.jsx** - Composant de paiement existant mis à jour pour utiliser le nouveau SDK
3. **TestPayPalSDK.tsx** - Page de test pour vérifier le bon fonctionnement de l'intégration

### 2. Flux de paiement

1. L'utilisateur sélectionne un plan d'abonnement et choisit PayPal comme méthode de paiement
2. L'application crée une commande PayPal via l'API backend
3. Le SDK PayPal v6 est chargé dynamiquement depuis `https://www.sandbox.paypal.com/web-sdk/v6/core`
4. Une instance du SDK est créée avec le `clientToken` obtenu du serveur
5. Le bouton PayPal est rendu et prêt à l'emploi
6. Lorsque l'utilisateur clique sur le bouton, le flux de paiement PayPal démarre
7. Après approbation, le paiement est capturé et l'abonnement est activé

## Configuration requise

### Variables d'environnement

Ajoutez les variables suivantes à vos fichiers `.env` :

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# PayPal SDK v6 Configuration
PAYPAL_SDK_URL=https://www.sandbox.paypal.com/web-sdk/v6/core
PAYPAL_MERCHANT_DOMAINS=localhost:5173,localhost:5000
```

### Mise à jour du CSP (Content Security Policy)

Le fichier `vite.config.ts` a été mis à jour pour inclure les domaines PayPal dans les en-têtes CSP :

```javascript
// Dans les directives script-src, connect-src et frame-src
https://*.paypal.com:* 
https://*.paypalobjects.com 
https://*.braintreegateway.com
```

## Fonctionnalités implémentées

### 1. Chargement dynamique du SDK

Le SDK PayPal est chargé dynamiquement uniquement lorsque nécessaire, réduisant ainsi le temps de chargement initial de l'application.

### 2. Authentification sécurisée

L'authentification utilise un `clientToken` généré côté serveur, conforme aux meilleures pratiques de sécurité de PayPal :

- Liaison de domaine pour empêcher toute utilisation non autorisée
- Sécurité cryptographique avec signature numérique
- Durée de vie de 15 minutes pour le jeton

### 3. Gestion des événements

Tous les événements du processus de paiement sont gérés :

- `onApprove` - Paiement approuvé avec succès
- `onShippingAddressChange` - Changement d'adresse de livraison
- `onShippingOptionsChange` - Changement d'options d'expédition
- `onCancel` - Annulation du paiement par l'utilisateur
- `onError` - Erreurs lors du processus de paiement

### 4. Modes de présentation

Le SDK prend en charge plusieurs modes de présentation :

- `popup` - Fenêtre contextuelle traditionnelle
- `modal` - Fenêtre modale intégrée à la page
- `redirect` - Redirection vers PayPal
- `auto` - Choix automatique par le SDK

### 5. Personnalisation du bouton

Le bouton PayPal peut être personnalisé avec :

- Classes CSS prédéfinies (`paypal-gold`, `paypal-white`, `paypal-blue`)
- Variables CSS personnalisées (`--paypal-button-border-radius`)
- Attributs `type` pour contrôler le texte du bouton

## Utilisation

### Test de l'intégration

Pour tester l'intégration, accédez à l'URL suivante dans votre navigateur :

```
http://localhost:5173/test-paypal-sdk
```

### Intégration dans le flux de paiement

L'intégration est automatiquement activée dans le composant de paiement lorsque PayPal est configuré comme fournisseur de paiement.

## Sécurité

### Mesures de protection mises en œuvre

1. **Liaison de domaine** : Le `clientToken` est lié aux domaines marchands spécifiés
2. **Signature numérique** : La charge utile est sécurisée cryptographiquement
3. **Validation côté serveur** : Tous les paiements sont vérifiés côté serveur
4. **Gestion des erreurs** : Les erreurs sont correctement gérées et journalisées

### Bonnes pratiques

1. Ne jamais exposer les clés secrètes côté client
2. Toujours utiliser HTTPS en production
3. Valider tous les callbacks de paiement côté serveur
4. Mettre en place une journalisation appropriée pour le suivi des transactions

## Dépannage

### Problèmes courants

1. **Le SDK ne se charge pas**
   - Vérifiez la connectivité réseau
   - Assurez-vous que les domaines PayPal sont autorisés dans le CSP

2. **Erreur d'authentification**
   - Vérifiez que les variables d'environnement PayPal sont correctement configurées
   - Assurez-vous que le `clientToken` est généré avec les bons domaines

3. **Le bouton ne s'affiche pas**
   - Vérifiez que l'utilisateur est authentifié
   - Assurez-vous que le plan sélectionné est valide

### Journaux et monitoring

Toutes les erreurs et événements importants sont journalisés dans la console du navigateur et côté serveur pour faciliter le débogage.

## Maintenance

### Mises à jour

Pour mettre à jour le SDK PayPal :

1. Vérifiez la dernière version sur le site développeur de PayPal
2. Mettez à jour l'URL du SDK dans les variables d'environnement
3. Testez l'intégration après la mise à jour

### Surveillance

Surveillez régulièrement :

- Les journaux d'erreurs
- Les taux de réussite des paiements
- Les performances du SDK

## Conclusion

L'intégration du SDK PayPal v6 JavaScript dans StreamFlix fournit une expérience de paiement moderne et sécurisée pour les utilisateurs. L'implémentation suit les meilleures pratiques de sécurité et d'expérience utilisateur recommandées par PayPal.