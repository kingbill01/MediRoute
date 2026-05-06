# Contributing to MediRoute

Merci de votre intérêt pour contribuer à MediRoute! 🎉

## Comment Contribuer

### Signaler un Bug 🐛

1. Vérifiez que le bug n'a pas déjà été signalé dans les Issues
2. Ouvrez une nouvelle Issue avec:
   - Un titre clair et descriptif
   - Les étapes pour reproduire le bug
   - Le comportement attendu vs observé
   - Captures d'écran si possible
   - Environnement (OS, navigateur, version Node.js)

### Proposer une Nouvelle Fonctionnalité 💡

1. Ouvrez une Issue avec le label "enhancement"
2. Décrivez:
   - Le problème que cela résout
   - La solution proposée
   - Les alternatives considérées
   - L'impact sur les utilisateurs

### Soumettre une Pull Request 🔧

1. **Fork** le projet
2. **Créez une branche** depuis `main`:
   ```bash
   git checkout -b feature/ma-fonctionnalite
   ```
3. **Commitez** vos changements:
   ```bash
   git commit -m "feat: ajout de la nouvelle fonctionnalité"
   ```
4. **Push** vers votre fork:
   ```bash
   git push origin feature/ma-fonctionnalite
   ```
5. **Ouvrez une Pull Request** sur GitHub

## Standards de Code

### Style de Code

- **Backend (TypeScript)**:
  - Utiliser ESLint et Prettier
  - Nommer les variables en camelCase
  - Commenter les fonctions complexes

- **Frontend (React/TypeScript)**:
  - Composants fonctionnels avec Hooks
  - Props typées avec TypeScript
  - CSS-in-JS avec Material-UI

### Commits

Suivre la convention [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` documentation
- `style:` formatage, point-virgule, etc.
- `refactor:` refactoring de code
- `test:` ajout de tests
- `chore:` tâches de maintenance

Exemples:
```
feat: ajout du système de notifications push
fix: correction de l'erreur de connexion mobile
docs: mise à jour du guide d'utilisation
```

### Tests

- Écrire des tests pour les nouvelles fonctionnalités
- S'assurer que tous les tests passent avant de soumettre

```bash
npm test
```

## Structure des Branches

- `main`: production, toujours stable
- `develop`: développement en cours
- `feature/*`: nouvelles fonctionnalités
- `fix/*`: corrections de bugs
- `hotfix/*`: corrections urgentes en production

## Code Review

Toutes les Pull Requests seront examinées par au moins un mainteneur:

✅ Critères d'acceptation:
- Code propre et lisible
- Tests passants
- Documentation à jour
- Pas de conflits avec main
- Respect des standards

## Licence

En contribuant, vous acceptez que vos contributions soient sous licence MIT.

---

Merci de contribuer à améliorer l'accès aux soins au Sénégal! 🇸🇳❤️
