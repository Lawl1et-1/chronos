# CHRONOS

Simulateur d'histoire alternative en 3D.

Faites tourner un globe, choisissez une zone et une époque, découvrez les 5 événements
qui ont façonné cette période, modifiez-en un — et observez une chronologie alternative
diverger de la ligne temporelle réelle.

> Les chronologies alternatives générées sont **spéculatives** et ne constituent pas des faits historiques.

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

- Front : http://localhost:5173
- API : http://localhost:8787 (proxifiée sous `/api` par Vite, `API_PORT` pour changer le port)

| Script | Rôle |
| --- | --- |
| `npm run dev` | front + API en parallèle |
| `npm run build` | vérification TypeScript + build de production |
| `npm run textures` | régénère les textures webp de `public/textures` |

## Structure

```
server/          API Express (clé API côté serveur uniquement)
src/scene/       scène 3D : globe, nuages, atmosphère, étoiles, caméra
src/ui/          interface 2D par-dessus la scène
src/lib/         géographie, chargement des pays et carte d'index
src/data/        époques suggérées par pays (et par région en repli)
src/store/       état global (Zustand)
public/          textures et frontières (TopoJSON)
```

Les pays sont rendus dans une carte d'index équirectangulaire (un octet par pixel) :
elle sert à la fois au survol/clic (lecture directe au point UV touché) et à la mise
en surbrillance dans le shader du globe.

## Statut

1. ✅ Globe + sélection de zone
2. ✅ Timeline + époques
3. Événements clés + monolithes
4. Histoire alternative + branche
5. Polish visuel et transitions

## Crédits

- Textures terrestres : NASA Blue Marble / Black Marble (domaine public), via `three-globe`
- Frontières : Natural Earth via `world-atlas`
