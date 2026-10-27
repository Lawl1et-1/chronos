# CHRONOS

Simulateur d'histoire alternative en 3D.

Faites tourner un globe, choisissez une zone et une époque, découvrez les 5 événements
qui ont façonné cette période, modifiez-en un — et observez une chronologie alternative
diverger de la ligne temporelle réelle.

> Les chronologies alternatives générées sont **spéculatives** et ne constituent pas des faits historiques.

**En ligne : https://lawl1et-1.github.io/chronos/**

## Parcours

1. **Zone** — survolez et cliquez un pays sur le globe (ou cherchez-le), la caméra s'en approche.
2. **Époque** — une spirale du temps entoure le globe : époques suggérées, curseur ou année exacte.
3. **Événements** — l'IA sélectionne les 5 événements déterminants, affichés en monolithes holographiques.
4. **Divergence** — choisissez une modification (proposée ou libre) : le monolithe se brise, la caméra
   recule et la branche alternative se sépare de la ligne réelle, jalon par jalon.

Ensuite :

- **Sous-branches** — chaque jalon d'une chronologie alternative peut être modifié à son tour
  (« Modifier ce jalon ») : une nouvelle branche violette s'en détache, jusqu'à 3 niveaux. L'IA reçoit
  la chronologie parente jusqu'au point de bifurcation.
- **Mode comparaison** — réalité et chronologie alternative côte à côte, jalon par jalon, en suivant
  les branches depuis la racine.
- **Partage** — « Partager » enregistre le scénario terminé et copie un lien `/?s=…` qui le rouvre tel
  quel, sans nouvel appel à l'IA.

`Échap` revient d'une étape à tout moment. Le bouton **FR | EN** en haut à droite change la langue de l'interface et des textes générés par l'IA (la démo existe dans les deux langues). Le son (ambiance et effets, synthétisés dans le navigateur)
est désactivé par défaut : bouton haut-parleur dans un coin de l’écran.

## Stack

- Vite + React + TypeScript
- Three.js (@react-three/fiber, @react-three/drei, @react-three/postprocessing)
- Framer Motion, Zustand, Tailwind
- Backend Express léger (la clé API reste côté serveur)
- IA : Gemini (offre gratuite, par défaut) ou Anthropic, au choix via `LLM_PROVIDER`
- Validation des réponses IA avec Zod

## Installation

```bash
npm install
cp .env.example .env   # renseigner GEMINI_API_KEY (clé gratuite sur Google AI Studio)
npm run dev
```

Pour essayer sans clé API, mettez `CHRONOS_MOCK=1` dans `.env`.

- Front : http://localhost:5173
- API : http://localhost:8787 (proxifiée sous `/api` par Vite, `API_PORT` pour changer le port)

| Script | Rôle |
| --- | --- |
| `npm run dev` | front + API en parallèle |
| `npm run build` | vérification TypeScript + build de production |
| `npm start` | build puis serveur unique (front + API) sur `API_PORT` |
| `npm run textures` | régénère les textures webp de `public/textures` |

### Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `LLM_PROVIDER` | `gemini` (par défaut) ou `anthropic` |
| `GEMINI_API_KEY` | clé Gemini, gratuite sur [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | modèle principal (`gemini-3.5-flash-lite` par défaut : rapide et inclus dans l'offre gratuite) |
| `GEMINI_FALLBACK_MODELS` | modèles essayés ensuite si le principal est saturé (503), hors quota (429) ou trop lent |
| `GEMINI_TIMEOUT_MS` | délai au-delà duquel on passe au modèle suivant (90 s par défaut) |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | clé et modèle si `LLM_PROVIDER=anthropic` |
| `ANTHROPIC_EFFORT` | effort de raisonnement (`low` … `max`, `medium` par défaut) |
| `ANTHROPIC_FALLBACKS` | repli côté serveur en cas de refus ; `off` pour les modèles qui ne le gèrent pas |
| `CHRONOS_MOCK` | `1` = données de démonstration (Allemagne, 1939, invasion de la Pologne), sans clé ni appel à l'IA |
| `API_PORT` | port du serveur API (8787 par défaut) |
| `CHRONOS_SHARE_DIR` | dossier des liens de partage (`data/shares` par défaut) |

## API

`POST /api/key-events` — `{ zone: { name, iso, lat, lon }, year }` → les 5 événements déterminants
de la période. La réponse du modèle est contrainte par un schéma JSON (dérivé des schémas Zod), puis validée avec Zod
(5 événements, scores de 1 à 10, 3 modifications chacun) ; en cas d'échec, l'appel est relancé
avec les erreurs de validation. Les résultats sont mis en cache en mémoire côté serveur et dans
le `localStorage` côté client.

`POST /api/alternate-history` — `{ zone, year, event, alteration }` → la chronologie alternative,
en flux SSE :

| Événement | Contenu |
| --- | --- |
| `partial` | ce qui est déjà complet : point de divergence, maillons de l'effet papillon, jalons |
| `reset` | la réponse précédente était invalide, une nouvelle tentative commence |
| `result` | la chronologie complète et validée (8 à 12 jalons chronologiques, confiance décroissante, 2025 au plus tard) |
| `error` | `{ error, code }` |

Le serveur lit le JSON au fil de l'écriture et n'envoie que les éléments terminés. Pour une
sous-branche, la requête ajoute `history` : les chronologies parentes, coupées à chaque bifurcation.

`POST /api/share` — le scénario terminé (événements, branches) → `{ id }`.
`GET /api/share/:id` — le scénario enregistré. Les liens sont stockés en fichiers JSON dans
`data/shares` (`CHRONOS_SHARE_DIR` pour changer de dossier).

## Structure

```
server/          API Express (clé API côté serveur uniquement)
  providers/     Gemini et Anthropic derrière une même interface
  prompts/       prompts système
  routes/        routes de l'API
  mock/          données de démonstration
shared/          code commun au client et au serveur : schémas Zod, prompts, démo, appels Gemini
src/api/         appels à l'API, cache local et moteur IA du navigateur (version statique)
src/audio/       ambiance et effets sonores (Web Audio, sans fichiers)
src/scene/       scène 3D : globe, nuages, atmosphère, étoiles, spirale, monolithes, caméra
src/ui/          interface 2D par-dessus la scène
src/lib/         géographie, chargement des pays et carte d'index
src/data/        époques suggérées par pays (et par région en repli)
src/store/       état global (Zustand)
public/          textures et frontières (TopoJSON)
```

## Rendu et performances

- Une seule passe pour toutes les frontières, un seul nuage de points pour les étoiles et les éclats.
- Textures compressées en webp, chargées en basse résolution puis remplacées par la haute résolution.
- La résolution de rendu s'adapte à la machine (baisse si le framerate chute, remonte ensuite).
- `prefers-reduced-motion` est respecté : déplacements de caméra courts, sans rotation automatique ni
  effets de transition.

Les pays sont rendus dans une carte d'index équirectangulaire (un octet par pixel) :
elle sert à la fois au survol/clic (lecture directe au point UV touché) et à la mise
en surbrillance dans le shader du globe.

## Statut

1. ✅ Globe + sélection de zone
2. ✅ Timeline + époques
3. ✅ Événements clés + monolithes
4. ✅ Histoire alternative + branche
5. ✅ Polish visuel et transitions

## Fonctionnalités bonus

- ✅ Partage d'une chronologie par URL
- ✅ Mode comparaison réalité / alternative
- ✅ Branches de branches (arbre 3D)

## Version en ligne (GitHub Pages)

GitHub Pages ne sert que des fichiers statiques : la version en ligne n'a donc pas de serveur.

- **L'IA passe par un petit proxy** (Cloudflare Worker, dossier `worker/`) qui garde la clé Gemini
  en secret : les visiteurs n'ont rien à configurer. Le proxy n'accepte que l'adresse du site, les
  modèles autorisés et les appels de génération. Un navigateur peut aussi utiliser sa propre clé
  (`Maj + K`), qui ne quitte pas ce navigateur.
- **Les liens de partage** contiennent le scénario compressé dans l'URL (`#s=…`) au lieu d'être
  stockés sur un serveur.

Le déploiement est automatique à chaque push sur `main` (`.github/workflows/pages.yml`). Le proxy se
déploie à part : `cd worker && npx wrangler deploy`, puis `npx wrangler secret put GEMINI_API_KEY`. Pour
construire la version statique en local :

```bash
PAGES_BASE=/chronos/ VITE_STATIC=1 npm run build:pages
```

## Offre gratuite Gemini

- Les limites (requêtes par minute et par jour) dépendent du projet Google : consultez-les dans
  AI Studio. Une partie se joue d'un clic : 1 appel pour les 5 événements, 1 par branche.
- Sur l'offre gratuite, Google peut utiliser les requêtes pour améliorer ses produits.
- Les modèles les plus demandés peuvent être saturés : le serveur bascule alors automatiquement sur
  le modèle suivant de `GEMINI_FALLBACK_MODELS`.

## Crédits

- Textures terrestres : NASA Blue Marble / Black Marble (domaine public), via `three-globe`
- Frontières : Natural Earth via `world-atlas`
