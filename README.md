# Glass

Glass is a framework for making ECS-based WebGL games in TypeScript, with a particular emphasis on retro game styles.

---

Glass is a work in progress, and not yet intended for general use.

---

Glass is broken up into the following sub-libraries:
- `@glass/core` - General-purpose, core framework
- `@glass/agate` - General-purpose state management utilities
- `@glass/opal` - General-purpose 2D graphical utilities
- `@glass/onyx` - General-purpose audio & chiptune utilities
- `@glass/zircon` - Menu/selection/icon interaction modes
- `@glass/topaz` - Tile-based top-down interaction modes
- `@glass/lapis` - Tile-based isometric interaction modes
- `@glass/pyrope` - Tile-based side-scroller interaction modes
- `@glass/manik` - Bullet-hell-style interaction modes

Not all of these sub-libraries are actually built yet - they are only listed to reserve the names as they are planned. Other sub-libraries will have names based on other gemstones.

## Assumptions

The design of Glass assumes the following assumptions (consistent with many retro-style games, and consistent with the preferences of speedrunners) that the game being built is:

- "frame-perfect", with all timing-dependent mechanisms being primarily based on the number of frames that have passed, rather than wall clock time.

- "deterministic", with all game-relevant random values being generated from pseudo-random number generator that uses seeds based on other non-random values in the game state.
