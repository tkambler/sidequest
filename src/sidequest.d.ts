export interface TurkeyOptions {
  /** Maximum concurrent turkeys and roasts, excluding the single cowboy. Default 5. */
  maxTurkeys?: number;
  /** Random delay between arrivals, in milliseconds. Default [7000, 14000]. */
  spawnInterval?: [number, number];
  /** Each live visitor's lifetime, in active milliseconds. Default [45000, 90000]. */
  lifetime?: [number, number];
  /** Random active milliseconds between turkey droppings. Default [12000, 26000]. False disables. */
  poopInterval?: [number, number] | false;
  /** Dropping lifetime in active milliseconds. Default 6000. */
  poopLifetime?: number;
  /** Include one interactive cowboy. Default true. */
  cowboy?: boolean;
  /** Cowboy width in CSS pixels. Default 48. */
  cowboySize?: number;
  /** Maximum cowboy speed under player control, in pixels per second. Default 420. */
  cowboySpeed?: number;
  /** Random active milliseconds between autonomous shot attempts. Default [6500, 12000]. False disables autonomous shots and pursuit. */
  autoShotInterval?: [number, number] | false;
  /** Probability of accurate autonomous aim. Default .6; moving targets can still dodge. */
  autoShotAccuracy?: number;
  /** Called once when a player or autonomous shot is fired. */
  onShot?: () => void;
  /** Called once per turkey hit, after the sprite is replaced with a roast. */
  onTurkeyHit?: () => void;
  /** Active milliseconds before a prepared roast fades away. Default 8000. */
  roastLifetime?: number;
  /** Turkey width and height in CSS pixels. Default 30. */
  size?: number;
  /** Turkey walking speed in pixels per second. Default 20. */
  speed?: number;
  /** Maximum distance between nearby perches, in pixels. Default 130. */
  jumpDistance?: number;
  /** Maximum vertical separation between perches, in pixels. Default 72. */
  jumpHeight?: number;
  /** CSS selector for candidates. Only exposed text or painted edges become perches. */
  perchSelector?: string;
  /** Excludes matching elements and descendants. Default '[data-turkey-ignore]'. */
  excludeSelector?: string;
  /** Suppress the scene when reduced motion is requested. Default true. */
  respectReducedMotion?: boolean;
}
export interface TurkeyFlock {
  start(): TurkeyFlock;
  /** Add a turkey now; false when stopped, paused, motion-blocked, or full. */
  spawn(character?: 'turkey'): boolean;
  pause(): TurkeyFlock;
  resume(): TurkeyFlock;
  /** Remove the entire scene and all listeners. Restartable. */
  stop(): TurkeyFlock;
  destroy(): void;
  /** Number of turkeys and roasts; excludes the cowboy. */
  readonly count: number;
  readonly running: boolean;
  readonly paused: boolean;
  readonly controlled: boolean;
}
export function createTurkeys(options?: TurkeyOptions): TurkeyFlock;
export function turkeySVG(): string;
export function cowboySVG(): string;
export function roastSVG(): string;

export interface OrcOptions {
  size?: number;
  speed?: number;
  /** Active milliseconds between automatic arrow attempts. Default [3000, 6500]. */
  autoShotInterval?: [number, number] | false;
  autoShotAccuracy?: number;
  /** Active flame lifetime in ms. Default 10000. */
  fireLifetime?: number;
  maxFires?: number;
  maxArrows?: number;
  targetSelector?: string;
  excludeSelector?: string;
  respectReducedMotion?: boolean;
  onShot?: (shot: {power: number}) => void;
  onElementHit?: (element: Element) => void;
}
export interface OrcGame {
  start(): OrcGame;
  pause(): OrcGame;
  resume(): OrcGame;
  stop(): OrcGame;
  destroy(): void;
  readonly running: boolean;
  readonly paused: boolean;
  readonly controlled: boolean;
  readonly fireCount: number;
  readonly arrowCount: number;
}
export function createOrcGame(options?: OrcOptions): OrcGame;
export function orcSVG(): string;
