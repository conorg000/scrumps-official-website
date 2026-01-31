# Game Implementation Plan

This document provides a structured implementation guide for the Scrumps game, organized into phases with specific tasks and technical details.

---

## Phase 1: Remaining Locations

### 1.1 Living Room
**Access**: From balcony via bottom-left edge
**Theme**: Eccentric art gallery vibes with banana paintings

**Furniture/Objects**:
- Multiple banana paintings on walls (absurd art collection)
- Coffee table
- Couch/seating
- Tiny Clown with beer pyramid (NPC)
- 1 Hollandia beer can (collectible)
- 1 CD (collectible)

**File**: `client/public/livingRoom.js`

### 1.2 Bedroom
**Access**: From living room edge
**Theme**: Messy bedroom with hidden x-ray

**Furniture/Objects**:
- Bed (unmade)
- Desk/dresser
- Clothes on floor
- X-ray (collectible, needed for Humunculous Skeleton)
- 1 Hollandia beer can (collectible)
- 1 CD (collectible)

**File**: `client/public/bedroom.js`

### 1.3 Front Porch
**Access**: From living room
**Theme**: Entry point with ladder access to roof

**Furniture/Objects**:
- Front door
- Porch furniture (chairs, etc.)
- Ladder placement point (player places ladder here to access roof)
- 1 Hollandia beer can (collectible)

**File**: `client/public/frontPorch.js`

### 1.4 Rooftop
**Access**: From front porch via ladder (requires ladder item)
**Theme**: Party hideout with Brisbane views

**Furniture/Objects**:
- 10 distinct subletter characters (various appearances)
- City skyline background (Brisbane)
- Rooftop furniture (chairs, cooler, etc.)
- Kiddy pool visible below (for jump scene)

**File**: `client/public/rooftop.js`

---

## Phase 2: Collectibles System

### 2.1 Hollandia Beer Cans (5 total)
**Purpose**: Give to Tiny Clown to complete his beer pyramid

| Location | Placement |
|----------|-----------|
| Backyard | Near boxing ring |
| Downstairs | Near band equipment |
| Balcony | By the BBQ |
| Living Room | On coffee table |
| Bedroom | On dresser |

**Implementation**:
- Add `hollandiaCount` state to GameCanvas
- Add furniture items with type `hollandia_can`
- Add proximity detection and "Pick up" button
- Track collected cans in game state

### 2.2 CDs/Cassettes (4 total)
**Songs**: House of Peterson, HOT SHOT, She Knows, Middle of the Night

| Location | Placement | Song |
|----------|-----------|------|
| Backyard | Hidden by tree | House of Peterson |
| Downstairs | Near instruments | HOT SHOT |
| Living Room | On shelf | She Knows |
| Bedroom | On desk | Middle of the Night |

**Implementation**:
- Add `collectedCDs` array state
- Add furniture items with type `cd_item`
- Each CD has unique `songName` property
- All 4 CDs trigger chase when combined with Humunculous joining

### 2.3 Ladder (1)
**Location**: Backyard (near shed or fence)
**Purpose**: Required to access rooftop from front porch

**Implementation**:
- Add `hasLadder` state
- Add furniture item with type `ladder`
- Front porch roof access checks for ladder

---

## Phase 3: New Characters

### 3.1 Tiny Clown
**Location**: Living Room
**Visual**: Small clown building a beer pyramid
**Interaction**: Needs 5 Hollandia cans

**Dialog Flow**:
1. Without enough cans: "I need more cans for my pyramid! Bring me 5 Hollandia!"
2. With 5 cans: "PERFECT! My pyramid is complete! I shall reward you with... friendship!"
3. Tiny Clown joins as companion

### 3.2 Humunculous Skeleton
**Location**: Downstairs (appears after possum joins)
**Visual**: Skeleton missing a foot, hobbling
**Interaction**: Needs x-ray from bedroom

**Dialog Flow**:
1. Without x-ray: "I've lost my foot... I need that x-ray to find it!"
2. With x-ray: "My foot! It was inside me all along! Let me join your quest!"
3. Joins party + if player has all 4 CDs = LOUD MUSIC = triggers chase

### 3.3 Adele (The Inspector)
**Visual**: Brown hair, business suit, antagonist energy
**Behavior**:
- Wanders through rooms looking for subletters
- Avoids backyard initially
- When chase triggers: actively pursues player

**Chase Mode**:
- Triggered when Humunculous joins AND player has all 4 CDs
- Music plays loud, Adele comes running
- Mr Tibbles yells "TO THE ROOF!"
- Player must reach roof without being caught
- If caught: funny game over, restart chase

### 3.4 Bush Turkey (Final Boss)
**Location**: Backyard (final scene)
**Visual**: Aggressive Australian bush turkey
**Behavior**: Wants to eat Scrump

**Boxing Mini-Game**:
- Simple timing-based combat
- 3 rounds of boxing
- Turkey telegraphs attacks (windup animation)
- Player must dodge and counter-punch
- Health bars for both fighters

### 3.5 Mr Feng (The Landlord)
**Visual**: Chinese, older gentleman, polo shirt, jeans, sunnies
**Appearance**: Final scene after bush turkey defeat

