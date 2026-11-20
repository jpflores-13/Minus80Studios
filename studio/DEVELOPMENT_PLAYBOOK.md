# Development Playbook

How a scientific discovery becomes a -80 game. Each stage has an **output** and a **gate** (what must be true before moving on).

## The scientist-to-game workflow

### 1. Scientist interview

- Recruit a researcher. Explain the studio, time commitment (≈2–3 short conversations), and how they'll be credited.
- 45–60 min conversation: What do you study? What surprised you? What do people misunderstand? What would you love the public to _feel_?
- Record (with consent) and get written consent for name and likeness use.
- **Output:** interview notes in the game's `docs/SCIENCE.md`. **Gate:** consent on file.

### 2. Identify phenomena

- List 5–10 phenomena that are surprising, visual, or involve a **trade-off, constraint, or dynamic**. These make good game systems.
- **Output:** a phenomena list with source citations. **Gate:** each item traces to a real source.

### 3. Translate into mechanics

- For each candidate phenomenon ask: _What does the player decide? What is the constraint? What is the feedback?_
- Prefer phenomena that become **verbs** (hunt, divert, mimic) over phenomena that become text.
- Prototype on paper or in a 1-hour code sketch before committing.
- **Output:** a mechanics table in `GAME_DESIGN.md` mapped to `SCIENCE.md`. **Gate:** one core loop chosen.

### 4. Scientific validation

- Send the scientist the mechanics table and planned wording. Ask: _What's accurate? What's misleading? Which simplifications are acceptable?_
- Record each decision as **validated**, **acceptable simplification**, or **rejected**.
- **Output:** a validated-statements table. **Gate:** no unvalidated claim appears in player-facing text.

### 5. Prototype development

- Build the smallest playable version of the core loop with placeholder art (see engineering standards below).
- Time-box it: aim for something playable within 1–2 weeks.
- **Gate:** a stranger can play it for 2 minutes without help.

### 6. Playtesting

- 5 testers per round, a mix of gamers and non-gamers. Observe silently, then debrief (see each game's `PLAYTESTING.md`).
- Track: confusion points, fun moments, session length, and what they remember about the science afterwards.
- **Gate:** the core loop is fun _without_ explanation.

### 7. Accessibility

Checklist for every release:

- [ ] Fully playable by keyboard and by touch
- [ ] No information conveyed by colour alone
- [ ] Text ≥ 20 px at 1280×720 logical resolution, with high contrast
- [ ] `prefers-reduced-motion` respected; no flashing above 3 Hz
- [ ] Sound is never required. Volume and mute controls.
- [ ] Playable on an iPad-size screen

### 8. Visual polish

- Replace placeholders with original or licensed art and audio, and log each in `docs/ASSET_CREDITS.md`.
- Add juice: transitions, particles, sound feedback. Only after the loop is proven fun.

### 9. Publishing

- `npm run build` → static `dist/`. Hosted on GitHub Pages, built by `.github/workflows/pages.yml`.
- Release checklist: version bump + CHANGELOG, credits screen, scientist approval of final text, asset licenses verified, performance check on low-end devices.

### 10. Evaluation and iteration

- Collect: completion rate, session length, playtest feedback, scientist feedback, and (if exhibited) observation notes.
- Hold a short retrospective: what to keep, what to change, what goes into this playbook.

## Engineering standards (all games)

- **Stack:** Phaser 4 + TypeScript (strict) + Vite, Vitest, ESLint, Prettier. Exact-pinned and identical across games.
- **Structure:** `src/{scenes,entities,systems,config,ui,utils}`. Logic in pure, tested `systems/`.
- **Tuning:** every balance number in `src/config/tuning.ts`.
- **Quality gate:** `npm run check` locally, and GitHub Actions CI on every push and PR.
- **Git:** small commits, `main` always playable, feature branches for larger work, no history rewriting on shared branches.
- **Assets and secrets:** original or licensed assets only. No secrets in repos, ever.

## Starting a new game

1. Copy an existing game folder's tooling (everything except `src/`, `docs/`, `tests/`), and copy one of the CI workflows in `.github/workflows/`, changing the folder name.
2. Change name, description, dev port (next free: 8087), and title.
3. Create docs from the existing games' templates, then add the game to `GAME_CATALOG.md`.
