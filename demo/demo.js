import { createTurkeys, turkeySVG, cowboySVG, createOrcGame, orcSVG } from '../src/sidequest.js';
const picker = document.querySelector('#game-mode');
const isOrc = () => picker.value === 'orc';
document.querySelector('.brand-bird').innerHTML = turkeySVG();
const audio = (name, volume) => {
  const clip = new Audio(new URL(`./assets/${name}`, import.meta.url));
  clip.preload = 'none'; clip.volume = volume; return clip;
};
const gobble = audio('gobble1.mp3', .5);
const hitGobble = audio('gobble2.mp3', .2);
const shotSound = audio('revolver-single-shot.mp3', .2);
const play = clip => { clip.pause(); clip.currentTime = 0; void clip.play().catch(() => {}); };
const quiet = () => { for (const clip of [gobble, hitGobble, shotSound]) { clip.pause(); clip.currentTime = 0; } };
const makeGame = () => isOrc() ? createOrcGame() : createTurkeys({
  onShot() { play(shotSound); }, onTurkeyHit() { play(hitGobble); },
  maxTurkeys: 6, spawnInterval: [3500, 7000], lifetime: [60000, 100000],
});
let game = makeGame();
window.demoFlock = game; window.demoGame = game;
const toggle = document.querySelector('#toggle'), add = document.querySelector('#add');
const status = document.querySelector('#status');
const media = matchMedia('(prefers-reduced-motion: reduce)');
function preview() {
  const orc = isOrc(), specimen = document.querySelector('.specimen-bird');
  specimen.classList.toggle('duo', !orc);
  specimen.innerHTML = orc ? `<span>${orcSVG()}</span>` : `<span>${turkeySVG()}</span><span>${cowboySVG()}</span>`;
  document.querySelector('.specimen').setAttribute('aria-label', orc ? 'Pixel-art orc archer, shown enlarged' : 'Pixel-art turkey and cowboy, shown enlarged');
  document.querySelector('#headline-verb').textContent = orc ? 'mischief.' : 'gobble.';
  document.querySelector('.annotation').innerHTML = orc ? 'one small orc,<br>a big fire hazard' : 'a gobbler &amp;<br>a little gunslinger';
  document.querySelector('.size-label').innerHTML = orc ? '48 px archer<br><span>arrows with a little extra heat</span>' : '30 px turkeys<br><span>one 48 px cowboy</span>';
  document.querySelector('.lede').textContent = orc ? 'A little orc with a very big grudge against your webpage. Flaming arrows, tiny fires, and absolutely no lasting damage.' : 'Tiny turkeys. Big holiday energy. Let a few pixel-art visitors wander, flap, and hop around your webpage.';
  document.querySelector('.rider-instructions').innerHTML = orc ? '<strong>A bow. A grudge. Some bad aim.</strong> The orc patrols the screen and shoots at page elements. Hits leave tiny flames that follow their target and burn out. Click him to take control: A / D move, hold and release to fire. Escape hands control back.' : '<strong>Meet your tiny trail buddy.</strong> Click the cowboy to take control. A / D move, the mouse aims, and holding then releasing a click fires a charged shot. Click him again or press Escape to return to patrol. Page clicks are blocked in control mode.';
  document.querySelector('#playground-title').textContent = orc ? 'A little target practice.' : 'A place to stretch their legs.';
  const copies = orc ? ['A perfectly flammable headline.', 'An excellent place to miss.', 'Please do not feed the archer.'] : ['Headlines make lovely sidewalks.', 'A quick flap. A little hop.', 'Absolutely nowhere to be.'];
  document.querySelectorAll('.perch-copy').forEach((node, i) => { node.textContent = copies[i]; });
  document.querySelector('.habitat-label').innerHTML = orc ? 'TARGET PRACTICE <span aria-hidden="true">↘</span>' : 'LIVE HABITAT <span aria-hidden="true">↘</span>';
  document.querySelector('.habitat-note').textContent = orc ? 'The rest of this page is fair game, too.' : "Psst. They'll explore the rest of this page, too.";
  document.querySelector('.side-note').textContent = orc ? 'No actual damage done.' : 'No feeding required.';
  document.querySelector('#snippet-factory').textContent = orc ? 'createOrcGame' : 'createTurkeys';
  document.querySelectorAll('.traits p')[1].innerHTML = orc ? '<span aria-hidden="true">⌁</span> Flaming arrows. Questionable aim.' : '<span aria-hidden="true">⌁</span> One cowboy. You’re in control.';
  document.querySelectorAll('.traits p')[2].innerHTML = orc ? '<span aria-hidden="true">♡</span> Click the orc to play' : '<span aria-hidden="true">♡</span> Click the cowboy to play';
  add.hidden = orc;
}
function update() {
  const orc = isOrc(), count = orc ? game.fireCount : game.count;
  if (document.querySelector('#count').textContent !== String(count)) document.querySelector('#count').textContent = count;
  const countType = orc ? 'small fires' : '/ 6 visitors';
  if (document.querySelector('#count-type').textContent !== countType) document.querySelector('#count-type').textContent = countType;
  add.disabled = orc || !game.running || media.matches || count >= 6;
  const character = orc ? 'orc' : 'cowboy';
  const message = media.matches ? 'Reduced motion is on. The visitors will stay tucked away.' : game.controlled ? `A / D move. Hold to charge, release to fire. Click the ${character} or press Escape to leave control mode.` : game.running ? orc ? 'The archer is loose. Watch for flaming arrows and tiny fires.' : 'They’re loose! Click the cowboy at the bottom of the screen to take control.' : orc ? 'The orc is waiting for his cue.' : 'Your visitors are waiting in the wings.';
  if (status.textContent !== message) status.textContent = message;
  toggle.setAttribute('aria-pressed', String(game.running));
  const label = game.running ? orc ? 'Send the orc home' : 'Gather the visitors' : orc ? 'Release the orc' : 'Release the visitors';
  if (toggle.dataset.label !== label) { toggle.dataset.label = label; toggle.innerHTML = `<span class="button-icon" aria-hidden="true">${game.running ? '↙' : '✦'}</span> ${label} <span aria-hidden="true">${game.running ? '✓' : '↗'}</span>`; }
}
toggle.addEventListener('click', () => {
  if (game.running) { game.stop(); quiet(); }
  else { game.start(); if (!isOrc()) play(gobble); }
  update();
});
picker.addEventListener('change', () => {
  const wasRunning = game.running; game.destroy(); quiet(); game = makeGame();
  window.demoFlock = game; window.demoGame = game;
  preview(); if (wasRunning) game.start(); update();
});
add.addEventListener('click', () => { if (!isOrc()) game.spawn(); update(); });
media.addEventListener('change', update);
setInterval(update, 500); preview(); update();
const snippet = () => `<script src="./sidequest.js"></script>\n<script>\n  const flock = Sidequest.${isOrc() ? 'createOrcGame' : 'createTurkeys'}();\n  flock.start();\n</script>`;
document.querySelector('#copy').addEventListener('click', async event => {
  try { await navigator.clipboard.writeText(snippet()); event.target.textContent = 'Copied!'; }
  catch { event.target.textContent = 'Select code to copy'; }
  setTimeout(() => { event.target.textContent = 'Copy snippet'; }, 2200);
});
