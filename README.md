# Minus 80 Studios

**Short indie games where science is the mechanic.** Browser-playable games inspired by real research.

| Folder                               | What it is                                                                                     | Dev port |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- | -------- |
| [`studio/`](studio/)                 | Studio vision, development playbook, game catalog, roadmap, branding                           | —        |
| [`snail-assassin/`](snail-assassin/) | **Snail Assassin**: underwater stealth hunting as venomous cone snails                         | 8081     |
| [`downstream/`](downstream/)         | **Downstream!**: a watershed strategy puzzle about stopping litter before it reaches the ocean | 8082     |
| [`off-target/`](off-target/)         | **OFF TARGET.**: a retro arcade rescue platformer                                              | 8084     |
| [`dr-anti-crispr/`](dr-anti-crispr/) | **DR. ANTI-CRISPR**: a portrait arcade survival shooter                                        | 8085     |
| [`starstruck/`](starstruck/)         | **STARSTRUCK.**: sensory exploration arcade (prototype)                                        | 8083     |
| [`heist/`](heist/)                   | **HEIST.**: a stealth-action puzzle game (prototype)                                           | 8086     |
| [`ridgerunner/`](ridgerunner/)       | **RIDGERUNNER.**: exploration and survival as a salamander crossing watersheds                | 8088     |
| [`queenless/`](queenless/)           | **QUEENLESS**: a bumble bee colony reorganizes itself after its queen is gone                  | 8087     |

Each game is an independent Phaser 4 + TypeScript + Vite project:

```bash
cd snail-assassin   # or another game folder
npm install
npm run dev         # play locally
npm run check       # typecheck, lint, format, tests
npm run build       # static files in dist/
```

Open `Minus80Studios.code-workspace` in VS Code for the multi-folder workspace. See [CONTRIBUTING.md](CONTRIBUTING.md) for the house rules.

**Play the latest builds:** https://jpflores-13.github.io/Minus80Studios/

_Inspired by real discoveries. Gameplay simplifies the science for play; see each game's `docs/SCIENCE.md`._

## License

© 2026 Minus 80 Studios. All rights reserved. This repository is public so the games can be
played and the work can be shared, but the code, art, writing, and branding are not licensed for
reuse. See [LICENSE](LICENSE) for details.
