# Love Link: 3D Loveverse Experience Upgrade Plan

## Overview
Elevate the existing lightweight Loveverse digital gifts into premium, fully interactive 3D experiences with high-fidelity procedural geometry, solid collision detection, partner exploration mode, and complete Creative Commons attribution.

---

## Implemented Architecture & Upgrades

### 1. Collision & Physics System (`CollisionSystem.ts`)
- **Solid Obstacle Boundaries**:
  - Box colliders (`BoxCollider`) for walls, facades, crates, benches, desks.
  - Cylinder colliders (`CylinderCollider`) for palm tree trunks, lampposts, columns, barrels.
  - Circular / Polygon perimeters preventing walking off cliffs, into deep ocean water, or through balustrades.
- **Sliding Collision Response**:
  - Circle-vs-box swept collision with normal slide resolution.
  - Avatars slide smoothly along walls and barriers without snagging or clipping through.

### 2. Partner Exploration Mode & Couple Avatars (`ExplorationEngine.ts`, `CoupleAvatars.ts`)
- **Exploration with Partner**:
  - Player and partner avatars rendered with customizable sweaters/colors, animated swinging limbs and bouncing walk cycles.
  - Floating nameplate canvas badges above avatars ("You" and partner's real name/photo from `useCoupleSpace`).
  - Partner AI companion walking alongside player, stopping gracefully, turning to face each other, and emitting romantic heart sparkles when standing or walking close.
- **Responsive Controls**:
  - Desktop: Keyboard WASD / Arrow keys, Shift to sprint, pointer drag to look around.
  - Mobile: Virtual on-screen touch joystick on the bottom-left + touch look on right.
  - Click-to-move / Tap-to-move on ground with raycasting.
  - Mode Switcher: Smooth toggle between "🚶 Walk Partner" and "🎥 Orbit View".

### 3. High-Fidelity 3D Worlds & Procedural Props
- **Ever Tide — Our Sunset Island**:
  - Stylized Tropical Beach Diorama base with curved shoreline and sandy dunes.
  - Multi-part palm trees with segmented curved trunks, coconuts, and fanning fronds (yadrogames reference).
  - Suspended string fairy lights with glowing bulbs (TrixtheProtogen reference).
  - Rustic wooden pier with wooden support posts, crates with metal corner bands, and aged wooden barrels with iron hoops (CGlads reference).
  - Weathered wooden signboard reading "EVER TIDE - Our Sunset Island 🌴" (Pasindu.Anjana reference).
  - Vintage brass & glass oil lamps with flickering amber flames (rudavin reference).
  - Weathered wooden rowboat with oars pulled onto the sand (donnichols reference).
  - Striped beach umbrella and wooden lounger chair (Edwin3D & SkinOmegaProductions references).
  - Classic park bench overlooking the horizon (berkgedik reference).
  - Toon airplane with rotating propeller trailing personalized recipient question banner (animanyarty reference).
  - Interactive bobbing message in a bottle.
  - Circular island barrier preventing falling into deep water.
- **Paris Together — Romantic 3D Invitation**:
  - Haussmann-style building blocks with zinc mansard roofs, French windows, and wrought-iron balconies (kingdome & maheylah references).
  - Cafe OZ ground floor storefront with red-and-white striped canopy awning and chalkboard menu (alban reference).
  - Six-sided Parisian dark cast-iron lampposts with warm amber lantern glow (edemaistre reference).
  - Distant Arc de Triomphe classical arch (HoangHiepVu reference) and Eiffel Tower with multi-tier lattice framework and spinning beacon light (Lambo_SC04 reference).
  - Bistro table with candle, champagne flutes, and wax-sealed 3D invitation letter.
  - Solid wall and balustrade colliders preventing walking through buildings or falling off the Seine terrace.
- **Our Museum — Interactive 3D Photo Gallery**:
  - Grand classical gallery hall with reflective parquet wood floor, baseboards, and fluted marble columns (Richard's Art Gallery reference by shinymagic).
  - Fancy molded gold picture frames with linen mat boards and brass exhibition plaques (jamiemcfarlane reference).
  - Classical velvet museum viewing benches in the central aisle (berkgedik reference).
  - Solid perimeter gallery walls (left, right, back, front entrance) and column colliders.
- **Kitty Letter — Animated 3D Character and Letter**:
  - Cute chibi kitten with chubby cheeks, pointed ears with pink liners, animated twitching tail, paws holding the letter, and collar with golden bell (_polybit_ reference).
  - Cozy bedroom with fluffy pastel rug, velvet cushion, and writing desk.
  - Interactive wax-sealed love letter with floating heart aura.
  - Solid bedroom wall and desk colliders.

### 4. 3D Model Inspirations & Credits Modal (`ModelCreditsModal.tsx`)
- In-scene dialog giving attribution to all 21 Sketchfab reference items, authors, CC Attribution 4.0 licenses, and links.
- Accessible via a button in the viewer and bottom control dock.

### 5. Silky Smooth Pacing & Zero Viewport Occlusion
- Three.js r160+ ACESFilmicToneMapping and `RoomEnvironment` PMREM reflections.
- Low-occlusion collapsible bottom dock with hide/show drawer toggle.
- Zero per-frame memory allocation (GC-free animation loop).
