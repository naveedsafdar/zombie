# Zombie Road — Game Plan (draft v0.3)

> Status: planning. Nothing is built yet. Items marked **[?]** are still open.

## 1. Concept
A lone survivor stands on a dark road at midnight. Zombies keep coming out of the dark toward him — they never stop. Every few kills his gun automatically upgrades and gets more powerful; every few kills after that, the zombies get stronger too. It's a race: how long can you stay ahead before they overwhelm you?

**One-line pitch:** "One road. Endless zombies. Your gun grows — so do they."

## 2. Decisions so far
| Topic | Decision |
|---|---|
| Structure | **One endless level.** No level select, no level-complete screens. Zombies keep spawning until the player dies. |
| Progression | **Every 10 kills → gun upgrade** (gun changes type or gains effects, +25 health). **Every 12 kills → zombies get stronger.** All automatic. |
| Economy | **None.** No gold coins, no weapon store. |
| View | Front view, road stretching into the distance. Player seen from behind, over the shoulder. |
| Movement | Player moves left and right only. |
| Platform | Browser first, mobile-friendly. Mobile app later (same code wrapped). |
| Art style | Cartoon, made scary. Guns drawn more realistically than the world. |
| Scene | **Midnight streetlights** — night sky, moon, flickering street lamps, broken houses, wrecked cars, red-eyed zombies. |
| Character | **Survivor** — hoodie, jeans, backpack. |
| On death | **Game over → start again from 0 kills.** Score = kills; best score saved. |
| Extras | Decide later. |

## 3. Core loop
```
Start (pistol, full health, 0 kills)
   → zombies walk in from the dark → move left/right & shoot
   → every 10 kills: gun upgrades  (player gets stronger)
   → every 12 kills: zombies level up (enemies get stronger)
   → health = 0 → Game Over (kills, time survived, best score) → Play again
```
The two counters run side by side, so the player feels a steady push-and-pull:
| Kills | Event |
|---|---|
| 10 | Gun upgrade 1 |
| 12 | Zombies level 1 |
| 20 | Gun upgrade 2 |
| 24 | Zombies level 2 |
| 30 | Gun upgrade 3 |
| 36 | Zombies level 3 |
| … | … |

**The gap is fixed forever:** a gun upgrade every 10 kills and a zombie level-up every 12 kills, for the whole run. The HUD always shows "Next gun in X kills". Both numbers live in the config file (`gunUpgradeEvery: 10`, `zombieLevelUpEvery: 12`) so they can be changed after playtesting without touching code.

Each event gets a short on-screen banner ("GUN UPGRADED: Fire rounds!" / "THEY'RE GETTING STRONGER…") and a sound cue — no pause in the action.

## 4. Player — the Survivor
| Stat | Start value | Notes |
|---|---|---|
| Health | 100 | Does not reset (one continuous run). **Heals +25 (up to max) at every gun upgrade.** |
| Movement | Left / right only | Dodge spit, line up shots |
| Aim | Crosshair (mouse on PC, drag/tap on mobile) | Headshots do extra damage |
| Ammo | Magazine + reload | Unlimited spare ammo; reload is the tension |

**Look:** hoodie (dark red), jeans, backpack, short brown hair. Seen from behind with a two-handed grip during play.

## 5. Gun upgrade path (every 10 kills)
**Decided: the gun really changes type** as you progress (Pistol → SMG → Shotgun → Assault rifle → Minigun), with effect upgrades in between. Every upgrade also heals +25. Each step is a clear, visible jump in power.
| Kills | Upgrade | What changes |
|---|---|---|
| 0 | Pistol | Starter. Glowing night sights. |
| 10 | Pistol+ | More damage, faster reload, bigger muzzle flash |
| 20 | SMG | Rapid fire, tracer bullets |
| 30 | SMG + fire rounds | Bullets set zombies on fire (damage over time) |
| 40 | Shotgun | Wide spread, knocks zombies back |
| 50 | Shotgun + explosive shells | Small blast on hit |
| 60 | Assault rifle | Fast, strong, accurate |
| 70 | Rifle + piercing rounds | Bullets pass through a line of zombies |
| 80 | Minigun | Huge fire rate, spin-up time |
| 90+ | Minigun + effect boosts | Keep stacking damage / fire rate / effects |

All guns: realistic detail (slide, sights, grip texture, metal highlights), generic design — no real brands or logos.

### The upgrade moment (small, never pauses)
- **Next gun bar** in the HUD fills with every kill ("4 kills" to go).
- On upgrade: the new gun pops into his hands with a few gold sparks, **+25 HP** floats up by the health bar, and a **small toast** slides in above the ammo counter for ~2.5 s (gun picture, "NEW GUN", name, what it does). No slow motion, no full-screen banner. (Changed 2026-11-15: the big card and slow-mo took too much screen.)
- Bullet trails show the effect: orange = fire rounds, red-orange = explosive, blue = piercing.

## 6. Zombies (every 12 kills they level up)

