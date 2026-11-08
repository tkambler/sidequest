import { start, turkeySVG, cowboySVG, orcSVG, santaSVG, childSVG } from '../src/sidequest.js';
const picker = document.querySelector('#game-mode');
const isOrc = () => picker.value === 'orc';
const isSanta = () => picker.value === 'santa';
document.querySelector('.brand-bird').innerHTML = turkeySVG();
const characterArt = { turkey: turkeySVG, cowboy: cowboySVG, orc: orcSVG, santa: santaSVG,
  boy: () => childSVG('boy'), girl: () => childSVG('girl') };
for (const node of document.querySelectorAll('[data-character]')) {
  node.innerHTML = characterArt[node.dataset.character]();
}
const audio = (name, volume) => {
  const clip = new Audio(new URL(`./assets/${name}`, import.meta.url));
  clip.preload = 'none'; clip.volume = volume; return clip;
};
const gobble = audio('gobble1.mp3', .5);
const hitGobble = audio('gobble2.mp3', .2);
const shotSound = audio('revolver-single-shot.mp3', .2);
const arrowSound = audio('arrow-swish.mp3', .4);
const play = clip => { clip.pause(); clip.currentTime = 0; void clip.play().catch(() => {}); };
const quiet = () => { for (const clip of [gobble, hitGobble, shotSound, arrowSound]) { clip.pause(); clip.currentTime = 0; } };
const makeGame = () => isSanta() ? start({ mode: 'santa' }) : isOrc() ? start({ mode: 'orc',
  onShot() { play(arrowSound); },
}) : start({ mode: 'turkeys',
  onShot() { play(shotSound); }, onTurkeyHit() { play(hitGobble); },
  maxTurkeys: 6, spawnInterval: [3500, 7000], lifetime: [60000, 100000],
});
let game = null;
window.demoFlock = game; window.demoGame = game;
const toggle = document.querySelector('#toggle');
const status = document.querySelector('#status');
const media = matchMedia('(prefers-reduced-motion: reduce)');
function preview() {
  const orc = isOrc();
  document.querySelector('#headline-verb').textContent = orc ? 'mischief.' : 'gobble.';
  document.querySelector('.lede').textContent = orc ? 'A little orc with a very big grudge against your webpage. Flaming arrows, tiny fires, and absolutely no lasting damage.' : 'Tiny turkeys. Big holiday energy. Let a few pixel-art visitors wander, flap, and hop around your webpage.';
  document.querySelector('.rider-instructions').innerHTML = orc ? '<strong>A bow. A grudge. Some bad aim.</strong> The orc patrols the screen and shoots at page elements. Hits leave tiny flames that follow their target and burn out. Click him to take control: A / D move, hold and release to fire. Escape hands control back.' : '<strong>Meet your tiny trail buddy.</strong> Click the cowboy to take control. A / D move, the mouse aims, and holding then releasing a click fires a charged shot. Click him again or press Escape to return to patrol. Page clicks are blocked in control mode.';
  document.querySelector('.side-note').textContent = orc ? 'No actual damage done.' : 'No feeding required.';
  if (isSanta()) {
    document.querySelector('#headline-verb').textContent = 'wonder.';
    document.querySelector('.lede').textContent = 'Tiny waving children. A sleigh full of surprises. Let Santa bring a little Christmas magic to your webpage.';
    document.querySelector('.rider-instructions').innerHTML = '<strong>A present for everyone.</strong> Children appear on the page and wave for Santa. Watch him fly in, gently land beside each waiting child, and leave a wrapped gift before taking off. Click Santa to pilot: W / A / S / D fly, the mouse aims, and holding then releasing a click tosses a present. Click Santa again or press Escape for automatic deliveries.';
    document.querySelector('.side-note').textContent = 'A little Christmas magic.';
  }
  document.querySelector('#snippet-mode').textContent = picker.value;
}
function update() {
  const orc = isOrc();
  const character = isSanta() ? 'Santa' : orc ? 'orc' : 'cowboy';
  const message = media.matches ? 'Reduced motion is on. The visitors will stay tucked away.' : isSanta() && game?.crashing ? 'Santa’s been hit! He’s crashing to the ground.' : isSanta() && game?.recovering ? 'Santa will be back in a few seconds. The children are still waiting.' : game?.controlled ? isSanta() ? 'W / A / S / D fly. Aim, hold to charge, release to toss. Click Santa or press Escape for automatic deliveries.' : `A / D move. Hold to charge, release to fire. Click the ${character} or press Escape to leave control mode.` : game?.running ? isSanta() ? 'Watch Santa deliver, or click him to pilot the sleigh and toss presents.' : orc ? 'The archer is loose. Watch for flaming arrows and tiny fires.' : 'They’re loose! Click the cowboy at the bottom of the screen to take control.' : isSanta() ? 'Santa is checking his list.' : orc ? 'The orc is waiting for his cue.' : 'Your visitors are waiting in the wings.';
  if (status.textContent !== message) status.textContent = message;
  toggle.setAttribute('aria-pressed', String(Boolean(game?.running)));
  const label = isSanta() ? (game?.running ? 'Send Santa home' : 'Start Christmas') : game?.running ? orc ? 'Send the orc home' : 'Gather the visitors' : orc ? 'Release the orc' : 'Release the visitors';
  if (toggle.dataset.label !== label) { toggle.dataset.label = label; toggle.innerHTML = `<span class="button-icon" aria-hidden="true">${game?.running ? '↙' : '✦'}</span> ${label} <span aria-hidden="true">${game?.running ? '✓' : '↗'}</span>`; }
}
toggle.addEventListener('click', () => {
  if (game?.running) { game.stop(); quiet(); }
  else {
    if (game) game.start(); else game = makeGame();
    window.demoFlock = game; window.demoGame = game;
    if (!isOrc() && !isSanta()) play(gobble);
  }
  update();
});
picker.addEventListener('change', () => {
  const wasRunning = game?.running; game?.destroy(); quiet(); game = wasRunning ? makeGame() : null;
  window.demoFlock = game; window.demoGame = game;
  preview(); update();
});
media.addEventListener('change', update);
setInterval(update, 500); preview(); update();
const snippet = () => `<script src="./sidequest.js"></script>\n<script>\n  const game = Sidequest.start({ mode: '${picker.value}' });\n</script>`;
document.querySelector('#copy').addEventListener('click', async event => {
  try { await navigator.clipboard.writeText(snippet()); event.target.textContent = 'Copied!'; }
  catch { event.target.textContent = 'Select code to copy'; }
  setTimeout(() => { event.target.textContent = 'Copy snippet'; }, 2200);
});
