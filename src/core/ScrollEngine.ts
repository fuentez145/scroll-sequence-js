import type { EngineConfig, SceneConfig, SceneState } from "../types";
import { FrameRenderer } from "./FrameRenderer";
import { preloadImages } from "./ImagePreloader";
import { clamp } from "./math";

export class ScrollEngine {
  private renderer: FrameRenderer;
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private scenes: SceneState[] = [];
  private scrollDelay: number;
  private onProgress?: EngineConfig["onProgress"];

  private targetProgress = 0;
  private currentProgress = 0;
  private rafId: number | null = null;
  private isActive = false;
  private isReady = false;
  private observer: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private preloadPercentage: number;
  private scrollPadding: number;
  private reverseSpeedMultiplier: number;
  private stopDeceleration: number;
  private overlapTop: number;
  private lastTickTime = 0;
  private totalFrameCount = 0;

  constructor(config: EngineConfig) {
    this.canvas = config.canvas;
    this.container = config.container;
    this.renderer = new FrameRenderer(this.canvas);
    this.scrollDelay = config.scrollDelay ?? 0;
    this.onProgress = config.onProgress;
    this.preloadPercentage = config.preloadPercentage ?? 0;
    this.scrollPadding = config.scrollPadding ?? 0;
    this.reverseSpeedMultiplier = config.reverseSpeedMultiplier ?? 1;
    this.stopDeceleration = clamp(config.stopDeceleration ?? 0.65, 0.01, 1);
    this.overlapTop = config.overlapTop ?? 0;

    this.handleScroll = this.handleScroll.bind(this);
    this.tick = this.tick.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.initScenes(config.scenes, config.onPreloadProgress);
  }

  private async initScenes(
    sceneConfigs: SceneConfig[],
    onPreloadProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    // Gather all image URLs
    const allUrls: string[] = [];
    const sceneMeta: { config: SceneConfig; startIdx: number; count: number }[] = [];

    for (const config of sceneConfigs) {
      sceneMeta.push({
        config,
        startIdx: allUrls.length,
        count: config.images.length,
      });
      allUrls.push(...config.images);
    }

    this.totalFrameCount = allUrls.length;

    // Calculate progress slices
    let cumulativeProgress = 0;
    const sceneStates: SceneState[] = sceneMeta.map((meta) => {
      const weight = (meta.config.duration ?? 1) * meta.count;
      return {
        config: meta.config,
        images: [],
        startProgress: 0,
        endProgress: 0,
        frameCount: meta.count,
        _weight: weight,
      } as SceneState & { _weight: number };
    });

    const totalWeight = sceneStates.reduce(
      (sum, s) => sum + ((s as SceneState & { _weight: number })._weight || 1),
      0
    );

    for (const scene of sceneStates) {
      const w = (scene as SceneState & { _weight: number })._weight;
      scene.startProgress = cumulativeProgress;
      scene.endProgress = cumulativeProgress + w / totalWeight;
      cumulativeProgress = scene.endProgress;
    }

    // Correct floating point
    if (sceneStates.length > 0) {
      sceneStates[sceneStates.length - 1].endProgress = 1;
    }

    this.scenes = sceneStates;

    // Preload
    let loadedSoFar = 0;
    const totalImages = allUrls.length;
    const preloadThreshold = (this.preloadPercentage / 100) * totalImages;

    const allImages = await preloadImages(allUrls, (progress) => {
      loadedSoFar = progress.loaded;
      onPreloadProgress?.(progress.loaded, progress.total);

      if (!this.isReady && loadedSoFar >= preloadThreshold) {
        this.isReady = true;
        this.start();
      }
    });

    // Assign images to scenes
    for (let i = 0; i < sceneMeta.length; i++) {
      const meta = sceneMeta[i];
      this.scenes[i].images = allImages.slice(
        meta.startIdx,
        meta.startIdx + meta.count
      );
    }

    this.isReady = true;
    this.start();
    this.drawCurrentFrame();
  }

