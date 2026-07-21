# Daily — Phase 2A : Connecteur Whoop

## Contexte

Premier sous-projet de la Phase 2 de "Daily" (PWA perso sport/nutrition/habitudes, déployée sur https://daily-eight-pi.vercel.app). La Phase 1 est en production. La Phase 2 est découpée en 4 sous-projets : **A. Connecteur Whoop** (ce spec), B. Mémoire sport, C. Dashboard + Goals, D. Meal prep. Chaque sous-projet a son propre cycle spec → plan → implémentation.

Objectif de A : connecter le compte Whoop de l'utilisateur via OAuth et afficher recovery, sommeil et strain du jour sur l'accueil.

## Pré-requis externes (faits ou à faire par l'utilisateur)

- ✅ App OAuth créée sur developer.whoop.com avec redirect URLs `https://daily-eight-pi.vercel.app/api/whoop/callback` (+ `http://localhost:3000/api/whoop/callback` si accepté) et scopes `read:recovery`, `read:sleep`, `read:cycles`, `read:workout`
- ✅ Client ID : `1fbdb943-69e0-43ab-a119-319460ecaa18`
- Client Secret : détenu par l'utilisateur, à saisir lui-même dans Vercel (jamais collé dans le code ni transmis en clair)
- À faire au déploiement : ajouter 4 variables d'env sur Vercel (voir section Variables d'environnement)

## Architecture

Premier morceau de l'app nécessitant du code serveur : le `client_secret` Whoop et la clé `service_role` Supabase ne doivent jamais atteindre le navigateur. Trois route handlers Next.js (App Router, `app/api/whoop/*/route.ts`) :

### `GET /api/whoop/connect`
Construit l'URL d'autorisation Whoop (`https://api.prod.whoop.com/oauth/oauth2/auth`) avec `client_id`, `redirect_uri` (= `${NEXT_PUBLIC_APP_URL}/api/whoop/callback`), `response_type=code`, les scopes ci-dessus et un paramètre `state` aléatoire (posé aussi en cookie httpOnly pour vérification CSRF au retour). Redirige (302) vers cette URL.

### `GET /api/whoop/callback`
- Vérifie que `state` (query) correspond au cookie posé par `/connect` ; sinon 400.
- Échange le `code` contre les tokens via `POST https://api.prod.whoop.com/oauth/oauth2/token` (grant_type `authorization_code`, avec client_id + client_secret).
- Upsert le résultat dans la table `whoop_tokens` (une seule ligne, id fixe) : `access_token`, `refresh_token`, `expires_at` (calculé depuis `expires_in`).
- Redirige vers `/settings?whoop=connected` (ou `/settings?whoop=error` en cas d'échec, avec log serveur de l'erreur).

### `GET /api/whoop/summary`
Appelée par le client (accueil et settings). Logique :
1. Lit la ligne `whoop_tokens` via le client Supabase admin (service_role). Absente → `{ connected: false }` (200).
2. Si `expires_at` proche/dépassé (marge 60 s) → refresh via `POST .../token` (grant_type `refresh_token`), upsert des nouveaux tokens. Échec du refresh (token révoqué) → supprime la ligne, renvoie `{ connected: false }`.
3. Appelle l'API Whoop v2 : recovery du jour (`GET /developer/v2/recovery?limit=1`), sommeil de la nuit (`GET /developer/v2/activity/sleep?limit=1`), cycle courant (`GET /developer/v2/cycle?limit=1`) pour le strain.
4. Renvoie un JSON compact :

```ts
{
  connected: true,
  recovery: number | null,        // % score (ex. 67)
  sleep: {
    durationMinutes: number,      // temps dormi
    performance: number           // % score
  } | null,
  strain: number | null           // day strain du cycle courant (ex. 12.4)
}
```

Chaque bloc est `null` si l'appel Whoop correspondant échoue ou ne renvoie rien (les autres blocs restent servis) ; les erreurs sont loggées côté serveur. Réponse avec `Cache-Control: no-store`.

## Stockage des tokens — sécurité

