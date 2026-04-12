import type { ScaleMode, HorizontalAlignment, VerticalAlignment } from "../types";

export interface RenderOptions {
  scaleMode: ScaleMode;
  horizontalAlignment: HorizontalAlignment;
  verticalAlignment: VerticalAlignment;
}

const DEFAULT_OPTIONS: RenderOptions = {
  scaleMode: "fill",
  horizontalAlignment: "center",
  verticalAlignment: "center",
};

export class FrameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastDrawnImage: HTMLImageElement | null = null;
  private lastWidth = 0;
  private lastHeight = 0;
  private lastOptions: RenderOptions = DEFAULT_OPTIONS;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Failed to get 2d canvas context");
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const canvasWidth = Math.round(width * dpr);
    const canvasHeight = Math.round(height * dpr);

    if (this.canvas.width !== canvasWidth || this.canvas.height !== canvasHeight) {
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.ctx.scale(dpr, dpr);
      this.lastDrawnImage = null; // force redraw
    }
  }

  drawFrame(image: HTMLImageElement | null, options?: Partial<RenderOptions>): void {
    if (!image) return;

    const opts: RenderOptions = { ...DEFAULT_OPTIONS, ...options };

    // Skip redraw if same image and same dimensions and same options
    if (
      image === this.lastDrawnImage &&
      this.canvas.width === this.lastWidth &&
      this.canvas.height === this.lastHeight &&
      opts.scaleMode === this.lastOptions.scaleMode &&
      opts.horizontalAlignment === this.lastOptions.horizontalAlignment &&
      opts.verticalAlignment === this.lastOptions.verticalAlignment
    ) {
      return;
    }

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const displayWidth = this.canvas.width / dpr;
    const displayHeight = this.canvas.height / dpr;

    this.ctx.clearRect(0, 0, displayWidth, displayHeight);

    const imgAspect = image.naturalWidth / image.naturalHeight;
    const canvasAspect = displayWidth / displayHeight;

    let drawWidth: number;
    let drawHeight: number;

    if (opts.scaleMode === "fill") {
      if (canvasAspect > imgAspect) {
        drawWidth = displayWidth;
        drawHeight = displayWidth / imgAspect;
      } else {
        drawHeight = displayHeight;
        drawWidth = displayHeight * imgAspect;
      }
    } else {
      // fit
      if (canvasAspect > imgAspect) {
        drawHeight = displayHeight;
        drawWidth = displayHeight * imgAspect;
      } else {
        drawWidth = displayWidth;
        drawHeight = displayWidth / imgAspect;
      }
    }

    let x: number;
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

    let y: number;
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

  clear(): void {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    this.lastDrawnImage = null;
  }
}
