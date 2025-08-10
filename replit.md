# Game Project - Bolt to Replit Migration

## Project Overview
This is a 2D canvas-based game that was successfully migrated from Bolt to Replit. The game features a character named "Scrumps" in a room-based environment with interactive elements.

## Project Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js server for static file serving
- **Game Engine**: Custom HTML5 Canvas game with JavaScript modules
- **Styling**: Tailwind CSS + custom CSS for retro/pixel art effects

## File Structure
```
client/
  public/           # Game scripts and assets
    - utils.js      # Utility functions and color palette
    - player.js     # Player character logic
    - room.js       # Room system
    - greenRoom.js  # Green room environment
    - upstairsRoom.js # Upstairs room environment
    - controls.js   # Input handling
    - game.js       # Main game engine
  src/
    components/     # React UI components
      - GameCanvas.tsx    # Main game wrapper
      - VirtualJoystick.tsx # Mobile controls
      - LoadingScreen.tsx   # Loading UI with retro effects
      - DialogModal.tsx     # Character dialog system
    - App.tsx       # Root React component
server/
  - index.ts      # Express server
  - routes.ts     # API routes (minimal)
  - storage.ts    # In-memory storage interface
  - vite.ts       # Vite development server integration
```

## Game Features
- Canvas-based 2D graphics with pixel art style
- Character movement and room navigation
- Interactive objects (boxing ring, beer bottles, trees, etc.)
- Dialog system with character portraits
- Mobile-friendly virtual joystick controls
- Retro loading screen with glitch effects

## Technical Details
- Server runs on port 5000 (required for Replit)
- Static files served from client/public/
- Game uses global JavaScript modules loaded dynamically
- React components provide UI wrapper around canvas game
- TypeScript strict mode with proper type definitions

## Recent Changes
- Fixed TypeScript errors in React components
- Removed unsupported `jsx` style syntax
- Added proper type annotations for game objects
- Verified static file serving is working correctly

## User Preferences
- Prefers concise, technical communication
- Values working code over extensive documentation
- Focuses on functionality and user experience

## Migration Status
✓ All dependencies installed and verified
✓ TypeScript errors resolved in React components  
✓ Static file serving confirmed working
✓ Server running successfully on port 5000
⚠ Canvas game loading issue needs investigation