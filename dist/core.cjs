'use strict';

// src/core/FrameRenderer.ts
var DEFAULT_OPTIONS = {
  scaleMode: "fill",
  horizontalAlignment: "center",
  verticalAlignment: "center"
};
var FrameRenderer = class {
  constructor(canvas) {
    this.lastDrawnImage = null;
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.lastOptions = DEFAULT_OPTIONS;
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Failed to get 2d canvas context");
    this.ctx = ctx;
  }
  resize(width, height) {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const canvasWidth = Math.round(width * dpr);
    const canvasHeight = Math.round(height * dpr);
    if (this.canvas.width !== canvasWidth || this.canvas.height !== canvasHeight) {
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.ctx.scale(dpr, dpr);
      this.lastDrawnImage = null;
    }
  }
  drawFrame(image, options) {
    if (!image) return;
    const opts = { ...DEFAULT_OPTIONS, ...options };
    if (image === this.lastDrawnImage && this.canvas.width === this.lastWidth && this.canvas.height === this.lastHeight && opts.scaleMode === this.lastOptions.scaleMode && opts.horizontalAlignment === this.lastOptions.horizontalAlignment && opts.verticalAlignment === this.lastOptions.verticalAlignment) {
      return;
    }
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const displayWidth = this.canvas.width / dpr;
    const displayHeight = this.canvas.height / dpr;
    if (image.naturalWidth <= 0 || image.naturalHeight <= 0 || !Number.isFinite(displayWidth) || !Number.isFinite(displayHeight) || displayWidth <= 0 || displayHeight <= 0) {
      return;
    }
    this.ctx.clearRect(0, 0, displayWidth, displayHeight);
    const imgAspect = image.naturalWidth / image.naturalHeight;
    const canvasAspect = displayWidth / displayHeight;
    let drawWidth;
    let drawHeight;
    if (opts.scaleMode === "fill") {
      if (canvasAspect > imgAspect) {
        drawWidth = displayWidth;
        drawHeight = displayWidth / imgAspect;
      } else {
        drawHeight = displayHeight;
        drawWidth = displayHeight * imgAspect;
      }
    } else {
      if (canvasAspect > imgAspect) {
        drawHeight = displayHeight;
        drawWidth = displayHeight * imgAspect;
      } else {
        drawWidth = displayWidth;
        drawHeight = displayWidth / imgAspect;
      }
    }
    let x;
    switch (opts.horizontalAlignment) {
      case "left":
        x = 0;
        break;
      case "right":
        x = displayWidth - drawWidth;
        break;
      case "center":
      default:
        x = (displayWidth - drawWidth) / 2;
    }
    let y;
    switch (opts.verticalAlignment) {
      case "top":
        y = 0;
        break;
      case "bottom":
        y = displayHeight - drawHeight;
        break;
      case "center":
      default:
        y = (displayHeight - drawHeight) / 2;
    }
    this.ctx.drawImage(image, x, y, drawWidth, drawHeight);
    this.lastDrawnImage = image;
    this.lastWidth = this.canvas.width;
    this.lastHeight = this.canvas.height;
    this.lastOptions = opts;
  }
  clear() {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    this.lastDrawnImage = null;
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.lastOptions = DEFAULT_OPTIONS;
  }
};