### Difficulty target (decided)
- A **really bad player should not survive past ~30 kills**. Average and good players stay in much longer.
- **Good players keep playing much longer** (added 2026-11-15).
- Tuned with the bot simulator (`tools/balance-sim.js`): bad bot ~7–18 kills, average ~70–110, good 300+ (often still alive after several minutes).
- Hits only make zombies **flinch** — they keep coming (no big knockback except the shotgun).
- Zombie levels 1–5: health ×1.25, speed ×1.08, spawn interval ×0.82, +1 max on screen, more hordes.
- From level 6 on, growth slows down (health ×1.1, speed and spawn rate barely change, max 9 on screen) so good players can keep going.
- Level-up: **no on-screen message** (removed 2026-11-15, it took too much time and screen). Only the "ZOMBIE LV" counter in the corner pulses and a growl plays.

### Where they come from (unlock one by one)
| Zombie level | Kills | New spawn point |
|---|---|---|
| 0 | 0 | Far end of the road, out of the fog |
| 1 | 12 | **Far houses** — door bursts open, zombie cuts across the lawn |
| 2 | 24 | **Houses right next to you** — very little warning |
| 3 | 36 | **Behind wrecked cars** — climbs up from behind |
| 4 | 48 | **Sides of the road**, close to the player |

Attacks from behind: not for now.

### Zombie types (later milestone)
Each zombie level also adds variety:
| Zombie level | Kills | Change |
|---|---|---|
| 0 | 0 | Walkers only, slow, few at a time |
| 1 | 12 | +health, +speed, **Runners** appear |
| 2 | 24 | More on screen at once, **Brutes** appear |
| 3 | 36 | **Spitters** appear (move to dodge) |
| 4 | 48 | +health, +speed, faster spawns |
| 5 | 60 | **Boss** appears, then returns every 60 kills |
| 6+ | … | Keep scaling health, speed and spawn rate |

| Type | Health | Speed | Special |
|---|---|---|---|
| Walker | Low | Slow | — |
| Runner | Low | Fast | Zig-zags across the road |
| Brute | High | Slow | Big damage when it reaches you |
| Spitter | Medium | Medium | Stops and spits from range |
| Boss | Very high | Slow | Charges, summons walkers, weak spot on head |

**Balance note:** the gun upgrades a little more often (10) than the zombies (12), so zombie levels must add more each time (health, speed **and** spawn rate) to keep the difficulty rising. Tuned by playtesting.

## 7. Scoring
- Score = **total kills**. Also shown: time survived, headshot %, highest gun reached.
- **Best score** saved in the browser.

## 8. Controls
**PC:** mouse = aim · left click = shoot · A/D or ←/→ = move · R = reload · Esc = pause
**Mobile:** left side = move buttons (or slide), right side = drag to aim / tap to shoot, auto-reload.
(No gun-switch needed — there is always one current gun.)

## 9. Screens
Title (Play, best score) → Game (HUD: health, kill counter, current gun, "next upgrade in X kills") → Game Over (kills, time, best, Play again).

## 10. Art & scene
- **Style:** cartoon, made scary — bold outlines, rotting grey-green zombies, torn bloody clothes, sharp teeth, glowing red eyes, arms reaching forward.
- **Scene:** Midnight streetlights — deep blue sky, big moon, flickering street lamps with pools of light, a few windows still glowing.
- **Roadside:** abandoned houses with broken/hanging doors, smashed or boarded windows, holes in roofs; crashed cars with shattered windshields.
- **Guns:** drawn more realistically than the world so they feel powerful.
- **Scare features:** unsettling movement (limping, twitching, sudden sprints), groans getting louder as they approach, heartbeat when health is low, hit reactions (blood splatter, stagger). Gore on/off setting.

## 11. Tech
- **Browser game in JavaScript/TypeScript with Phaser 3** (2D sprites, fake depth by scaling zombies and roadside objects as they approach).
- Mobile app later by wrapping the web build with **Capacitor** (iOS + Android).
- Tuning data (gun upgrade steps, zombie levels, spawn rates) in **JSON config files**, not code.
- Best score saved in the browser.

## 12. Build milestones
1. ✅ **MVP (built 2026-11-15):** midnight road in perspective, Survivor moving left/right with pistol, walkers approaching and growing, shooting + headshots, health, kill counter, game over / play again.
2. ✅ **Progression (built 2026-11-15):** gun upgrade every 10 kills with the full gun ladder and effects (fire, explosive, piercing, minigun spin-up), dramatic upgrade moment, zombie level-up every 12 kills, spawn points unlocking (houses, cars, roadside), difficulty tuned.
3. **Content:** zombie types (runner, brute, spitter), boss.
4. **Polish:** final art, sounds, effects (muzzle flash, tracers, fire, screen shake), mobile controls.
5. **Later:** mobile app, extras.

## 13. Open questions
None right now. Extras (barricades, power-ups, companions, multiplayer) to be decided after the MVP.
