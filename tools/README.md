# Art preview harness

These scripts load the game's vanilla-JS draw code under
[`node-canvas`](https://github.com/Automattic/node-canvas) and render every
sprite/prop to a labeled PNG contact sheet — so procedural pixel art can be
reviewed and iterated on **without opening a browser**.

## Setup

```bash
npm i -D canvas      # native dep; not required for the app build/deploy
```

`canvas` is intentionally **not** in `package.json` so it never touches the
production build. Install it locally when you want to work on art.

## Usage

```bash
node tools/render.cjs            # characters + backyard props -> tools/sprites.png
CHARS=1 node tools/render.cjs    # characters only (no furniture overlap)
node tools/render-rooms.cjs      # every prop in every room   -> tools/rooms.png
node tools/render-rooms.cjs downstairs   # one room, zoomed in
```

Generated PNGs are git-ignored. Open them, tweak the draw functions in
`client/public/*.js`, and re-run.

## Art conventions (procedural pixel art)

- Light comes from the top-left: highlights up/left, shadows down/right.
- Give silhouettes a 1px dark **outline** for readability (`drawBlob`,
  or draw an oversized shape in the outline colour first).
- Use a 3–4 tone ramp per material (shadow / base / light / highlight).
- Ground characters/props with `drawContactShadow`.
