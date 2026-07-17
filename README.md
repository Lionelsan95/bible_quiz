# 📖 Quiz Biblique

Application web de quiz biblique **bilingue (français / anglais)**, construite avec **React 18** et **Vite 6**. L'utilisateur choisit un livre de la Bible, répond à 10 questions tirées au hasard et découvre son score accompagné d'un message d'encouragement. L'application propose aussi un **historique local** des parties et un **thème clair / sombre**.

## Déroulé du jeu

1. **Accueil** — Une grille de cartes présente les 32 livres (ou groupes de livres) disponibles, avec le nombre de questions de chacun (ex. « Genèse — 40 questions »). L'en-tête propose une **bascule de langue FR / EN**, et une **bascule de thème** (clair / sombre / auto) est visible en permanence, ainsi qu'un bouton **📊 Mon historique**.
2. **Quiz** — 10 questions sont tirées au hasard dans le livre choisi (moins s'il y en a moins de 10). L'ordre des options est mélangé à chaque partie. Deux modes :
   - **Réponse simple** : un clic sur une option valide immédiatement la réponse.
   - **Réponses multiples** : un indice « Choisis N réponses puis valide » s'affiche ; on sélectionne/désélectionne les options, puis le bouton **Valider** s'active quand le bon nombre de réponses est coché.

   Après chaque réponse, les bonnes options sont surlignées en vert, les mauvais choix en rouge, et la référence biblique du verset est affichée (« Bonne réponse ! 📖 Référence : Genèse 1 »). Une barre de progression et un bouton « ← Quitter » sont toujours visibles.
3. **Résultats** — Score sur 10, pourcentage de bonnes réponses et message d'encouragement selon le ratio (≥ 90 % : « Excellent ! », ≥ 70 % : « Très bien ! », ≥ 50 % : « Pas mal », sinon : « Continue à lire la Bible »). Trois actions : **Rejouer ce livre** (nouveau tirage), **Choisir un autre livre** (retour à l'accueil) ou **Mon historique**.
4. **Historique** — La liste des parties terminées (livre, score, date localisée), avec un état de chargement et un état vide. L'historique est **local au navigateur** (aucune synchronisation ni compte) — voir [Historique local](#historique-local).

## Langues (i18n)

Le texte de l'interface est internationalisé avec **react-i18next** (français par défaut, anglais disponible). La bascule **FR / EN** de l'accueil change la langue à la volée ; le choix est mémorisé (`localStorage`, clé `quiz-biblique.lang`) et pilote aussi `<html lang>` et le titre de l'onglet.

Les **questions elles-mêmes sont bilingues** : une banque française (`data/quiz_biblique.json`) et une banque anglaise (`data/quiz_biblique.en.json`) sont maintenues en parité stricte. Voir la section **Format des données** plus bas.

> La bascule de langue n'apparaît **que sur l'accueil**, à dessein : la langue ne peut changer qu'avant de démarrer une partie, ce qui évite de rejouer un livre absent de la banque de la nouvelle langue.

## Thème clair / sombre

Un **sélecteur de thème** (☀️ clair / 🌙 sombre / 🌗 auto) est présent sur tous les écrans. Le mode **auto** suit la préférence du système d'exploitation (`prefers-color-scheme`) et se met à jour en direct si elle change. Le choix est mémorisé (`localStorage`, clé `quiz-biblique.theme`). Un petit script en ligne dans `index.html` applique le thème **avant le premier rendu** pour éviter tout flash clair. Toute la mise en forme repose sur des variables CSS ; le mode sombre les redéfinit sous `:root[data-theme='dark']`.

## Historique local

Chaque partie terminée est enregistrée par `src/history/localHistory.js` dans `localStorage` (clé versionnée `quiz-biblique.attempts.v2`, forme `{ id, book, score, total, completedAt }`, 100 entrées max, plus récentes en tête). L'accès passe par une interface asynchrone `src/history/historyStore.js` (`saveAttempt` / `listAttempts`) — pensée comme point de branchement pour un futur stockage distant. Toute écriture est « best-effort » (encapsulée dans `try/catch`) et ne bloque jamais l'affichage.

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

## Qualité de code

```bash
npm run lint      # ESLint (flat config : react-hooks, jsx-a11y, config Prettier)
npm run format    # Prettier --write (met en forme le code)
```

## Tests

```bash
npm test            # exécute la suite une fois (vitest run)
npm run test:watch  # mode watch (vitest)
```

