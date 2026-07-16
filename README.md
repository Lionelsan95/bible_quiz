# 📖 Quiz Biblique

Application web de quiz biblique en français, construite avec **React 18** et **Vite 6**. L'utilisateur choisit un livre de la Bible, répond à 10 questions tirées au hasard et découvre son score accompagné d'un message d'encouragement.

## Déroulé du jeu

1. **Accueil** — Une grille de cartes présente les 32 livres (ou groupes de livres) disponibles, avec le nombre de questions de chacun (ex. « Genèse — 40 questions »).
2. **Quiz** — 10 questions sont tirées au hasard dans le livre choisi (moins s'il y en a moins de 10). L'ordre des options est mélangé à chaque partie. Deux modes :
   - **Réponse simple** : un clic sur une option valide immédiatement la réponse.
   - **Réponses multiples** : un indice « Choisis N réponses puis valide » s'affiche ; on sélectionne/désélectionne les options, puis le bouton **Valider** s'active quand le bon nombre de réponses est coché.
   
   Après chaque réponse, les bonnes options sont surlignées en vert, les mauvais choix en rouge, et la référence biblique du verset est affichée (« Bonne réponse ! 📖 Référence : Genèse 1 »). Une barre de progression et un bouton « ← Quitter » sont toujours visibles.
3. **Résultats** — Score sur 10, pourcentage de bonnes réponses et message d'encouragement selon le ratio (≥ 90 % : « Excellent ! », ≥ 70 % : « Très bien ! », ≥ 50 % : « Pas mal », sinon : « Continue à lire la Bible »). Deux boutons : **Rejouer ce livre** (nouveau tirage) ou **Choisir un autre livre** (retour à l'accueil).

## Prérequis

- **Node.js** ≥ 20 (testé avec Node 20.11) et **npm**.

## Installation

```bash
npm install
```

## Lancement en développement

```bash
npm run dev
```

