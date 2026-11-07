// Conservative painted ledges. Never treat a layout box alone as a platform.
let paintContext;
const colors = new Map();
function context() {
  return paintContext ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
}
function rgba(value) {
  if (!colors.has(value)) {
    const ctx = context();
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    if (colors.size > 500) colors.clear();
    colors.set(value, [...ctx.getImageData(0, 0, 1, 1).data]);
  }
  return colors.get(value);
}

export function visiblePerches(config) {
  const result = [], styles = new Map(), visibility = new Map(), opacities = new Map(), textGeometry = new Map();
  const styleOf = element => {
    if (!styles.has(element)) styles.set(element, getComputedStyle(element));
    return styles.get(element);
  };
  function visible(element) {
    if (!element) return true;
    if (visibility.has(element)) return visibility.get(element);
    const style = styleOf(element);
    const matrix = style.transform === 'none' ? null : new DOMMatrixReadOnly(style.transform);
    const parentVisible = visible(element.parentElement);
    const opacity = Number(style.opacity) * (opacities.get(element.parentElement) ?? 1);
    opacities.set(element, opacity);
    const ok = style.display !== 'none' && style.visibility === 'visible' &&
      opacity > .05 && style.contentVisibility !== 'hidden' &&
      style.clipPath === 'none' && (!matrix || (matrix.is2D && matrix.a === 1 && matrix.d === 1 && !matrix.b && !matrix.c)) &&
      parentVisible;
    visibility.set(element, ok);
    return ok;
  }
  function backdrop(element, includeSelf = false) {
    for (let parent = includeSelf ? element : element.parentElement; parent; parent = parent.parentElement) {
      const color = rgba(styleOf(parent).backgroundColor);
      if (color[3] > 240) return color;
    }
    return [255, 255, 255, 255];
  }
  const contrasts = (color, behind) => color[3] > 32 &&
    color.slice(0, 3).some((n, i) => Math.abs(n - behind[i]) * color[3] / 255 > 6);
  function painted(element, style) {
    const behind = backdrop(element);
    const border = parseFloat(style.borderTopWidth) > 0 &&
      ['solid', 'double', 'ridge', 'groove', 'inset', 'outset'].includes(style.borderTopStyle) && contrasts(rgba(style.borderTopColor), behind);
    if (border) return true;
    const fill = rgba(style.backgroundColor);
    // A background identical to its surroundings has no visible top edge.
    return contrasts(fill, behind);
  }

  function textLines(node) {
    if (textGeometry.has(node)) return textGeometry.get(node);
    const text = node.textContent, style = styleOf(node.parentElement);
    if (!text.trim() || !contrasts(rgba(style.color), backdrop(node.parentElement, true))) return [];
    const range = document.createRange();
    range.setStart(node, text.length - text.trimStart().length);
    range.setEnd(node, text.trimEnd().length);
    const ctx = context();
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const metrics = ctx.measureText(text.trim());
    const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize);
    const offset = Math.max(0, ascent - metrics.actualBoundingBoxAscent);
    const lines = [...range.getClientRects()].map((rect, index) => ({ node, index, rect, y: rect.top + offset }));
    textGeometry.set(node, lines);
    return lines;
  }
  function inkAt(element, x, y) {
    if (!visible(element)) return false;
    const style = styleOf(element), rect = element.getBoundingClientRect();
    if (rgba(style.backgroundColor)[3] > 32 || style.backgroundImage !== 'none' ||
        /^(IMG|SVG|CANVAS|VIDEO|IFRAME)$/.test(element.tagName)) return true;
    for (const [side, distance] of [['Top', y - rect.top], ['Bottom', rect.bottom - y], ['Left', x - rect.left], ['Right', rect.right - x]]) {
      if (distance < parseFloat(style[`border${side}Width`]) && rgba(style[`border${side}Color`])[3] > 32) return true;
    }
    return [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE &&
      textLines(node).some(line => x >= line.rect.left && x <= line.rect.right && y >= line.y && y <= line.rect.bottom));
  }
  function clearTo(hit, element, x, y) {
    // Transparent descendants and empty text-box margins do not cover paint.
    for (let node = hit; node && node !== element && !node.contains(element); node = node.parentElement) {
      if (inkAt(node, x, y)) return false;
    }
    return true;
  }
  const nodes = [...document.querySelectorAll(config.perchSelector)].slice(0, 1500);
  // Hit testing omits pointer-events:none overlays. Conservatively reserve their
  // painted rectangles as well, so decorations cannot become invisible obstacles.
  const blockers = nodes.filter(element => {
    const style = styleOf(element);
    return style.pointerEvents === 'none' && ['fixed', 'absolute'].includes(style.position) &&
      visible(element) && painted(element, style);
  }).map(element => ({ element, rect: element.getBoundingClientRect() }));
  let samples = 0;
  function add(element, anchor, part, rect, y, insetLeft = 0, insetRight = 0) {
    const left = Math.max(0, rect.left + insetLeft), right = Math.min(innerWidth, rect.right - insetRight);
    if (right - left < config.size + 8 || y < config.size || y >= innerHeight) return;
    let start = null;
    const flush = end => {
      if (start !== null && end - start >= config.size + 8) {
        result.push({ element, anchor, part, left: start, right: end, y, originLeft: rect.left });
      }
      start = null;
    };
    // Split an edge into exposed spans; a covered midpoint cannot hide exposed ends,
    // and a visible midpoint cannot make a covered end walkable.
    for (let x = left; x < right; x += 8) {
      if (++samples > 8000) { flush(x); return; }
      const end = Math.min(x + 8, right), middle = (x + end) / 2;
      const support = document.elementFromPoint(middle, y + .5);
      let exposed = support && element.contains(support) && clearTo(support, element, middle, y + .5);
      if (blockers.some(blocker => !blocker.element.contains(element) &&
          end > blocker.rect.left && x < blocker.rect.right &&
          blocker.rect.top <= y + .5 && blocker.rect.bottom >= y - config.size)) exposed = false;
      if (exposed) {
        for (const height of [1, config.size / 2, config.size - 1]) {
          const hit = document.elementFromPoint(middle, y - height);
          if (hit && !clearTo(hit, element, middle, y - height)) { exposed = false; break; }
        }
      }
      if (exposed) { if (start === null) start = x; }
      else flush(x);
      if (end === right) flush(end);
    }
  }

  let textCount = 0;
  for (let i = 0; i < Math.min(nodes.length, 1500) && samples < 8000; i++) {
    const element = nodes[i];
    if (element.closest(config.excludeSelector) || !visible(element)) continue;
    const rect = element.getBoundingClientRect();
    if (rect.bottom < config.size || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) continue;
    const style = styleOf(element);
    if (painted(element, style)) {
      // Skip the rounded corners: the top edge only starts after each radius.
      const radius = value => value.endsWith('%') ? rect.width * parseFloat(value) / 100 : parseFloat(value) || 0;
      add(element, element, 'box', rect, rect.top, radius(style.borderTopLeftRadius), radius(style.borderTopRightRadius));
      continue;
    }
    // Transparent containers can contribute actual text, never their empty padding.
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const lines = [];
    for (let node = walker.nextNode(); node && textCount < 6000; node = walker.nextNode()) {
      if (!node.textContent.trim() || node.parentElement.closest(config.perchSelector) !== element ||
          /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|SELECT|OPTION)$/.test(node.parentElement.tagName) || !visible(node.parentElement)) continue;
      textCount++;
      const textStyle = styleOf(node.parentElement);
      if (!contrasts(rgba(textStyle.color), backdrop(node.parentElement, true)) || parseFloat(textStyle.fontSize) < 8) continue;
      lines.push(...textLines(node));
    }
    // Only the uppermost line is an exposed roof; lower lines have text overhead.
    const top = Math.min(...lines.map(line => line.rect.top));
    for (const line of lines) {
      if (Math.abs(line.rect.top - top) < 2) add(line.node.parentElement, line.node, line.index, line.rect, line.y);
    }
  }
  return result;
}