  private start(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Intersection observer for activation
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.startAnimationLoop();
          } else {
            this.stopAnimationLoop();
          }
        }
      },
      { threshold: 0 }
    );
    this.observer.observe(this.container);

    // Resize observer
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    // Scroll listener
    window.addEventListener("scroll", this.handleScroll, { passive: true });

    // Initial sizing and position
    this.handleResize();
    this.handleScroll();
    this.currentProgress = this.targetProgress;
  }

  private handleScroll(): void {
    if (!this.isReady) return;

    const rect = this.container.getBoundingClientRect();
    const scrollableHeight = this.container.offsetHeight - window.innerHeight;
    // Subtract scrollPadding so frames complete before the container ends.
    // The remaining scroll distance keeps the sticky pinned on the last frame.
    const frameScrollHeight = scrollableHeight - this.scrollPadding;

    if (frameScrollHeight <= 0) {
      this.targetProgress = 0;
      return;
    }

    const rawProgress = clamp((-rect.top - this.overlapTop) / frameScrollHeight, 0, 1);
    this.targetProgress = rawProgress;

    // If no scroll delay, snap immediately
    if (this.scrollDelay === 0) {
      this.currentProgress = this.targetProgress;
    }

    // Ensure animation loop is running
    if (this.rafId === null) {
      this.startAnimationLoop();
    }
  }

  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = window.innerHeight;
    this.renderer.resize(width, height);
    this.drawCurrentFrame();
  }

  private startAnimationLoop(): void {
    if (this.rafId !== null) return;
    this.lastTickTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private stopAnimationLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    // Draw the final frame at target progress before stopping
    if (this.isReady) {
      this.currentProgress = this.targetProgress;
      this.drawCurrentFrame();
    }
  }

  private tick(): void {
    this.rafId = null;
    const now = performance.now();
    const dt = Math.min((now - this.lastTickTime) / 1000, 0.1); // delta in seconds, cap at 100ms
    this.lastTickTime = now;

    if (this.scrollDelay > 0 && dt > 0) {
      const diff = this.targetProgress - this.currentProgress;
      const absDiff = Math.abs(diff);

      if (absDiff > 0.001) {
        // Determine effective delay: reverse scrolling uses faster lerp
        const isReverse = diff < 0;
        const effectiveDelay = isReverse && this.reverseSpeedMultiplier > 1
          ? this.scrollDelay / this.reverseSpeedMultiplier
          : this.scrollDelay;

        // Time-based exponential smoothing.
        // k controls convergence: settles to ~95% within effectiveDelay seconds.
        const k = this.stopDeceleration * 5;
        const factor = 1 - Math.exp(-k * dt / effectiveDelay);
        this.currentProgress += diff * clamp(factor, 0.01, 0.95);
        this.currentProgress = clamp(this.currentProgress, 0, 1);
      } else {
        // Snap when close enough — prevents crawling
        this.currentProgress = this.targetProgress;
      }
    } else {
      this.currentProgress = this.targetProgress;
    }

    this.drawCurrentFrame();

    // Keep looping only if we still need to catch up to the target
    const needsCatchUp =
      this.scrollDelay > 0 &&
      Math.abs(this.currentProgress - this.targetProgress) > 0.001;

    if (needsCatchUp) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  private drawCurrentFrame(): void {
    if (this.scenes.length === 0) return;

    const { sceneIndex, frameIndex, sceneProgress } =
      this.resolveFrame(this.currentProgress);
    const scene = this.scenes[sceneIndex];
    if (!scene || scene.images.length === 0) return;

    const image = scene.images[clamp(frameIndex, 0, scene.images.length - 1)];
    this.renderer.drawFrame(image, {
      scaleMode: scene.config.scaleMode ?? "fill",
      horizontalAlignment: scene.config.horizontalAlignment ?? "center",
      verticalAlignment: scene.config.verticalAlignment ?? "center",
    });

    this.onProgress?.(this.currentProgress, sceneIndex, sceneProgress);
  }

  resolveFrame(progress: number): {
    sceneIndex: number;
    frameIndex: number;
    sceneProgress: number;
  } {
    const p = clamp(progress, 0, 1);

    for (let i = 0; i < this.scenes.length; i++) {
      const scene = this.scenes[i];
      if (p >= scene.startProgress && p <= scene.endProgress) {
        const sceneRange = scene.endProgress - scene.startProgress;
        const sceneProgress =
          sceneRange > 0 ? (p - scene.startProgress) / sceneRange : 0;
        const frameIndex = Math.round(sceneProgress * (scene.frameCount - 1));
        return { sceneIndex: i, frameIndex, sceneProgress };
      }
    }

    // Fallback to last scene
    const lastIndex = this.scenes.length - 1;
    return {
      sceneIndex: lastIndex,
      frameIndex: this.scenes[lastIndex].frameCount - 1,
      sceneProgress: 1,
    };
  }

  getProgress(): number {
    return this.currentProgress;
  }

  getScenes(): SceneState[] {
    return this.scenes;
  }

  destroy(): void {
    this.isActive = false;
    this.stopAnimationLoop();
    window.removeEventListener("scroll", this.handleScroll);
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
    this.renderer.clear();
  }
}
