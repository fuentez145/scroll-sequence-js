import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type CSSProperties,
} from "react";
import { ScrollEngine } from "../core/ScrollEngine";
import type { SceneConfig, Position } from "../types";
import { SequenceContext, SceneProgressContext, type SceneProgressContextValue } from "./context";

export interface ScrollSequenceProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  scrollDelay?: number;
  position?: Position;
  preloadPercentage?: number;
  /** Block scrolling past the sequence until all frames are preloaded. */
  waitForLoad?: boolean;
  /** Custom loading renderer. Receives progress (0-100). */
  renderLoader?: (progress: number) => ReactNode;
  /** Only start preloading images when the sequence approaches the viewport. Default true. */
  lazy?: boolean;
  /** Scroll distance per frame in pixels. Higher = slower animation. Default 10. */
  scrollPerFrame?: number;
  /** Overlap at the top in px — content above slides over the pinned canvas. Default 0. */
  overlapTop?: number;
  /** Overlap at the bottom in px — content below slides over the pinned canvas. Default 0. */
  overlapBottom?: number;
  /** Multiplier for reverse (scroll-up) speed. 2 = twice as fast going back. Default 2. */
  reverseSpeedMultiplier?: number;
  /** Deceleration factor (0-1). Higher = snappier stop, lower = more gradual coast. Default 0.65. */
  stopDeceleration?: number;
  /** Fraction of progress over which the canvas and overlay fade out at the end (0-1). 0 = no fade. Default 0.135 (~last 50 of 370 frames). */
  exitFadeLength?: number;
  onProgress?: (
    progress: number,
    sceneIndex: number,
    sceneProgress: number
  ) => void;
}

interface RegisteredScene {
  id: string;
  config: SceneConfig;
  order: number;
}

