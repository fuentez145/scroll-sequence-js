type ScaleMode = "fit" | "fill";
type HorizontalAlignment = "left" | "center" | "right";
type VerticalAlignment = "top" | "center" | "bottom";
type Position = "sticky" | "absolute" | "static";
type AnimationType = "fadeIn" | "fadeOut" | "moveUp" | "moveDown" | "moveLeft" | "moveRight" | "scaleUp" | "scaleDown";
type EasingFunction = (t: number) => number;
type EasingName = "linear" | "easeIn" | "easeOut" | "easeInOut";
interface SceneConfig {
    images: string[];
    duration?: number;
    scaleMode?: ScaleMode;
    horizontalAlignment?: HorizontalAlignment;
    verticalAlignment?: VerticalAlignment;
}
interface EngineConfig {
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
interface SceneState {
    config: SceneConfig;
    images: HTMLImageElement[];
    startProgress: number;
    endProgress: number;
    frameCount: number;
}

declare class ScrollEngine {
    private renderer;
    private container;
    private canvas;
    private scenes;
    private scrollDelay;
    private onProgress?;
    private targetProgress;
    private currentProgress;
    private rafId;
    private isActive;
    private isReady;
    private observer;
    private resizeObserver;
    private preloadPercentage;
    private scrollPadding;
    private reverseSpeedMultiplier;
    private stopDeceleration;
    private overlapTop;
    private lastTickTime;
    private totalFrameCount;
    constructor(config: EngineConfig);
    private initScenes;
    private start;
    private handleScroll;
    private handleResize;
    private startAnimationLoop;
    private stopAnimationLoop;
    private tick;
    private drawCurrentFrame;
    resolveFrame(progress: number): {
        sceneIndex: number;
        frameIndex: number;
        sceneProgress: number;
    };
    getProgress(): number;
    getScenes(): SceneState[];
    destroy(): void;
}

interface RenderOptions {
    scaleMode: ScaleMode;
    horizontalAlignment: HorizontalAlignment;
    verticalAlignment: VerticalAlignment;
}
declare class FrameRenderer {
    private canvas;
    private ctx;
    private lastDrawnImage;
    private lastWidth;
    private lastHeight;
    private lastOptions;
    constructor(canvas: HTMLCanvasElement);
    resize(width: number, height: number): void;
    drawFrame(image: HTMLImageElement | null, options?: Partial<RenderOptions>): void;
    clear(): void;
}

interface PreloadProgress {
    loaded: number;
    total: number;
    percent: number;
}
type PreloadProgressCallback = (progress: PreloadProgress) => void;
declare function preloadImages(urls: string[], onProgress?: PreloadProgressCallback): Promise<HTMLImageElement[]>;
declare function generateImageUrls(pattern: string, count: number, startIndex?: number, padLength?: number): string[];

declare const easings: Record<EasingName, EasingFunction>;
declare function resolveEasing(easing: EasingName | EasingFunction | undefined): EasingFunction;
declare function lerp(a: number, b: number, t: number): number;
declare function clamp(value: number, min: number, max: number): number;
declare function inverseLerp(a: number, b: number, value: number): number;

export { type AnimationType as A, type EasingName as E, FrameRenderer as F, type HorizontalAlignment as H, type Position as P, type RenderOptions as R, type ScaleMode as S, type VerticalAlignment as V, type EasingFunction as a, type EngineConfig as b, type PreloadProgress as c, type PreloadProgressCallback as d, type SceneConfig as e, type SceneState as f, ScrollEngine as g, easings as h, generateImageUrls as i, clamp as j, inverseLerp as k, lerp as l, preloadImages as p, resolveEasing as r };
