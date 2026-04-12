export type ScaleMode = "fit" | "fill";

export type HorizontalAlignment = "left" | "center" | "right";
export type VerticalAlignment = "top" | "center" | "bottom";

export type Position = "sticky" | "absolute" | "static";

export type AnimationType =
  | "fadeIn"
  | "fadeOut"
  | "moveUp"
  | "moveDown"
  | "moveLeft"
  | "moveRight"
  | "scaleUp"
  | "scaleDown";

export type EasingFunction = (t: number) => number;

export type EasingName = "linear" | "easeIn" | "easeOut" | "easeInOut";

export interface SceneConfig {
  images: string[];
  duration?: number;
  scaleMode?: ScaleMode;
  horizontalAlignment?: HorizontalAlignment;
  verticalAlignment?: VerticalAlignment;
}

export interface EngineConfig {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  scenes: SceneConfig[];
  scrollDelay?: number;
  onProgress?: (progress: number, sceneIndex: number, sceneProgress: number) => void;
  onPreloadProgress?: (loaded: number, total: number) => void;
  preloadPercentage?: number;
  /** Extra scroll distance (px) at the end not mapped to frame progress. Used for exit transitions. */
  scrollPadding?: number;
  /** Multiplier for reverse (scroll-up) lerp speed. 1 = same as forward, 2 = twice as fast. Default 1. */
  reverseSpeedMultiplier?: number;
  /** Deceleration factor (0-1). Higher = snappier stop, lower = more gradual. Default 0.65. */
  stopDeceleration?: number;
  /** Overlap offset (px) to subtract from scroll position so frames start at 0 when the visible container is at the viewport top. Default 0. */
  overlapTop?: number;
}

export interface SceneState {
  config: SceneConfig;
  images: HTMLImageElement[];
  startProgress: number;
  endProgress: number;
  frameCount: number;
}

export interface PreloadResult {
  images: HTMLImageElement[];
  loaded: number;
  total: number;
}
