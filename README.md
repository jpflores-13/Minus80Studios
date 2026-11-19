# Minus 80 Studio

**Short indie games where science is the mechanic.** Browser-playable games inspired by real research.

| Folder | What it is | Dev port |
|---|---|---|
| [`studio/`](studio/) | Studio vision, development playbook, game catalog, roadmap, branding | — |
| [`snail-assassin/`](snail-assassin/) | **Snail Assassin**: underwater stealth hunting as venomous cone snails | 8081 |
| [`downstream/`](downstream/) | **Downstream!**: a watershed strategy puzzle about stopping litter before it reaches the ocean | 8082 |

Each game is an independent Phaser 4 + TypeScript + Vite project:

```bash
cd snail-assassin   # or downstream
npm install
npm run dev         # play locally
npm run check       # typecheck, lint, format, tests
npm run build       # static files in dist/
```

Open `Minus80Studio.code-workspace` in VS Code for the multi-folder workspace.

*Inspired by real discoveries. Gameplay simplifies the science for play; see each game's `docs/SCIENCE.md`.*