// src/core/ImagePreloader.ts
var MAX_CONCURRENT = 6;
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = async () => {
      if (typeof img.decode === "function") {
        try {
          await img.decode();
        } catch {
        }
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
async function preloadImages(urls, onProgress) {
  const total = urls.length;
  if (total === 0) {
    onProgress?.({ loaded: 0, total: 0, percent: 100 });
    return [];
  }
  const results = new Array(total);
  let loaded = 0;
  let nextIndex = 0;
  function reportProgress(image, index) {
    onProgress?.({
      loaded,
      total,
      percent: total > 0 ? loaded / total * 100 : 0
    }, image, index);
  }
  return new Promise((resolve, reject) => {
    let hasRejected = false;
    function processNext() {
      if (hasRejected) return;
      if (nextIndex >= total) {
        if (loaded === total) resolve(results);
        return;
      }
      const index = nextIndex++;
      loadImage(urls[index]).then((img) => {
        if (hasRejected) return;
        results[index] = img;
        loaded++;
        reportProgress(img, index);
        processNext();
      }).catch((err) => {
        if (hasRejected) return;
        hasRejected = true;
        reject(err);
      });
    }
    const initialBatch = Math.min(MAX_CONCURRENT, total);
    for (let i = 0; i < initialBatch; i++) {
      processNext();
    }
  });
}
function generateImageUrls(pattern, count, startIndex = 0, padLength = 4) {
  const urls = [];
  for (let i = startIndex; i < startIndex + count; i++) {
    const paddedIndex = String(i).padStart(padLength, "0");
    urls.push(pattern.replace("{index}", paddedIndex));
  }
  return urls;
}

// src/core/math.ts
var easings = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};
function resolveEasing(easing) {
  if (typeof easing === "function") return easing;
  return easings[easing ?? "linear"];
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function normalizeDuration(duration) {
  return typeof duration === "number" && Number.isFinite(duration) && duration > 0 ? duration : 1;
}
function inverseLerp(a, b, value) {
  if (a === b) return 0;
  return clamp((value - a) / (b - a), 0, 1);
}

// src/core/ScrollEngine.ts
var ScrollEngine = class {
  constructor(config) {
    this.scenes = [];
    this.targetProgress = 0;
    this.currentProgress = 0;
    this.rafId = null;
    this.isActive = false;
    this.isReady = false;
    this.observer = null;
    this.resizeObserver = null;
    this.isVisible = true;
    this.destroyed = false;
    this.lastTickTime = 0;
    this.totalFrameCount = 0;
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
  async initScenes(sceneConfigs, onPreloadProgress) {
    if (this.destroyed) return;
    const allUrls = [];
    const sceneMeta = [];
    for (const config of sceneConfigs) {
      sceneMeta.push({
        config,
        startIdx: allUrls.length,
        count: config.images.length
      });
      allUrls.push(...config.images);
    }
    this.totalFrameCount = allUrls.length;
    let cumulativeProgress = 0;
    const sceneStates = sceneMeta.map((meta) => {
      const duration = meta.config.duration;
      const safeDuration = normalizeDuration(duration);
      const weight = safeDuration * meta.count;
      return {
        config: meta.config,
        images: new Array(meta.count),
        startProgress: 0,
        endProgress: 0,
        frameCount: meta.count,
        _weight: weight
      };
    });
    const totalWeight = sceneStates.reduce(
      (sum, s) => sum + (s._weight || 1),
      0
    );
    for (const scene of sceneStates) {
      const w = scene._weight;
      scene.startProgress = cumulativeProgress;
      scene.endProgress = cumulativeProgress + w / totalWeight;
      cumulativeProgress = scene.endProgress;
    }
    if (sceneStates.length > 0) {
      sceneStates[sceneStates.length - 1].endProgress = 1;
    }
    this.scenes = sceneStates;
    let loadedSoFar = 0;
    const totalImages = allUrls.length;
    const preloadThreshold = this.preloadPercentage / 100 * totalImages;
    const allImages = await preloadImages(allUrls, (progress, image, imageIndex) => {
      if (this.destroyed) return;
      loadedSoFar = progress.loaded;
      onPreloadProgress?.(progress.loaded, progress.total);
      if (image && imageIndex !== void 0) {
        for (let sceneIndex = 0; sceneIndex < sceneMeta.length; sceneIndex++) {
          const meta = sceneMeta[sceneIndex];
          if (imageIndex >= meta.startIdx && imageIndex < meta.startIdx + meta.count) {
            this.scenes[sceneIndex].images[imageIndex - meta.startIdx] = image;
            break;
          }
        }
      }
      if (!this.isReady && loadedSoFar >= preloadThreshold) {
        this.isReady = true;
        this.start();
      }
      if (this.isReady) this.drawCurrentFrame();
    });
    if (this.destroyed) return;
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
  start() {
    if (this.destroyed || this.isActive) return;
    this.isActive = true;
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          this.isVisible = entry.isIntersecting;
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
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
    window.addEventListener("scroll", this.handleScroll, { passive: true });
    this.handleResize();
    this.handleScroll();
    this.currentProgress = this.targetProgress;
  }
  handleScroll() {
    if (this.destroyed || !this.isReady) return;
    const rect = this.container.getBoundingClientRect();
    const scrollableHeight = this.container.offsetHeight - window.innerHeight;
    const frameScrollHeight = scrollableHeight - this.scrollPadding;
    if (frameScrollHeight <= 0) {
      this.targetProgress = 0;
      return;
    }
    const rawProgress = clamp((-rect.top - this.overlapTop) / frameScrollHeight, 0, 1);
    this.targetProgress = rawProgress;
    if (this.scrollDelay === 0) {
      this.currentProgress = this.targetProgress;
    }
    if (this.isVisible && this.rafId === null) {
      this.startAnimationLoop();
    }
  }
  handleResize() {
    const width = this.container.clientWidth;
    const height = window.innerHeight;
    this.renderer.resize(width, height);
    this.drawCurrentFrame();
  }
  startAnimationLoop() {
    if (this.destroyed || !this.isVisible || this.rafId !== null) return;
    this.lastTickTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }
  stopAnimationLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (!this.destroyed && this.isReady) {
      this.currentProgress = this.targetProgress;
      this.drawCurrentFrame();
    }
  }
  tick() {
    if (this.destroyed || !this.isVisible) {
      this.rafId = null;
      return;
    }
    this.rafId = null;
    const now = performance.now();
    const dt = Math.min((now - this.lastTickTime) / 1e3, 0.1);
    this.lastTickTime = now;
    if (this.scrollDelay > 0 && dt > 0) {
      const diff = this.targetProgress - this.currentProgress;
      const absDiff = Math.abs(diff);
      if (absDiff > 1e-3) {
        const isReverse = diff < 0;
        const effectiveDelay = isReverse && this.reverseSpeedMultiplier > 1 ? this.scrollDelay / this.reverseSpeedMultiplier : this.scrollDelay;
        const k = this.stopDeceleration * 5;
        const factor = 1 - Math.exp(-k * dt / effectiveDelay);
        this.currentProgress += diff * clamp(factor, 0.01, 0.95);
        this.currentProgress = clamp(this.currentProgress, 0, 1);
      } else {
        this.currentProgress = this.targetProgress;
      }
    } else {
      this.currentProgress = this.targetProgress;
    }
    this.drawCurrentFrame();
    const needsCatchUp = this.scrollDelay > 0 && Math.abs(this.currentProgress - this.targetProgress) > 1e-3;
    if (needsCatchUp && this.isVisible && !this.destroyed) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }
  drawCurrentFrame() {
    if (this.scenes.length === 0) return;
    const { sceneIndex, frameIndex, sceneProgress } = this.resolveFrame(this.currentProgress);
    const scene = this.scenes[sceneIndex];
    if (!scene || scene.images.length === 0) return;
    const requestedIndex = clamp(frameIndex, 0, scene.images.length - 1);
    let image = scene.images[requestedIndex];
    if (!image) {
      for (let offset = 1; offset < scene.images.length && !image; offset++) {
        image = scene.images[requestedIndex - offset] ?? scene.images[requestedIndex + offset];
      }
    }
    if (!image) return;
    this.renderer.drawFrame(image, {
      scaleMode: scene.config.scaleMode ?? "fill",
      horizontalAlignment: scene.config.horizontalAlignment ?? "center",
      verticalAlignment: scene.config.verticalAlignment ?? "center"
    });
    this.onProgress?.(this.currentProgress, sceneIndex, sceneProgress);
  }
  resolveFrame(progress) {
    if (this.scenes.length === 0) {
      return { sceneIndex: -1, frameIndex: -1, sceneProgress: 0 };
    }
    const p = clamp(progress, 0, 1);
    for (let i = 0; i < this.scenes.length; i++) {
      const scene = this.scenes[i];
      if (p >= scene.startProgress && p <= scene.endProgress) {
        const sceneRange = scene.endProgress - scene.startProgress;
        const sceneProgress = sceneRange > 0 ? (p - scene.startProgress) / sceneRange : 0;
        const frameIndex = Math.round(sceneProgress * (scene.frameCount - 1));
        return { sceneIndex: i, frameIndex, sceneProgress };
      }
    }
    const lastIndex = this.scenes.length - 1;
    return {
      sceneIndex: lastIndex,
      frameIndex: this.scenes[lastIndex].frameCount - 1,
      sceneProgress: 1
    };
  }
  getProgress() {
    return this.currentProgress;
  }
  getScenes() {
    return this.scenes;
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.isActive = false;
    this.isVisible = false;
    this.stopAnimationLoop();
    window.removeEventListener("scroll", this.handleScroll);
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
    this.observer = null;
    this.resizeObserver = null;
    this.scenes = [];
    this.renderer.clear();
  }
};

exports.FrameRenderer = FrameRenderer;
exports.ScrollEngine = ScrollEngine;
exports.clamp = clamp;
exports.easings = easings;
exports.generateImageUrls = generateImageUrls;
exports.inverseLerp = inverseLerp;
exports.lerp = lerp;
exports.normalizeDuration = normalizeDuration;
exports.preloadImages = preloadImages;
exports.resolveEasing = resolveEasing;
//# sourceMappingURL=core.cjs.map
//# sourceMappingURL=core.cjs.map