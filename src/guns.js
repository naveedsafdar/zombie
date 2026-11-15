// Gun ladder: one entry per upgrade (every 10 kills). After the last entry,
// every further upgrade boosts the last gun (see boostAfterLast).
//
// sprite      back-view image held by the survivor
// card        side-view image shown on the upgrade card
// auto        hold to keep firing
// pellets     shotgun pellets per shot (spread in px at the aim point)
// pierce      how many zombies one bullet can pass through
// burn        damage per second for burnMs after a hit (fire rounds)
// explode     area damage around the hit point
// spinUpMs    minigun: fire rate ramps up while held
export const GUNS = [
  {
    name: 'Pistol', tagline: 'Reliable starter', sprite: 'gun-pistol', card: 'card-pistol',
    damage: 1, fireCooldownMs: 220, magSize: 8, reloadMs: 1100, tracer: 0xfff2a8,
  },
  {
    name: 'Pistol+', tagline: 'More damage, faster reload', sprite: 'gun-pistol', card: 'card-pistol',
    damage: 1.5, fireCooldownMs: 180, magSize: 12, reloadMs: 850, tracer: 0xfff2a8,
  },
  {
    name: 'SMG', tagline: 'Rapid fire, hold to shoot', sprite: 'gun-smg', card: 'card-smg',
    damage: 0.9, fireCooldownMs: 85, magSize: 30, reloadMs: 1400, auto: true, tracer: 0xfff2a8,
  },
  {
    name: 'SMG + Fire rounds', tagline: 'Sets zombies on fire', sprite: 'gun-smg', card: 'card-smg',
    damage: 0.9, fireCooldownMs: 85, magSize: 30, reloadMs: 1300, auto: true, tracer: 0xff8a2a,
    burn: 1.2, burnMs: 2500,
  },
  {
    name: 'Shotgun', tagline: 'Wide spread, knocks them back', sprite: 'gun-shotgun', card: 'card-shotgun',
    damage: 1.2, fireCooldownMs: 450, magSize: 6, reloadMs: 1500, tracer: 0xfff2a8,
    pellets: 8, spread: 46, knockback: 0.35,
  },
  {
    name: 'Shotgun + Explosive shells', tagline: 'Every hit explodes', sprite: 'gun-shotgun', card: 'card-shotgun',
    damage: 1.2, fireCooldownMs: 450, magSize: 8, reloadMs: 1400, tracer: 0xff6a2a,
    pellets: 8, spread: 46, knockback: 0.35, explode: { damage: 2.5, radius: 90 },
  },
  {
    name: 'Assault rifle', tagline: 'Fast, strong, accurate', sprite: 'gun-rifle', card: 'card-rifle',
    damage: 2, fireCooldownMs: 100, magSize: 30, reloadMs: 1300, auto: true, tracer: 0xfff2a8,
  },
  {
    name: 'Rifle + Piercing rounds', tagline: 'Bullets go through 3 zombies', sprite: 'gun-rifle', card: 'card-rifle',
    damage: 2.2, fireCooldownMs: 95, magSize: 30, reloadMs: 1200, auto: true, tracer: 0x5ac8ff,
    pierce: 3,
  },
  {
    name: 'Minigun', tagline: 'Unstoppable. Hold to spin up', sprite: 'gun-minigun', card: 'card-minigun',
    damage: 1.6, fireCooldownMs: 45, magSize: 150, reloadMs: 2600, auto: true, tracer: 0xffd23f,
    spinUpMs: 600, pierce: 2,
  },
];

export const boostAfterLast = { damageMult: 1.12, tagline: 'Minigun boosted: +12% damage' };

// Gun for a given upgrade number (0 = starting pistol).
export function gunForLevel(level) {
  if (level < GUNS.length) return { ...GUNS[level], level };
  const extra = level - (GUNS.length - 1);
  const last = GUNS[GUNS.length - 1];
  return {
    ...last,
    level,
    name: `Minigun Mk ${extra + 1}`,
    tagline: boostAfterLast.tagline,
    damage: last.damage * Math.pow(boostAfterLast.damageMult, extra),
  };
}
