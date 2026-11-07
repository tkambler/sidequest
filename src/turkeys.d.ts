export interface TurkeyOptions {
  /** Maximum concurrent visitors. Default 5. */
  maxTurkeys?: number;
  /** Random delay between arrivals, in milliseconds. Default [7000, 14000]. */
  spawnInterval?: [number, number];
  /** Each visitor's lifetime, in active milliseconds. Default [45000, 90000]. */
  lifetime?: [number, number];
  /** Sprite width and height in CSS pixels. Default 30. */
  size?: number;
  /** Walking speed in pixels per second. Default 20. */
  speed?: number;
  /** Maximum distance between nearby perches, in pixels. Default 130. */
  jumpDistance?: number;
  /** Maximum vertical separation between perches, in pixels. Default 72. */
  jumpHeight?: number;
  /** CSS selector for elements whose top edges can be walked on. */
  perchSelector?: string;
  /** Excludes matching elements and their descendants. Default '[data-turkey-ignore]'. */
  excludeSelector?: string;
  /** Suppress the flock when reduced motion is requested. Default true. */
  respectReducedMotion?: boolean;
}
export interface TurkeyFlock {
  /** Start, or resume an already running flock. Requires document.body. */
  start(): TurkeyFlock;
  /** Try to add a visitor immediately. False when inactive, blocked, or full. */
  spawn(): boolean;
  /** Freeze the flock, retaining visitors. */
  pause(): TurkeyFlock;
  resume(): TurkeyFlock;
  /** Remove all visitors, listeners, observers, and animation work. Can be restarted. */
  stop(): TurkeyFlock;
  /** Stop permanently. */
  destroy(): void;
  readonly count: number;
  readonly running: boolean;
  readonly paused: boolean;
}
export function createTurkeys(options?: TurkeyOptions): TurkeyFlock;
/** A self-contained decorative SVG string, for previews. */
export function turkeySVG(): string;
