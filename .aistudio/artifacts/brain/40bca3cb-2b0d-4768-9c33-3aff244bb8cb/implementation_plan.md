# Love Link 3D — Two Souls, One Adventure: Implementation Plan & Status

## Overview
A real-time 3D cooperative multiplayer adventure game integrated natively into the Love Link couples platform, featuring third-person platforming, synchronized co-op puzzle mechanics, procedural PBR environments, Web Audio SFX, and real-time Firestore session synchronization.

---

## 1. Architecture & Components
- **Game Engine & Rendering**: Three.js r186 with procedural PBR materials, custom tone-mapping, and real-time shadow casting (`SkyIslandsWorld.ts`).
- **Player & Kinematics**: Anime Boy 1 and Galaxia Anime Girl (`CoupleAvatars.ts`) featuring multi-joint articulation, walking, running, jumping physics, and emotional interaction poses.
- **Collision & Platforming**: Authoritative `WorldPhysicsValidator` geometric collision solver with continuous sliding normals against static pillars, archways, and cherry trees, strict world envelope boundaries, and floor plane grounding (`getSurfaceElevation`) preventing character clipping beneath solid floors.
- **Controls & Input Responsiveness**:
  - Dedicated `useVirtualJoystick` hook for mobile multi-touch with pointer-capture, deadzone handling, non-linear power curve for precision steering, spring-return decay, and haptic feedback.
  - Refined acceleration & deceleration curves for desktop keyboard input: 24 m/s² attack curve, 36 m/s² opposing-direction braking for crisp lateral cuts without ice-skating, and 18 m/s² natural exponential stopping.
  - Normalized diagonal keyboard vectors preventing 41% diagonal speed boost.
  - Zero-GC 60fps render loop with pre-allocated vector math objects, eliminating stutter-inducing garbage collection pauses.
  - Camera anti-clipping clamp and smooth spherical lookAt damping.
  - Sprint / Walk mode toggle with analog speed scaling (up to 7.0 m/s).
  - Spacebar / Jump button with grounded physics checks.
  - One-tap Camera Recenter button behind the active character.
- **Real-Time Multiplayer Networking**: Firestore real-time snapshots (`onSnapshot`) at `coupleSpaces/{spaceId}/game3dSession/world1_sky_islands` syncing 3D position, heading, movement state, and authoritative puzzle state with interpolation.
- **Smart AI Companion Mode**: When partner is away or offline, an intelligent partner AI follows, emotes, and automatically navigates to synchronized pressure plates to solve co-op gates.
- **Acoustic Sound Synthesizer**: Pure Web Audio API engine (`GameAudio.ts`) generating responsive jumps, footsteps, crystal arpeggios, switch hums, bridge chords, and victory fanfares without external audio file dependencies.

---

## 2. World 1: Sky Islands (Playable Vertical Slice)
- **Arrival Plateau**: Cobblestone rim, lush fantasy turf, ancient runic gate, and glowing bonsai cherry trees.
- **Stepping Stone Archipelago**: Dynamic floating rocks with vertical bobbing physics.
- **Twin Pressure Plates**: West (Cyan Plate) and East (Magenta Plate).
- **Materialized Energy Bridge**: Translucent crystalline bridge appears across the chasm when both plates are held simultaneously.
- **Ancient Celestial Sanctuary**: Raised temple with 4 runic pillars, 3 collectible star crystals, and a swirling starlight portal that triggers victory fanfare and grants 100 Love Coins, 250 Couple XP, and the "Sky Pioneer 🌟" badge.

---

## 3. Integration Points
- **Route**: Registered under `/adventure-3d` in `App.tsx` (wrapped in `ProtectedRoute` and `ActiveSpaceRoute`).
- **Sidebar Navigation**: Added `3D Adventure` with compass icon to `SidebarNav.tsx`.
- **Playhouse Hub**: Featured prominent interactive launch card in `LoveversePlayhouseScreen.tsx`.
- **Firestore Security Rules**: Configured and deployed permissions for `coupleSpaces/{spaceId}/game3dSession/{sessionId}` allowing authorized couple members full read/write/update access.

---

## 4. Random Date Night Generator (Date Roulette)
- **AI Core**: Powered by Gemini API (`gemini-3.8-flash` with JSON Schema constraint) via server-side endpoint `POST /api/gemini/random-date-generator`.
- **Location Intelligence**: Automatic GPS geolocation detection via `navigator.geolocation` with reverse geocoding + quick-select chips for global cities (NYC, SF, Paris, Tokyo, London, etc.) and custom neighborhood input.
- **Preference Controls**: Setting filters (City Gems, Hidden Speakeasies, Rooftops, Nature & Stargazing, Arts & Culture, Dessert Crawl), vibe selector, budget ($ / $$ / $$$), time of day, and wildcard spontaneity switch.
- **Structured Date Blueprint**:
  - Main anchor activity with insider tips.
  - Secondary nightcap / transition venue.
  - Spontaneity challenge / playful dare with XP rewards.
  - Curated conversation starter card with copy-to-clipboard.
  - Tailored romantic playlist recommendation with Spotify search link.
  - Weather & outfit advisory.
  - Direct 1-click Google Maps search navigation.
- **Interactive UI**:
  - 3D-styled animated roulette wheel and spinning dice roller.
  - Web Audio tactile clicks, chimes, and celebration confetti.
  - Calendar export (`.ics` direct download & Google Calendar link).
- **Persistent Vault & Partner Sync**:
  - Saved to `coupleSpaces/{spaceId}/dateNights/{id}`.
  - Real-time partner in-app notification upon locking in a date.
  - Couple Date Vault tab with 1-5 star completion ratings and status tracking.
- **Routes & Navigation**:
  - Accessible via `/random-date` and `/date-generator`.
  - Sidebar link "Date Roulette 🎲".
  - Quick launch buttons on `AIPlannerScreen` and `SurpriseSchedulerScreen`.
