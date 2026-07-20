# Daily — PWA sport/nutrition/habitudes (Phase 1)

## Contexte

App personnelle (usage strictement solo, pas de multi-user) de suivi sport, courses et habitudes, installable sur iPhone via "Ajouter à l'écran d'accueil". Mobile-first, dark mode par défaut.

Phase 1 = scaffold + CRUD de base. Whoop et Calendar (Phase 2/3) ne sont pas construits — seulement deux boutons désactivés en placeholder sur `/settings`.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (`@supabase/supabase-js`, clé anon publique)
- Déploiement cible : Vercel (compte existant)
- PWA : manifest + service worker écrits à la main (pas de lib `next-pwa`)

## Décisions d'architecture

- **Composants 100% Client Components.** Pas de Server Components/Server Actions. Le client Supabase JS est appelé directement depuis les hooks React dans les composants. Choix fait pour rester simple sur un projet solo, cohérent avec le PIN gate côté client.
- **Streaks calculés à la volée** depuis `habit_logs` (pas de colonne streak stockée) : en partant d'aujourd'hui, on remonte jour par jour tant que `completed = true`.
- **PIN gate** : composant client qui enveloppe `app/layout.tsx`. Le PIN attendu vient de `NEXT_PUBLIC_APP_PIN` (variable d'env publique). Une fois saisi correctement, un flag est posé dans `localStorage` ; le flag est revérifié à chaque chargement de l'app (pas d'expiration de session en Phase 1).

### Compromis sécurité (accepté)

Le PIN protège l'accès à l'interface, pas l'API Supabase : la clé anon et l'URL Supabase sont visibles dans le bundle JS envoyé au navigateur, donc quelqu'un qui les extrairait pourrait interroger l'API directement sans passer par le PIN. Acceptable pour un usage strictement personnel où l'app n'est pas annoncée publiquement. Non révisé en Phase 1 ; à reconsidérer si l'app devient plus sensible (RLS restrictives ou vérif PIN serveur).

## Structure du projet

```
app-tracker/
├── app/
│   ├── layout.tsx          # PIN gate + BottomNav + meta tags PWA (iOS)
│   ├── page.tsx             # accueil
│   ├── sport/page.tsx
│   ├── food/page.tsx
│   ├── habits/page.tsx
│   └── settings/page.tsx
├── components/
│   ├── PinGate.tsx
│   ├── BottomNav.tsx
│   ├── DateHeader.tsx
│   ├── SportCard.tsx
│   ├── FoodCard.tsx
│   ├── HabitsRow.tsx
│   ├── UndoToast.tsx
│   └── ui/                  # Card, Checkbox, Button, etc.
├── lib/
│   └── supabase.ts          # client unique, clé anon
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/               # 192, 512, apple-touch-icon (180)
└── supabase/
    └── migrations/
        └── 0001_init.sql    # tables + seed du split sport
```

## Design visuel

### Palette (tokens sémantiques Tailwind, pas de hex bruts dans les composants)

| Token | Valeur | Usage |
|---|---|---|
| `background` | `#1c1917` (stone-950) | fond de page |
| `surface` | `#262220` | cartes |
| `surface-border` | `#3a3532` | bordures / séparateurs |
| `text-primary` | `#fafaf9` | texte principal |
| `text-secondary` | `#a8a29e` | texte secondaire, labels |
| `accent` | `#7c9885` (sauge) | boutons primaires, états actifs, streaks |
| `accent-foreground` | `#1c1917` | texte sur fond `accent` (contraste — jamais de texte blanc sur sauge) |

Cartes `rounded-2xl`, bordure `surface-border` 1px. Mobile-first, max-width mobile centré, pas de sidebar desktop en Phase 1.

### Navigation

Bottom tab bar fixe et persistante (5 items = Accueil, Sport, Food, Habits, Settings), icônes SVG (`lucide-react`, pas d'emoji) + label texte, état actif en `accent`. Padding bas `env(safe-area-inset-bottom)` pour la zone de la barre d'accueil iPhone (critique en mode standalone PWA, pas de chrome navigateur). Rendu dans `app/layout.tsx` via `BottomNav.tsx`, visible sur toutes les pages sauf l'écran PIN.

### Détails UX

- **Tactile** : toutes les checkboxes (exercices, habitudes, courses) ont une zone de tap ≥44×44px même si le carré visuel est plus petit ; feedback visuel (scale 0.95 au press, retour à 1 au relâchement)
- **Formulaires sport** : labels visibles (pas de placeholder-only) pour charge/reps/RPE/notes ; `inputmode="numeric"` sur les champs numériques ; validation au blur ; chiffres en `tabular-nums`
- **Suppression courses** : pas de suppression instantanée — toast "Supprimé — Annuler" affiché 3-5s avant suppression définitive
- **Animations** : micro-interactions 150-300ms, `ease-out`, uniquement sur `transform`/`opacity` (jamais `width`/`height`), respect de `prefers-reduced-motion`
- **États de sauvegarde** : bouton/champ désactivé pendant l'appel Supabase asynchrone, retour visuel bref (icône check) une fois la sauvegarde confirmée

## PWA

- `manifest.json` : `name: "Daily"`, `short_name: "Daily"`, `display: "standalone"`, `theme_color`/`background_color` en anthracite, icônes 192/512
- Meta tags iOS dans `app/layout.tsx` : `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`, `viewport` avec `viewport-fit=cover`
- Service worker minimal (`public/sw.js`), enregistré depuis un petit script client : cache-first pour les assets statiques (JS/CSS/icônes), network-first pour la navigation. Pas d'offline complet en Phase 1.
- Icônes générées simplement (fond anthracite + glyphe couleur accent), remplaçables plus tard par de vrais assets.

## Modèle de données Supabase

```sql
workouts (id, day_of_week, name, exercises jsonb)
workout_logs (id, date, workout_id, exercise, sets, reps, weight, rpe, notes, completed)
groceries (id, item, category, checked, created_at)
habits (id, name, icon, created_at)
habit_logs (id, habit_id, date, completed)
```

Seed de `workouts` (id = jour de la semaine, `exercises` = jsonb listant les exercices avec leur schéma sets/reps par défaut) :

- Lundi — Legs Force : Back squat 4x5, Bulgarian split squat 3x8/jambe, Nordic curl 3x6, Tibialis raises + Copenhagen plank (superset x3)
- Mardi — Pull + Kettlebell : Tractions lestées 5x5, KB swings 4x15, Rowing barre/KB 3x8, Face pulls + leg raises (superset x3)
- Mercredi — Legs Athlétisme : RDL unilatéral/trap bar deadlift 3x6, Box jumps 4x5, Lateral lunges 3x10/côté, Calf raises + mobilité cheville (superset x3)
- Jeudi — Push (Dips) + KB : Dips lestés 5x5, KB clean & press 4x8/côté, Pompes archer/développé militaire 3x10, Ab wheel/hollow body
- Vendredi — Full body + sprints : KB complex x5 tours, Superset tractions/dips x4, Sprints 6x100m ou côte 8x20s
- Samedi — Course ou sport random (libre, pas de structure fixe, `exercises` vide ou texte libre)
- Dimanche — Repos (`exercises` vide)

RLS : désactivée en Phase 1 (cohérent avec le compromis sécurité ci-dessus — usage solo, clé anon, pas d'auth multi-user).

## Pages

### `/` (accueil)
- Header : date du jour formatée en français (ex. "lundi 20 juillet 2026")
- Carte Sport : nom du workout du jour (lookup `workouts` par `day_of_week`), bouton "Démarrer" → `/sport?day=<today>`
- Carte Food : 3-4 items non cochés de `groceries` (les plus récents), champ + bouton d'ajout rapide (insert direct, catégorie par défaut "Autre")
- Rangée Habits : checkboxes des habitudes du jour (toggle `habit_logs` upsert par `habit_id` + date du jour), streak affiché à côté de chaque habitude

### `/sport`
- Vue semaine : 7 jours (lun-dim) en rangée horizontale scrollable, jour actif surligné en `accent`
- Détail du jour sélectionné : liste des exercices du `exercises` jsonb du workout du jour, chaque exercice = case à cocher (`completed`) + champs charge/reps/RPE/notes
- Sauvegarde : upsert dans `workout_logs` (une ligne par exercice par date) au blur de chaque champ ou au toggle de la case

### `/food`
- Liste des `groceries` groupée visuellement par `category`
- Ajout (input + bouton), suppression (swipe ou bouton croix), coché (checkbox qui met à jour `checked`)
- Pas de tri ni de filtre avancé en Phase 1

### `/habits`
- Liste des `habits`, check du jour par habitude (upsert `habit_logs`)
- Streak par habitude : calculé à la volée en remontant les jours consécutifs `completed = true` depuis aujourd'hui

### `/settings`
- Deux boutons désactivés : "Connecter Whoop", "Connecter Calendar" (placeholder visuel, pas de logique)

## Hors scope Phase 1

Intégration Whoop, intégration Calendar, vraie table `settings`, offline complet, notifications push, vraie authentification multi-user.

## Setup externe requis (à faire par l'utilisateur, guidé étape par étape)

1. Créer un nouveau projet dans le compte Supabase existant → récupérer `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Exécuter la migration `0001_init.sql` dans l'éditeur SQL Supabase
3. Définir `NEXT_PUBLIC_APP_PIN` en local (`.env.local`) et sur Vercel (env var du projet)
4. Créer un nouveau projet dans le compte Vercel existant, lier ce repo, ajouter les 3 env vars ci-dessus, déployer
5. Sur iPhone : ouvrir l'URL Vercel dans Safari → "Partager" → "Sur l'écran d'accueil"
