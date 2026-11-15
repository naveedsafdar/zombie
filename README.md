# Zombie Road

A zombie shooting game for the browser. You hold a midnight road while zombies keep coming. Every 10 kills your gun upgrades, and every 12 kills the zombies get stronger.

**Play:** https://naveedsafdar.github.io/zombie/

## Controls
- **PC:** mouse to aim, click to shoot (hold for automatic guns), A/D or ←/→ to move, R to reload
- **Phone (landscape):** ◀ ▶ buttons to move, tap to shoot

## Run locally
```bash
python3 -m http.server 8080
```
Then open http://localhost:8080.

## Project
- `plan.md`: the game design
- `src/config.js`: all balance numbers (zombie speed, health, spawn rate, upgrade steps)
- `src/guns.js`: the gun upgrade ladder
- `src/scenes/`: title, game and game over screens
- `assets/`: SVG art
- `tools/balance-sim.js`: bot players that test the difficulty (see the comment at the top of the file)

Built with [Phaser 3](https://phaser.io).