Vite démarre un serveur de développement (par défaut sur http://localhost:5173).

## Build de production

```bash
npm run build     # génère le dossier dist/
npm run preview   # sert le build localement pour vérification
```

## Tests

```bash
npm test            # exécute la suite une fois (vitest run)
npm run test:watch  # mode watch (vitest)
```

La suite compte **43 tests** répartis sur 5 fichiers, écrits avec **Vitest**, **Testing Library** (`@testing-library/react`, `@testing-library/user-event`) et les matchers `@testing-library/jest-dom`. L'environnement de test est `jsdom` (configuré dans `vite.config.js`, avec `globals: true` et le setup `src/test/setup.js`).

> **Note :** `jsdom` est fixé en v25 (`^25.0.1`) pour rester compatible avec Node 20.11 (les versions plus récentes de jsdom exigent un Node plus récent).

Couverture des tests :

- `src/App.test.jsx` — flux complet accueil → quiz → résultats → rejouer / changer de livre / quitter (le module de données est mocké pour rendre le tirage déterministe).
- `src/components/QuestionCard.test.jsx` — modes simple et multiple, classes CSS `correct`/`wrong`/`dimmed`, attributs `aria-pressed` et `aria-disabled`, annonce « Bonne/Mauvaise réponse », clics ignorés après révélation.
- `src/components/Quiz.test.jsx` — progression, `role="progressbar"`, bouton suivant, score final transmis à `onFinish`, liste vide gérée sans crash.
- `src/components/Results.test.jsx` — score, pourcentage, messages par palier, cas `total = 0` sans `NaN`.
- `src/data/questions.test.js` — ordre biblique préservé, comptage par livre, tirage borné, mélange des options avec remappage correct des indices, non-mutation des données source, validation dev sans avertissement sur les données réelles.

## Structure du projet

```
bible_gaming/
├── index.html                     # Page HTML racine (lang="fr")
├── vite.config.js                 # Config Vite + config de test Vitest (jsdom)
├── package.json
├── data/
│   └── quiz_biblique.json         # 504 questions réparties en 32 livres/groupes
└── src/
    ├── main.jsx                   # Point d'entrée React (montage de <App />)
    ├── styles.css                 # Styles globaux (focus-visible, reduced-motion…)
    ├── App.jsx                    # Machine à états d'écrans (accueil / quiz / résultats)
    ├── components/
    │   ├── BookSelect.jsx         # Écran d'accueil : grille des livres
    │   ├── Quiz.jsx               # Orchestration du quiz : progression, score, navigation
    │   ├── QuestionCard.jsx       # Affichage d'une question (simple ou multiple)
    │   └── Results.jsx            # Écran de résultats : score, pourcentage, message
    ├── data/
    │   └── questions.js           # Accès aux données : getBooks(), pickQuestions()
    │                              # + validation des données en mode dev
    └── test/
        └── setup.js               # Setup Vitest (matchers jest-dom)
```

## Format des données (`data/quiz_biblique.json`)

Le fichier contient un objet avec `titre`, `description`, `total_questions` (504) et un tableau `questions`. Chaque question a la forme suivante :

```json
{
  "id": "gen_001",
  "livre": "Genèse",
  "question": "En combien de jours Dieu crée-t-il le monde selon Genèse 1 ?",
  "options": ["6 jours", "7 jours", "3 jours", "40 jours"],
  "reponses_correctes": [0],
  "nombre_bonnes_reponses": 1,
  "reference": "Genèse 1",
  "difficulte": "facile"
}
```

| Champ | Description |
|---|---|
| `id` | Identifiant unique (préfixe du livre + numéro), utilisé comme `key` React |
| `livre` | Nom du livre, tel qu'affiché à l'accueil (l'ordre d'apparition dans le fichier définit l'ordre d'affichage) |
| `question` | Énoncé de la question |
| `options` | 4 options de réponse (textes uniques) |
| `reponses_correctes` | Indices (base 0) des bonnes réponses dans `options` — 1 ou 2 éléments |
| `nombre_bonnes_reponses` | Doit être égal à `reponses_correctes.length` (vérifié en dev) |
| `reference` | Référence biblique affichée après la réponse |
| `difficulte` | Métadonnée indicative (non utilisée par le code actuellement) |

## Accessibilité

- **`aria-live="polite"`** — La zone d'annonce du résultat (« Bonne réponse ! … Référence : … ») est montée en permanence dans `QuestionCard`, pour que les lecteurs d'écran lisent l'annonce quand elle apparaît.
- **`aria-pressed`** — En mode réponses multiples, chaque option se comporte comme un bouton bascule et expose son état sélectionné/désélectionné.
- **`aria-disabled`** — Après révélation de la réponse, les options sont marquées `aria-disabled="true"` (et les clics ignorés en JS) plutôt que `disabled`, afin de rester focusables et lisibles par les technologies d'assistance.
- **`role="progressbar"`** — La barre de progression du quiz expose `aria-valuenow` / `aria-valuemin` / `aria-valuemax` et un `aria-label` descriptif.
- **`prefers-reduced-motion`** — Les animations sont réduites via une media query pour les utilisateurs qui le demandent.
- **`:focus-visible`** — Un contour de focus visible est appliqué à la navigation clavier.
- Les emojis décoratifs sont systématiquement masqués aux lecteurs d'écran avec `aria-hidden="true"`.

## Ajouter des questions

1. Ouvrir `data/quiz_biblique.json` et ajouter un objet dans le tableau `questions`, en respectant le format ci-dessus :
   - `id` unique (convention : préfixe du livre + numéro, ex. `gen_041`) ;
   - `options` sans doublons ;
   - `reponses_correctes` : indices valides (entre 0 et `options.length - 1`) ;
   - `nombre_bonnes_reponses` égal à la longueur de `reponses_correctes`.
2. Pour un **nouveau livre**, il suffit d'utiliser un nouveau nom dans `livre` : il apparaîtra automatiquement à l'accueil, à sa position d'apparition dans le fichier (garder l'ordre biblique).
3. Lancer `npm run dev` : une validation en mode développement (`src/data/questions.js`) affiche un avertissement en console si `nombre_bonnes_reponses` est incohérent, si des options sont en double ou si un indice de bonne réponse est hors limites.
4. Lancer `npm test` pour vérifier que rien n'est cassé (la suite valide notamment l'absence d'avertissement sur les données réelles).
