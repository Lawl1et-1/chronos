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

## Statut

En cours de construction — étapes :

1. Globe + sélection de zone
2. Timeline + époques
3. Événements clés + monolithes
4. Histoire alternative + branche
5. Polish visuel et transitions
