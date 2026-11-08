import { createRanger } from './ranger.js';
import { autoAimPose } from './ballistics.js';

// Cowboy-only pursuit policy. Target positions come from the live flock; this
// does no DOM work and leaves the shared ranger's player controls untouched.
export function cowboyPursuit({ x, bottom, width, size, targets, targetId }) {
  const center = x + size / 2;
  const candidates = targets.filter(target => {
    if (target.x < 0 || target.x > width || target.y < 0 || target.y > bottom) return false;
    const underneath = Math.max(0, Math.min(width - size, target.x - size / 2));
    return autoAimPose(underneath, bottom, size, target.x < underneath + size / 2 ? -1 : 1, target, 1);
  });
  const nearest = candidates.reduce((best, target) => !best ||
    Math.hypot(target.x - center, target.y - bottom) < Math.hypot(best.x - center, best.y - bottom) ? target : best, null);
  if (!nearest) return null;
  const direction = nearest.x < center ? -1 : 1;
  // Different start/stop distances keep a moving turkey from making him stutter.
  const range = nearest.id === targetId ? 400 : 600;
  if (Math.abs(nearest.x - center) <= range && autoAimPose(x, bottom, size, direction, nearest, 1)) return null;
  return { id: nearest.id, direction };
}

/** Slim cowboy on foot. Rifle pivot (19,23), muzzle (37,23), in a 40x42 viewBox. */
export function cowboySVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 42" shape-rendering="crispEdges" aria-hidden="true">
    <path fill="#765331" d="M16 1h7v5h5v2H11V6h5z"/>
    <path fill="#a17b4c" d="M17 1h6v2h-6z"/><path fill="#4f3c28" d="M16 5h7v1h-7zM11 7h17v1H11z"/>
    <path fill="#bd8c5e" d="M16 8h7v7h-5v-1h-2z"/>
    <path fill="#e4b986" d="M18 8h5v3h1v1h-1v3h-4v-2h-1z"/>
    <path fill="#f0cfa5" d="M19 9h3v3h-2v1h-1z"/><path fill="#3d4038" d="M22 10h1v1h-1z"/>
    <path fill="#cc9e70" d="M18 15h4v3h-4z"/>
    <path fill="#e3ddc1" d="M16 17h7v3h1v9H15v-9h1z"/>
    <path fill="#f1ead3" d="M18 18h3v10h-3z"/>
    <path fill="#746b50" d="M16 17h2v4h-1v8h-2v-9h1zm6 0h1v3h1v9h-2z"/>
    <path fill="#a58d61" d="M16 18h1v9h-1zm6 2h1v7h-1z"/>
    <path fill="#bd9266" d="M14 20h2v8h-1v3h-2v-5h1z"/>
    <path fill="#e2b581" d="M14 22h1v6h-1zm-1 7h2v2h-2z"/>
    <path fill="#c49a6d" d="M23 20h2v4h-1v2h-4v-2h3z"/>
    <path fill="#444840" d="M15 29h9v2h-9z"/><path fill="#b4a477" d="M19 29h2v1h-2z"/>
    <g class="cowboy-leg leg-a"><path fill="#373c35" d="M16 31h3v9h1v2h-6v-2h2z"/><path fill="#646957" d="M16 32h1v8h-1z"/></g>
    <g class="cowboy-leg leg-b"><path fill="#44493e" d="M22 31h2v9h2v2h-4z"/><path fill="#747561" d="M23 32h1v8h-1z"/></g>
    <g class="rifle"><path fill="#493c2e" d="M16 22h6v1h15v2H22v1h-3v-1h-3z"/><path fill="#9a6b3e" d="M16 23h6v1h-2v1h-4z"/><path fill="#969b8a" d="M23 23h14v1H23z"/><path fill="#e4b986" d="M19 23h2v2h-2z"/>
    <g class="muzzle-flash" style="display:none" fill="#f5cb61"><path d="M38 20h1v2h2v2h-2v2h-1v-2h-2v-2h2z"/><path fill="#fff2c1" d="M37 22h3v2h-3z"/></g></g>
  </svg>`;
}

export function createCowboy(options) {
  return createRanger({ ...options, pursue: cowboyPursuit, artwork: cowboySVG, kind: 'cowboy', weapon: 'rifle' });
}