export function ScrollSequence({
  children,
  className,
  style,
  scrollDelay = 0,
  position = "sticky",
  preloadPercentage = 0,
  waitForLoad = false,
  renderLoader,
  lazy = true,
  scrollPerFrame = 10,
  overlapTop = 0,
  overlapBottom = 0,
  reverseSpeedMultiplier = 2,
  stopDeceleration = 0.65,
  exitFadeLength = 0.135,
  onProgress,
}: ScrollSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ScrollEngine | null>(null);
  const scenesMapRef = useRef<Map<string, RegisteredScene>>(new Map());
  const orderCounterRef = useRef(0);

  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [mounted, setMounted] = useState(false);
  const [progressState, setProgressState] = useState<SceneProgressContextValue>({
    sceneIndex: 0,
    sceneProgress: 0,
    frameIndex: 0,
    frameCount: 0,
    globalProgress: 0,
  });

  // After hydration, flip mounted so viewport-dependent values re-render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Stable callback refs
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const buildEngine = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // Destroy previous engine
    engineRef.current?.destroy();

    // Get scenes sorted by registration order
    const scenes = Array.from(scenesMapRef.current.values())
      .sort((a, b) => a.order - b.order)
      .map((s) => s.config);

    if (scenes.length === 0) return;

    const totalFrames = scenes.reduce((sum, s) => sum + s.images.length, 0);

    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const engine = new ScrollEngine({
      canvas: canvasRef.current,
      container: containerRef.current,
      scenes,
      scrollDelay,
      preloadPercentage,
      scrollPadding: vh,
      reverseSpeedMultiplier,
      stopDeceleration,
      overlapTop,
      onProgress: (progress, sceneIndex, sceneProgress) => {
        const resolved = engine.resolveFrame(progress);
        setProgressState({
          sceneIndex,
          sceneProgress,
          frameIndex: resolved.frameIndex,
          frameCount: scenes[sceneIndex]?.images.length ?? 0,
          globalProgress: progress,
        });
        onProgressRef.current?.(progress, sceneIndex, sceneProgress);
      },
      onPreloadProgress: (loaded, total) => {
        setPreloadProgress(total > 0 ? (loaded / total) * 100 : 0);
        if (loaded === total) setIsReady(true);
      },
    });

    engineRef.current = engine;
  }, [scrollDelay, preloadPercentage, reverseSpeedMultiplier, stopDeceleration, overlapTop]);

  // Rebuild engine when scenes change
  const [sceneVersion, setSceneVersion] = useState(0);

  const sequenceCtx = useMemo(
    () => ({
      registerScene: (id: string, config: SceneConfig) => {
        const existing = scenesMapRef.current.get(id);
        scenesMapRef.current.set(id, {
          id,
          config,
          order: existing?.order ?? orderCounterRef.current++,
        });
        setSceneVersion((v) => v + 1);
      },
      unregisterScene: (id: string) => {
        scenesMapRef.current.delete(id);
        setSceneVersion((v) => v + 1);
      },
    }),
    []
  );

  // Lazy loading: detect when container approaches viewport
  useEffect(() => {
    if (!lazy || isInView || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Build engine only when in view
  useEffect(() => {
    if (!isInView) return;
    buildEngine();
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [isInView, buildEngine, sceneVersion]);

  // Calculate total scroll height based on scenes
  // Height = (frames * scrollPerFrame) + 2 viewports.
  // 1st vh: sticky clearance (standard). 2nd vh: post-completion zone where
  // the last frame stays pinned before the container ends and unsticks.
  const totalHeight = useMemo(() => {
    const scenes = Array.from(scenesMapRef.current.values());
    const totalFrames = scenes.reduce(
      (sum, s) => sum + s.config.images.length * (s.config.duration ?? 1),
      0
    );
    // Use consistent fallback for SSR and first client render to avoid hydration mismatch.
    // After mount, use actual viewport height.
    const vh = mounted && typeof window !== "undefined" ? window.innerHeight : 800;
    return totalFrames * scrollPerFrame + vh + vh;
  }, [sceneVersion, scrollPerFrame, mounted]);

  // waitForLoad: clamp scroll position so user can't go past the container top
  // until images are loaded. They can scroll TO it but not through it.
  useEffect(() => {
    if (!waitForLoad || isReady || !containerRef.current) return;
    const container = containerRef.current;
    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      if (rect.top < 0) {
        window.scrollTo(0, window.scrollY + rect.top);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [waitForLoad, isReady]);

  // Compute exit fade opacity: 1 at (1 - exitFadeLength), 0.02 at progress=1
  const exitProgress = progressState.globalProgress;
  const exitOpacity = exitFadeLength > 0 && exitProgress > (1 - exitFadeLength)
    ? Math.max(0.02, 1 - (exitProgress - (1 - exitFadeLength)) / exitFadeLength * 0.98)
    : 1;

  const containerStyle: CSSProperties = {
    position: "relative",
    height: `${totalHeight}px`,
    ...(overlapTop > 0 || overlapBottom > 0
      ? { marginTop: -overlapTop, marginBottom: -overlapBottom }
      : {}),
    ...style,
  };

  const stickyStyle: CSSProperties = {
    position: position === "static" ? "relative" : position,
    top: position === "sticky" ? 0 : undefined,
    width: "100%",
    height: "100vh",
    overflow: "hidden",
  };

  const canvasStyle: CSSProperties = {
    display: "block",
    width: "100%",
    height: "100%",
    opacity: exitOpacity,
    transition: exitOpacity < 1 ? undefined : 'opacity 0.1s',
  };

  return (
    <SequenceContext.Provider value={sequenceCtx}>
      <div ref={containerRef} className={className} style={containerStyle}>
        <div style={stickyStyle}>
          <canvas ref={canvasRef} style={canvasStyle} />
          {waitForLoad && !isReady && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.85)",
                zIndex: 10,
              }}
            >
              {renderLoader ? (
                renderLoader(preloadProgress)
              ) : (
                <div style={{ textAlign: "center", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
                  <div style={{ fontSize: 18, marginBottom: 12 }}>Loading frames…</div>
                  <div
                    style={{
                      width: 200,
                      height: 4,
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${preloadProgress}%`,
                        height: "100%",
                        background: "#fff",
                        borderRadius: 2,
                        transition: "width 0.2s",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 13, marginTop: 8, opacity: 0.7 }}>
                    {Math.round(preloadProgress)}%
                  </div>
                </div>
              )}
            </div>
          )}
          <SceneProgressContext.Provider value={progressState}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                opacity: exitOpacity,
              }}
            >
              {children}
            </div>
          </SceneProgressContext.Provider>
        </div>
      </div>
    </SequenceContext.Provider>
  );
}
