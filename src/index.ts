// Components
export { ScrollSequence } from "./components/ScrollSequence";
export { Scene } from "./components/Scene";
export { Overlay } from "./components/Overlay";
export { Animate } from "./components/Animate";

// Hooks
export { useScrollProgress } from "./hooks/useScrollProgress";
export { useImagePreloader } from "./hooks/useImagePreloader";
export { useSceneProgress } from "./components/context";

// Core (re-export for convenience)
export { ScrollEngine } from "./core/ScrollEngine";
export { FrameRenderer } from "./core/FrameRenderer";
export { preloadImages, generateImageUrls } from "./core/ImagePreloader";
export { easings, resolveEasing, normalizeDuration } from "./core/math";

// Types
export type {
  ScaleMode,
  HorizontalAlignment,
  VerticalAlignment,
  Position,
  AnimationType,
  EasingFunction,
  EasingName,
  SceneConfig,
  EngineConfig,
  SceneState,
} from "./types";

export type { ScrollSequenceProps } from "./components/ScrollSequence";
export type { SceneProps } from "./components/Scene";
export type { OverlayProps } from "./components/Overlay";
export type { AnimateProps } from "./components/Animate";
export type { ScrollProgressResult } from "./hooks/useScrollProgress";
export type { ImagePreloaderResult } from "./hooks/useImagePreloader";
export type { SceneProgressContextValue } from "./components/context";
export type { PreloadProgress, PreloadProgressCallback } from "./core/ImagePreloader";
export type { RenderOptions } from "./core/FrameRenderer";
