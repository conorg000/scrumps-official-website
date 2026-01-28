# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server on port 5000 (serves both API and client)

# Build
npm run build        # Build for production (Vite frontend + esbuild server)

# Type checking
npm run check        # Run TypeScript type checker

# Database
npm run db:push      # Push schema changes to database (requires DATABASE_URL)
```

## Architecture

This is a full-stack TypeScript application with an isometric pixel-art game frontend. The server and client are served from a single Express server on port 5000.

### Directory Structure

- **`server/`** - Express backend with API routes
  - `index.ts` - Server entry point, sets up Express middleware and Vite integration
  - `routes.ts` - API route definitions (prefix routes with `/api`)
  - `storage.ts` - Data storage interface with in-memory implementation
  - `vite.ts` - Vite dev server setup and static file serving

- **`client/`** - React frontend
  - `src/` - React components (TypeScript)
  - `public/` - Static assets and vanilla JS game engine files

- **`shared/`** - Shared code between client and server
  - `schema.ts` - Drizzle ORM schema definitions and Zod validation schemas

### Game Engine

The game is an isometric 2D pixel-art adventure. The core game engine is in vanilla JavaScript (`client/public/*.js`) and integrates with React via the `GameCanvas` component.

Key game files:

- `game.js` - Main game loop, camera system, scene management
- `player.js` - Player entity (a crisp character named "Scrump")
- `room.js` - Main backyard scene with furniture/objects
- `downstairsRoom.js` - Downstairs room scene
- `balcony.js` - Balcony scene
- `controls.js` - Input handling
- `utils.js` - Isometric coordinate conversion, drawing utilities

Game spaces terminology:
- **Backyard** - The main outdoor area (room.js)
- **Downstairs** - Interior room below the backyard (downstairsRoom.js)
- **Balcony** - Upper level area (balcony.js)

The React layer (`GameCanvas.tsx`) handles:

- Loading the vanilla JS game scripts dynamically
- Dialog system via React modal
- Mobile virtual joystick
- Proximity detection for interactable objects
- Scene transition buttons
- Audio management with localStorage persistence

### Path Aliases

Configured in both `tsconfig.json` and `vite.config.ts`:

- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets/*` → `./attached_assets/*`

### Mobile-First Design

The frontend must be mobile-friendly. The game includes a virtual joystick for touch controls and responsive UI elements.

### Game Development

Claude should proactively assist with game mechanics and storyline advice/suggestions when working on this project.

See **[GAME_DESIGN.md](./GAME_DESIGN.md)** for the full game design document including plot, characters, mechanics, and locations.

### Database

Uses Drizzle ORM with PostgreSQL (Neon serverless). Schema is defined in `shared/schema.ts`. The storage layer (`server/storage.ts`) provides a `MemStorage` implementation for development; replace with database calls for production.
