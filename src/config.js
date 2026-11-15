// All tuning numbers live here so the game can be balanced without touching logic.
export const CONFIG = {
  width: 960,
  height: 540,

  // Perspective: the road vanishes at (width/2, horizonY).
  horizonY: 200,
  roadHalfWidthBottom: 420, // half the road width at the bottom of the screen
  zNear: 2, // depth that maps to the bottom edge of the screen
  zFar: 24, // depth where road zombies spawn (near the horizon)
  zAttack: 3.0, // depth where zombies stop and attack (kept back so they stay visible)

  player: {
    maxHealth: 100,
    moveSpeed: 1.3, // world units per second (road spans -1..1)
    minX: -0.75,
    maxX: 0.75,
    displayHeight: 230,
  },

  zombies: {
    walker: {
      // Tuned with tools/balance-sim.js: bad player ~6-20 kills, average ~50-100, good 100+.
      health: 3.5,
      speed: 1.8, // depth units per second
      damage: 8,
      attackEveryMs: 1100,
      attackReach: 0.35, // how close (in world x) a zombie must be to hit the player
      homing: 0.25, // how fast it drifts toward the player while walking
      homingClose: 1.0, // how fast it follows once it has reached the player
      offRoadSpeed: 0.9, // extra sideways speed while crossing a lawn onto the road
    },
    heightAtNear: 320, // on-screen height (px) at depth zNear
    headshotMultiplier: 2.5,
    flinch: 0.08, // tiny push back on a normal hit
    headshotStagger: 0.25, // a bit more on a headshot
  },

  spawn: {
    intervalMs: 2300,
    maxAlive: 3,
    hordeChance: 0.08, // chance a spawn is a group instead of one zombie
    hordeSize: [2, 3],
  },

  // Every zombie level (every 12 kills) multiplies / adds these.
  zombieLevelUp: {
    healthMult: 1.25,
    speedMult: 1.08,
    maxSpeedMult: 2.0,
    intervalMult: 0.82,
    minIntervalMs: 450,
    maxAliveAdd: 1,
    maxAliveCap: 16,
    hordeChanceAdd: 0.07,
  },

  // Spawn sources unlock one by one as the zombie level rises.
  // z / x are world coordinates (x beyond ±1 is off the road).
  spawnSources: [
    { id: 'road', unlockLevel: 0, weight: 4 },
    { id: 'house', unlockLevel: 1, weight: 3, doors: [
      { z: 21.3, x: -1.77, sx: 410, sy: 232, s: 0.5 },
      { z: 21.3, x: 1.77, sx: 550, sy: 232, s: 0.5 },
      { z: 7.4, x: -1.39, sx: 322, sy: 292, s: 1 },
      { z: 7.4, x: 1.39, sx: 638, sy: 292, s: 1 },
    ] },
    { id: 'nearHouse', unlockLevel: 2, weight: 2, doors: [
      { z: 3.7, x: -1.34, sx: 172, sy: 386, s: 1.9 },
      { z: 3.7, x: 1.34, sx: 788, sy: 386, s: 1.9 },
    ] },
    { id: 'car', unlockLevel: 3, weight: 2, spots: [
      { z: 5.2, x: 1.25 },
      { z: 3.4, x: -1.05 },
    ] },
    { id: 'roadside', unlockLevel: 4, weight: 2 },
  ],

  progression: {
    gunUpgradeEvery: 10,
    zombieLevelUpEvery: 12,
    healOnUpgrade: 25,
    upgradeSlowMoMs: 1300, // real-time length of the dramatic slow-down
    upgradeSlowMoFactor: 0.2,
    shockwaveDepth: 7, // zombies closer than this get blasted back
    shockwavePush: 4,
  },

  // Debug: speeds the whole game up (used for automated balance tests).
  gameSpeed: 1,
};