La suite compte **99 tests** répartis sur **13 fichiers**, écrits avec **Vitest**, **Testing Library** (`@testing-library/react`, `@testing-library/user-event`) et les matchers `@testing-library/jest-dom`. L'environnement de test est `jsdom` (configuré dans `vite.config.js`, avec `globals: true` et le setup `src/test/setup.js`).

> **Note :** `jsdom` est fixé en v25 (`^25.0.1`) pour rester compatible avec Node 20.11 (les versions plus récentes de jsdom exigent un Node plus récent).

Couverture des tests :

- `src/App.test.jsx` — flux complet accueil → quiz → résultats → rejouer / changer de livre / quitter, accès à l'historique, et changement de thème en cours de quiz sans perte d'état (le module de données est mocké pour rendre le tirage déterministe).
- `src/components/QuestionCard.test.jsx` — modes simple et multiple, classes CSS `correct`/`wrong`/`dimmed`, attributs `aria-pressed` et `aria-disabled`, annonce « Bonne/Mauvaise réponse », clics ignorés après révélation.
- `src/components/Quiz.test.jsx` — progression, `role="progressbar"`, bouton suivant, score final transmis à `onFinish`, liste vide gérée sans crash.
- `src/components/Results.test.jsx` — score, pourcentage, messages par palier, cas `total = 0` sans `NaN`.
- `src/components/HistoryScreen.test.jsx` — états de chargement, vide et peuplé de l'historique.
- `src/components/LanguageToggle.test.jsx` — rendu FR/EN, `aria-pressed`, bascule et persistance de la langue.
- `src/components/ThemeToggle.test.jsx` — rendu des trois modes, `aria-pressed`, bascule et persistance du thème.
- `src/data/questions.test.js` — ordre biblique préservé, comptage par livre, tirage borné, mélange des options avec remappage correct des indices, non-mutation des données source, paramètre de langue (`getBooks(lang)` / `pickQuestions(book, n, lang)`), validation dev sans avertissement sur les deux banques.
- `src/data/bookNames.test.js` — la carte FR → EN couvre chaque livre présent dans les données.
- `src/data/enBankParity.test.js` — parité stricte FR ↔ EN (mêmes `id`, même nombre d'options, mêmes indices corrects, noms de livres correspondants).
- `src/history/localHistory.test.js` — lecture/écriture, plafond, tolérance aux données corrompues, migration v1 → v2.
- `src/i18n/catalogs.test.js` — les catalogues `fr` et `en` ont exactement les mêmes clés.
- `src/theme/theme.test.js` — résolution light/dark/auto, suivi de la préférence système, persistance, robustesse au stockage indisponible.

## Structure du projet

```
bible_gaming/
├── index.html                     # Page HTML racine + script de thème pré-rendu (anti-flash)
├── vite.config.js                 # Config Vite + config de test Vitest (jsdom)
├── eslint.config.js               # Config ESLint (flat config)
├── .prettierrc.json               # Config Prettier
├── package.json
├── data/
│   ├── quiz_biblique.json         # 504 questions FR, 32 livres/groupes (source, édition manuelle)
│   └── quiz_biblique.en.json      # 504 questions EN (parité stricte avec le FR)
└── src/
    ├── main.jsx                   # Point d'entrée React (+ imports i18n et thème)
    ├── styles.css                 # Styles globaux + palette sombre (:root[data-theme='dark'])
    ├── App.jsx                    # Machine à états d'écrans (home / quiz / results / history)
    ├── components/
    │   ├── BookSelect.jsx         # Accueil : grille des livres
    │   ├── Quiz.jsx               # Orchestration du quiz : progression, score, navigation
    │   ├── QuestionCard.jsx       # Affichage d'une question (simple ou multiple)
    │   ├── Results.jsx            # Écran de résultats : score, pourcentage, message
    │   ├── HistoryScreen.jsx      # Historique local des parties
    │   ├── LanguageToggle.jsx     # Bascule FR / EN (accueil uniquement)
    │   └── ThemeToggle.jsx        # Bascule clair / sombre / auto (globale)
    ├── data/
    │   ├── questions.js           # Chargement + normalisation des deux banques ;
    │   │                          #   getBooks(lang), pickQuestions(book, n, lang)
    │   └── bookNames.js           # Carte des noms de livres FR → EN
    ├── history/
    │   ├── localHistory.js        # Stockage localStorage (clé versionnée, migration v1→v2)
    │   └── historyStore.js        # Interface async (saveAttempt / listAttempts)
    ├── i18n/
    │   ├── index.js               # Init react-i18next (défaut fr, persistance)
    │   └── locales/
    │       ├── fr/translation.json
    │       └── en/translation.json
    ├── theme/
    │   └── theme.js               # Store de thème light/dark/auto + hook useTheme()
    └── test/
        ├── setup.js               # Setup Vitest (jest-dom, i18n, reset thème)
        └── matchMedia.js          # Stub matchMedia pour jsdom
```

## Format des données (`data/quiz_biblique.{json,en.json}`)

L'application charge **deux banques** de questions et les normalise, au chargement (`src/data/questions.js`), vers une forme interne **à clés anglaises** : `{ id, book, text, options, correctAnswers, correctCount, reference, difficulty }`. `getBooks(lang)` et `pickQuestions(book, n, lang)` sélectionnent la banque selon la langue (`fr` par défaut).

**Banque française — `data/quiz_biblique.json`** (source de référence, clés françaises). Objet avec `titre`, `description`, `total_questions` (504) et un tableau `questions` ; chaque question a la forme :

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

**Banque anglaise — `data/quiz_biblique.en.json`.** Même structure, mais avec des clés anglaises en `snake_case` : `book`, `question`, `options`, `correct_answers`, `number_of_correct_answers`, `reference`, `difficulty`. Chaque entrée partage l'`id` de sa contrepartie française, et le nom de livre (`book`) provient de la carte `src/data/bookNames.js` (`BOOK_NAMES_FR_TO_EN`).

## Accessibilité

- **`aria-live="polite"`** — La zone d'annonce du résultat (« Bonne réponse ! … Référence : … ») est montée en permanence dans `QuestionCard`, pour que les lecteurs d'écran lisent l'annonce quand elle apparaît.
- **`aria-pressed`** — En mode réponses multiples, chaque option se comporte comme un bouton bascule ; les bascules de langue et de thème exposent de même l'option active.
- **`aria-disabled`** — Après révélation de la réponse, les options sont marquées `aria-disabled="true"` (et les clics ignorés en JS) plutôt que `disabled`, afin de rester focusables et lisibles par les technologies d'assistance.
- **`role="progressbar"`** — La barre de progression du quiz expose `aria-valuenow` / `aria-valuemin` / `aria-valuemax` et un `aria-label` descriptif.
- **`prefers-color-scheme`** — Le thème **auto** suit la préférence claire/sombre du système ; les bascules de thème/langue utilisent `role="group"` et `aria-pressed`.
- **`prefers-reduced-motion`** — Les animations sont réduites via une media query pour les utilisateurs qui le demandent.
- **`:focus-visible`** — Un contour de focus visible est appliqué à la navigation clavier.
- Les emojis décoratifs sont systématiquement masqués aux lecteurs d'écran avec `aria-hidden="true"`.

## Ajouter des questions

> ⚠️ Les fichiers de données (`data/quiz_biblique.json` et `data/quiz_biblique.en.json`) sont **du contenu produit, édité manuellement uniquement** — aucun outillage automatique ne doit les modifier. Toute nouvelle question doit être ajoutée **dans les deux banques**, en parité.

1. Dans `data/quiz_biblique.json`, ajouter un objet au tableau `questions` en respectant le format français ci-dessus :
   - `id` unique (convention : préfixe du livre + numéro, ex. `gen_041`) ;
   - `options` sans doublons ;
   - `reponses_correctes` : indices valides (entre 0 et `options.length - 1`) ;
   - `nombre_bonnes_reponses` égal à la longueur de `reponses_correctes`.
2. Ajouter l'entrée **anglaise correspondante** dans `data/quiz_biblique.en.json` : **même `id`**, nom de livre (`book`) tiré de `src/data/bookNames.js`, clés `snake_case` (`question`, `correct_answers`, `number_of_correct_answers`…), même nombre d'options et mêmes indices corrects que la version française.
3. Pour un **nouveau livre**, utiliser un nouveau nom dans `livre` (FR) et ajouter la correspondance dans `BOOK_NAMES_FR_TO_EN` (`src/data/bookNames.js`) ; il apparaîtra automatiquement à l'accueil, à sa position d'apparition dans le fichier (garder l'ordre biblique).
4. Lancer `npm run dev` : une validation en mode développement (`src/data/questions.js`) affiche un avertissement en console si `nombre_bonnes_reponses` est incohérent, si des options sont en double ou si un indice de bonne réponse est hors limites (sur les deux banques).
5. Lancer `npm test` : la suite valide notamment l'absence d'avertissement sur les données réelles **et la parité FR ↔ EN** (`src/data/enBankParity.test.js`) — les tests échouent si les deux banques divergent.
