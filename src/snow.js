/** Bounded pixel snowfall. Shares the game's frame clock and discovered ledges. */
export function createSnow(root) {
  const canvas = document.createElement('canvas');
  canvas.className = 'christmas-snow'; canvas.setAttribute('aria-hidden', 'true');
  root.append(canvas);
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, flakes = [], piles = [];
  const reset = (flake, initial = false) => Object.assign(flake, {
    x: Math.random() * width, y: initial ? Math.random() * height : -8,
    speed: 15 + Math.random() * 24, size: Math.random() < .8 ? 2 : 3,
    phase: Math.random() * Math.PI * 2,
  });
  return {
    update(dt, elapsed, surfaces) {
      if (width !== innerWidth || height !== innerHeight) {
        width = canvas.width = innerWidth; height = canvas.height = innerHeight;
        const count = Math.min(80, Math.max(16, Math.round(width * height / 24000)));
        flakes = Array.from({ length: count }, () => reset({}, true));
      }
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      piles = piles.filter(pile => {
        const surface = surfaces.find(s => s.anchor === pile.anchor && s.part === pile.part &&
          s.originLeft + pile.offset >= s.left && s.originLeft + pile.offset + 12 <= s.right);
        if (!surface || surface.y < 0 || surface.y > height) return false;
        const x = Math.round(surface.originLeft + pile.offset), y = Math.round(surface.y);
        const depth = Math.min(6, 1 + Math.floor(pile.hits / 2));
        ctx.fillStyle = '#698a9d'; ctx.globalAlpha = .8; ctx.fillRect(x - 1, y - 2, 14, 3);
        ctx.fillRect(x + 1, y - depth - 2, 10, depth + 2);
        ctx.fillStyle = '#f4f9fc'; ctx.globalAlpha = .92;
        ctx.fillRect(x, y - 2, 12, 2); ctx.fillRect(x + 2, y - depth - 1, 8, depth);
        if (depth > 3) ctx.fillRect(x + 4, y - depth - 2, 4, 1);
        return true;
      });
      for (const flake of flakes) {
        const oldY = flake.y;
        flake.y += flake.speed * dt;
        flake.x += (4 + Math.sin(elapsed / 1600 + flake.phase) * 9) * dt;
        const hit = surfaces.filter(s => s.y >= oldY && s.y <= flake.y + flake.size &&
          flake.x >= s.left && flake.x + 12 <= s.right && s.y > 8).sort((a, b) => a.y - b.y)[0];
        if (hit) {
          const offset = Math.round((flake.x - hit.originLeft) / 12) * 12;
          let pile = piles.find(p => p.anchor === hit.anchor && p.part === hit.part && Math.abs(p.offset - offset) < 12);
          if (pile) pile.hits = Math.min(12, pile.hits + 1);
          else if (piles.length < 100) piles.push({ anchor: hit.anchor, part: hit.part, offset, hits: 1 });
          reset(flake);
        } else if (flake.y > height || flake.x > width + 4) reset(flake);
        ctx.globalAlpha = .8; ctx.fillStyle = '#64849a';
        ctx.fillRect(Math.round(flake.x) - 1, Math.round(flake.y), flake.size + 2, flake.size + 1);
        ctx.globalAlpha = .95; ctx.fillStyle = '#f6fbff';
        ctx.fillRect(Math.round(flake.x), Math.round(flake.y), flake.size, flake.size);
      }
      ctx.globalAlpha = 1;
    },
    destroy() { canvas.remove(); flakes = []; piles = []; },
  };
}
