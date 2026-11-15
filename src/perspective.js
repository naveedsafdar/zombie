import { CONFIG } from './config.js';

const CENTER_X = CONFIG.width / 2;
const BOTTOM = CONFIG.height;

// Converts a depth (z) and a world x (-1..1 across the road) into screen space.
// p is the perspective factor: ~0 at the horizon, 1 at the bottom edge.
export function project(z, worldX) {
  const p = CONFIG.zNear / z;
  const y = CONFIG.horizonY + (BOTTOM - CONFIG.horizonY) * p;
  const x = CENTER_X + worldX * CONFIG.roadHalfWidthBottom * p;
  return { x, y, p };
}

// Screen x of the player, who always stands at the bottom of the screen.
export function playerScreenX(worldX) {
  return CENTER_X + worldX * CONFIG.roadHalfWidthBottom * 0.85;
}