**Dialog**: "I watched your twitch stream guys that was sick let's get f***d up"

### 3.6 Subletters (10 distinct characters)
**Location**: Rooftop
**Visuals**: 10 different funny characters

Ideas for variety:
1. Guy in bathrobe
2. Person covered in tattoos
3. Someone holding a guitar
4. Person with giant headphones
5. Someone eating cereal
6. Person in full costume (mascot?)
7. Skater with board
8. Someone meditating
9. Person on phone
10. Someone sleeping standing up

---

## Phase 4: Game Flow & Events

### 4.1 Act Structure

**Act 1: Backyard Awakening** (IMPLEMENTED)
- [x] Scrump wakes up
- [x] Meet Mr Tibbles
- [x] Mr Tibbles joins party

**Act 2: Exploring the House** (PARTIAL)
- [x] Discover balcony, get compost
- [x] Feed possum, possum joins
- [ ] Discover living room
- [ ] Meet Tiny Clown (needs 5 cans)
- [ ] Discover bedroom
- [ ] Find x-ray for Humunculous

**Act 3: The Chase** (TODO)
- [ ] Give x-ray to Humunculous
- [ ] Chase triggers (4 CDs + Humunculous)
- [ ] Escape to roof sequence
- [ ] Reach rooftop

**Act 4: Rooftop Escape** (TODO)
- [ ] Meet all subletters
- [ ] Adele arrives
- [ ] Everyone jumps into kiddy pool

**Act 5: Final Battle** (TODO)
- [ ] Bush Turkey appears
- [ ] Boxing mini-game
- [ ] Victory

**Ending** (TODO)
- [ ] Adele arrives dishevelled
- [ ] Mr Feng walks in
- [ ] Party scene

### 4.2 Chase Sequence Implementation

**Trigger Conditions**:
```javascript
if (humunculousJoined && collectedCDs.length === 4) {
  triggerChase();
}
```

**Chase State**:
- `isChaseActive`: boolean
- `adelePosition`: {x, y, room}
- `chaseTimer`: countdown or pursuit logic

**Movement**:
- Adele moves toward player's room
- When in same room, moves toward player
- Player can outrun but not too easily

**Escape Path**: Living Room → Front Porch → (place ladder) → Rooftop

### 4.3 Boxing Mini-Game

**Game State**:
```javascript
boxingState = {
  active: false,
  round: 1,
  playerHealth: 100,
  turkeyHealth: 100,
  turkeyAttacking: false,
  attackWindow: false
}
```

**Controls**:
- Left/Right: Dodge
- Action button: Punch (during attack window)

**Turkey Attack Pattern**:
1. Wind up (1 second, visual cue)
2. Strike (fast)
3. Recovery (attack window)
4. Repeat

---

## Phase 5: Polish & UI

### 5.1 Character Portraits (DialogModal)
Add SVG portraits for:
- [ ] Tiny Clown
- [ ] Humunculous Skeleton
- [ ] Adele
- [ ] Bush Turkey
- [ ] Mr Feng
- [ ] Generic subletter portrait

### 5.2 Sound Effects
- Pickup sounds for collectibles
- Music for chase sequence
- Boxing sound effects
- Victory/defeat jingles

### 5.3 Game State Persistence
- Save progress to localStorage
- Track: companions, items, rooms visited, NPCs talked to

### 5.4 Mobile Optimization
- Ensure all new buttons work on touch
- Virtual joystick works in all scenes
- Boxing mini-game touch controls

---

## Implementation Order

1. **Living Room** - New location + Tiny Clown
2. **Collectibles** - Beer cans and CDs across all rooms
3. **Bedroom** - New location + x-ray
4. **Humunculous Skeleton** - Character + x-ray interaction
5. **Front Porch** - New location + ladder mechanic
6. **Rooftop** - New location + 10 subletters
7. **Adele** - Wandering NPC + chase logic
8. **Chase Sequence** - Full escape flow
9. **Bush Turkey** - Boxing mini-game
10. **Ending** - Mr Feng + party scene
11. **Polish** - Portraits, sounds, persistence

---

## Technical Notes

### Scene Transitions
Each room needs edge detection for transitions:
```javascript
// Example: Balcony to Living Room
if (player.x < 2 && player.y > 8) {
  game.loadScene('livingRoom');
}
```

### Companion System
Already implemented. New companions use:
```javascript
game.addCompanion('tiny_clown');
game.addCompanion('humunculous');
```

### State Management
GameCanvas.tsx needs new state:
```javascript
const [hollandiaCount, setHollandiaCount] = useState(0);
const [collectedCDs, setCollectedCDs] = useState<string[]>([]);
const [hasXray, setHasXray] = useState(false);
const [hasLadder, setHasLadder] = useState(false);
const [tinyClownJoined, setTinyClownJoined] = useState(false);
const [humunculousJoined, setHumunculousJoined] = useState(false);
const [isChaseActive, setIsChaseActive] = useState(false);
const [isBoxingActive, setIsBoxingActive] = useState(false);
```

### Draw Order
Companions and NPCs should render after furniture but before UI:
1. Floor
2. Furniture (back to front)
3. NPCs (non-companion)
4. Player
5. Companions (following player)
6. UI overlays
