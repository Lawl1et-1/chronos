# CHRONOS

Simulateur d'histoire alternative en 3D.

Faites tourner un globe, choisissez une zone et une époque, découvrez les 5 événements
qui ont façonné cette période, modifiez-en un — et observez une chronologie alternative
diverger de la ligne temporelle réelle.

> Les chronologies alternatives générées sont **spéculatives** et ne constituent pas des faits historiques.

## Parcours

1. **Zone** — survolez et cliquez un pays sur le globe (ou cherchez-le), la caméra s'en approche.
2. **Époque** — une spirale du temps entoure le globe : époques suggérées, curseur ou année exacte.
3. **Événements** — l'IA sélectionne les 5 événements déterminants, affichés en monolithes holographiques.
4. **Divergence** — choisissez une modification (proposée ou libre) : le monolithe se brise, la caméra
   recule et la branche alternative se sépare de la ligne réelle, jalon par jalon.

`Échap` revient d'une étape à tout moment. Le son (ambiance et effets, synthétisés dans le navigateur)
est désactivé par défaut : bouton haut-parleur dans un coin de l’écran.

## Stack

- Vite + React + TypeScript
- Three.js (@react-three/fiber, @react-three/drei, @react-three/postprocessing)
- Framer Motion, Zustand, Tailwind
- Backend Express léger (la clé API reste côté serveur)
- Validation des réponses IA avec Zod

## Installation

```bash
npm install
cp .env.example .env   # renseigner ANTHROPIC_API_KEY et ANTHROPIC_MODEL
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
| `ANTHROPIC_API_KEY` | clé API, lue uniquement par le serveur |
| `ANTHROPIC_MODEL` | identifiant du modèle à utiliser |
| `ANTHROPIC_EFFORT` | effort de raisonnement (`low` … `max`, `medium` par défaut ; vide = valeur du fournisseur) |
| `ANTHROPIC_FALLBACKS` | repli automatique côté serveur en cas de refus ; `off` pour les modèles qui ne le gèrent pas |
| `CHRONOS_MOCK` | `1` = données de démonstration (Allemagne, 1939, invasion de la Pologne), sans clé ni appel à l'IA |
| `API_PORT` | port du serveur API (8787 par défaut) |

## API

`POST /api/key-events` — `{ zone: { name, iso, lat, lon }, year }` → les 5 événements déterminants
de la période. La réponse du modèle est contrainte par un schéma JSON, puis validée avec Zod
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

Le serveur lit le JSON au fil de l'écriture et n'envoie que les éléments terminés.

## Structure

```
server/          API Express (clé API côté serveur uniquement)
  prompts/       prompts système
  routes/        routes de l'API
  mock/          données de démonstration
shared/          schémas Zod communs au client et au serveur
src/api/         appels à l'API et cache local
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

## Crédits

- Textures terrestres : NASA Blue Marble / Black Marble (domaine public), via `three-globe`
- Frontières : Natural Earth via `world-atlas`