Les tokens Whoop donnent accès à des données de santé : ils ne doivent PAS être lisibles avec la clé anon publique (contrairement aux autres tables de l'app, tradeoff Phase 1 accepté pour des données peu sensibles).

Migration `0002_whoop.sql` :

```sql
create table whoop_tokens (
  id integer primary key default 1 check (id = 1),  -- singleton : une seule ligne
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table whoop_tokens enable row level security;
-- Aucune policy créée : avec RLS activée et zéro policy, la clé anon ne peut
-- ni lire ni écrire. Seul le client service_role (server-only) y accède.
```

Un second client Supabase, `lib/supabase-admin.ts`, construit avec `SUPABASE_SERVICE_ROLE_KEY` — importé UNIQUEMENT depuis les route handlers (jamais depuis un composant). Les tables Phase 1 et leur client anon existant ne changent pas.

## UI

### `/settings`
- Le bouton "Connecter Whoop" devient actif : lien vers `/api/whoop/connect`.
- Au chargement, la page appelle `/api/whoop/summary` : si `connected: true`, le bouton devient un état "Whoop connecté ✓" (style accent) avec un bouton secondaire "Déconnecter" qui appelle `POST /api/whoop/disconnect` (4e route, minime : supprime la ligne `whoop_tokens` via le client admin, renvoie 204).
- Les query params `?whoop=connected` / `?whoop=error` affichent un message de confirmation/erreur discret.
- Le bouton "Connecter Calendar" reste désactivé (Phase 3).

### Accueil — `components/WhoopCard.tsx`
Carte en haut de l'accueil (au-dessus de la carte Sport), Client Component appelant `/api/whoop/summary` :
- **Connecté** : trois métriques sur une rangée —
  - Recovery : `67 %` coloré par zone (≥ 67 : vert `#7c9885` — l'accent ; 34–66 : jaune ambre ; < 34 : rouge doux). Libellé "Récupération".
  - Sommeil : durée `7h32` + performance `85 %`. Libellé "Sommeil".
  - Strain : `12.4`. Libellé "Strain".
  - Métrique à `null` → tiret `—` à sa place.
- **Non connecté** (`connected: false`) : la carte affiche un texte discret "Whoop non connecté" + lien vers `/settings`. Pas d'erreur intrusive.
- **Chargement** : squelette/『Chargement…』 comme les autres cartes.
- Erreur réseau de `/api/whoop/summary` : même rendu que non connecté + `console.error` (pattern d'error logging du projet).

## Variables d'environnement

| Variable | Portée | Valeur |
|---|---|---|
| `WHOOP_CLIENT_ID` | serveur | `1fbdb943-69e0-43ab-a119-319460ecaa18` |
| `WHOOP_CLIENT_SECRET` | serveur | saisi par l'utilisateur dans Vercel uniquement |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur | dashboard Supabase → Project Settings → API → service_role |
| `NEXT_PUBLIC_APP_URL` | publique | `https://daily-eight-pi.vercel.app` (local : `http://localhost:3000`) |

`.env.local.example` mis à jour avec les 4 nouvelles entrées. Aucun secret committé.

## Tests

- `lib/whoop.ts` : les fonctions pures (construction de l'URL d'autorisation, calcul d'`expires_at`, décision "faut-il rafraîchir ?", mapping des réponses API Whoop → forme compacte du summary) sont extraites et testées avec Vitest (TDD, comme `lib/date.ts`/`lib/streak.ts`).
- Les route handlers eux-mêmes : vérification manuelle de bout en bout (flux OAuth réel contre l'API Whoop), pas de mocks d'intégration — cohérent avec l'approche Phase 1.

## Hors scope (sous-projet A)

Webhooks Whoop, historique 7 jours, page Whoop dédiée, écriture vers Whoop, auto-validation du goal "sport" depuis les workouts Whoop (ira dans le sous-projet C), connecteur Calendar (Phase 3).

## Risques connus

- L'API Whoop v2 impose des rate limits généreux pour un usage solo — pas de cache serveur nécessaire en A ; si ça devenait un problème, un cache 5 min dans `whoop_tokens.updated_at` suffirait (noté, non implémenté).
- Si Whoop a refusé le redirect `http://localhost:3000`, le flux OAuth n'est testable qu'en production — le plan d'implémentation doit prévoir la vérification finale sur l'URL Vercel.
