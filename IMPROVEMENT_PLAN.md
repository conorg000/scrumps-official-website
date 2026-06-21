# The Scrumps — Experience Upgrade Plan

How to make the immersive site **WAY** better in design and gameplay, grounded in the
current codebase (vanilla-JS canvas engine + React UI wrapper).

## 0. The strategic reframe: it's a band site wearing a game costume

The game is genuinely fun and ~80% feature-complete. The biggest gap isn't the game —
it's that **this is The Scrumps' official website and it currently does none of the jobs a
band site must do**. Collecting the 4 CDs is thematic but plays no music; there are no
links to streaming, shows, merch, or socials; nothing is shareable.

Fix that *diegetically*: every band-marketing job should be an in-world reward. This is the
highest-leverage work and it's woven through the phases below.

---

## Phase 1 — "Juice": game feel (highest ratio of impact to effort)

The mechanics work but feel flat. Add the polish that makes a 2D game feel alive. None of
this requires new content.

- **Player walk cycle + squash/stretch.** Currently a static shape that flips by direction.
  Add 2–4 frame bob/waddle while `isMoving`, and a tiny squash on arrival at a tile.
- **Tap-to-path movement.** Today movement is one tile per keypress. Add click/tap a tile →
  A* pathfind there. Massive mobile UX win; the joystick stays for free-roam.
- **Camera life.** Easing on scene entry, a subtle idle sway, and screen-shake on impacts
  (boxing hits, the pool jump, the turkey).
- **Particles + transitions.** Dust on footsteps, sparkle on pickups, beer fizz on the
  pyramid, a wipe/iris transition between rooms instead of hard scene swaps.
- **Interaction feedback.** Floating "!" over interactables in range, a soft outline/glow
  on the focused object, and a pickup pop + SFX. Right now the only cue is a button appearing.
- **Sound design.** Per-area ambience (backyard birds, downstairs hum, rooftop city), SFX
  for footsteps/pickups/dialog blips/punches, and music ducking during dialog.

## Phase 2 — Visual / art-direction overhaul

The procedural pixel art is consistent but reads as "programmer art." Two routes:

- **Route A (recommended): sprite-sheet pipeline.** Add a tiny asset loader + `drawImage`
  path to the engine (it currently draws zero images despite assets existing). Replace the
  hero props — Scrump, Mr Tibbles, Adele, the turkey — with real sprite sheets while keeping
  procedural tiles for set dressing. Biggest visible jump in quality per hour.
- **Route B: level up the procedural look.** Keep `fillRect` but add a real palette with
  ambient occlusion (darken tile edges), drop shadows that scale with elevation, a day→dusk
  color grade as the story progresses (matches the "sunset balcony" beat), and animated
  details (flickering screens, swaying plants, drifting clouds).
- **Cohesive UI skin.** Dialog, buttons, and the loading screen should share one band-brand
  treatment (CRT/VHS scanlines, the Scrumps logo, a consistent type pairing). Today the UI
  reads as generic.
- **A real title screen.** Logo, "Press Start," music playing, social links in the corner —
  the first thing a fan/label sees should sell the band, then drop into the game.

## Phase 3 — Gameplay depth

One verb (walk-up → context button) gets repetitive. Add light systems that reward
exploration without bloating scope.

- **Real inventory + quest log.** `InventoryUI.tsx` is a 40-line stub. Make a proper
  tray (CDs, cans, compost, x-ray, ladder) plus a collapsible objectives list so players
  always know the next goal. Cuts the "what do I do now?" dead-ends in the current flow.
- **Inspect-everything payoff.** The design doc's core promise is "most items reveal funny
  dialog." Audit each room and ensure every prop has a gag. Cheap, high on-brand returns.
- **Boxing minigame rework.** Currently HP + a button. Add telegraphed turkey wind-ups,
  a dodge + counter-punch timing window, 3 rounds, and combo/`PERFECT` feedback. Make the
  one combat beat actually satisfying.
- **A collectibles meta-layer.** A "fridge magnet board" or sticker book that fills in as
  you find things — gives completionists a reason to sweep every room and a natural share
  moment at 100%.
- **Save/continue + a tracked completion %.** Confirm state persists across the full arc
  (partial localStorage exists) and surface progress on the title screen.

## Phase 4 — Band-website integration (the unique value)

Make the site *work for the band*, all in-world:

- **CDs actually play songs.** Picking up each CD unlocks that track on a diegetic boombox/
  jukebox (downstairs band gear is the obvious home). Collecting all 4 = full EP unlocked +
  a "listen on Spotify/Apple/Bandcamp" panel.
- **Diegetic links hub.** A backyard noticeboard / band poster wall = tour dates, merch,
  socials, mailing-list signup. A flyer prop on the porch can deep-link to ticketing.
- **Shareability.** "I escaped the inspection — play The Scrumps' site" share card with an
  OG image, plus a screenshot/share button at the ending. Free top-of-funnel.
- **Email capture, in-character.** Mr Feng or the clown asks for your email "for the next
  party / next show." Routes fans to the list without breaking immersion.
- **SEO/meta/analytics.** Real `<title>`, OG/Twitter cards, favicon, and lightweight
  event analytics (which songs get played, where players drop off) so the band learns from it.

## Phase 5 — Technical health (the enabler)

Required to build Phases 1–4 without the code collapsing under its own weight.

- **Tame the GameCanvas monolith.** ~50 `nearX`/`atX` booleans drive interactions. Replace
  with a generic `interactables` registry (each prop declares position + verb + handler) and
  a single proximity scan. This is the unlock for "add content fast."
- **Centralize game state.** Hoist the scattered `useState` flags into one reducer/state
  object so save/load, the quest log, and progress % all read from one source of truth.
- **A scene/room base class.** The room files (`room.js`, `balcony.js`, …) duplicate a lot.
  A shared `Scene` base with `enter/update/draw/exits` cuts duplication and makes new areas
  cheap.
- **Asset loader + preload in the loading screen** (pairs with Phase 2 Route A) so sprites/
  audio are warm before play.
- **Mobile + perf pass.** Cap/scale the canvas by DPI, verify touch targets and the joystick
  across scenes, and test on a low-end phone — it's a mobile-first brief.

---

## Recommended sequencing

1. **Phase 1 (juice) + the Phase-5 interactables refactor** — fast, dramatic, and the
   refactor de-risks everything after. ~the first sprint.
2. **Phase 4 (band integration)** — make the site earn its keep: playable songs + links +
   share. Highest business value.
3. **Phase 2 (art)** — the big visual leap once the foundation is clean.
4. **Phase 3 (depth)** — boxing rework, inventory/quest log, completion meta.

Everything is scoped to the existing stack — no rewrite, no new framework.
