# Crown Horde

Original browser game: a crowned monarch and a ring of royal bowmen hold a meadow against a rust-iron horde.

**Not affiliated with Century Games, Kingshot, or any store listing.** Art, names, and code are original. Mood references were used only for camera angle and “king + bowmen vs waves” fantasy — no cloned assets, logos, or branding.

Play locally:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## How to play

- Move with the on-screen stick (touch) or WASD / arrow keys (desktop).
- Bowmen auto-fire at anything inside the white ring. Keep the crown alive.
- Coins drop on kills. Spend them on **Recruit bowman** or **Sharpen arrows** (HUD buttons or the stone pads at camp).

Game over when crown HP hits 0. Rise Again to restart.

## Stack

Vite + Three.js (TypeScript). Procedural low-poly meshes — no third-party character packs.

## Deploy

Static SPA. Vercel: import this GitHub repo, framework preset Vite, output `dist`.
