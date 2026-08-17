import * as react from 'react';
import { ReactNode, CSSProperties, RefObject } from 'react';
import { P as Position, S as ScaleMode, H as HorizontalAlignment, V as VerticalAlignment, A as AnimationType, E as EasingName, a as EasingFunction } from './index-CKcchiZu.js';
export { b as EngineConfig, F as FrameRenderer, c as PreloadProgress, d as PreloadProgressCallback, R as RenderOptions, e as SceneConfig, f as SceneState, g as ScrollEngine, h as easings, i as generateImageUrls, n as normalizeDuration, p as preloadImages, r as resolveEasing } from './index-CKcchiZu.js';

interface ScrollSequenceProps {
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
    onProgress?: (progress: number, sceneIndex: number, sceneProgress: number) => void;
}
declare function ScrollSequence({ children, className, style, scrollDelay, position, preloadPercentage, waitForLoad, renderLoader, lazy, scrollPerFrame, overlapTop, overlapBottom, reverseSpeedMultiplier, stopDeceleration, exitFadeLength, onProgress, }: ScrollSequenceProps): react.JSX.Element;

interface SceneProps {
    images: string[];
    duration?: number;
    scaleMode?: ScaleMode;
    horizontalAlignment?: HorizontalAlignment;
    verticalAlignment?: VerticalAlignment;
    children?: ReactNode;
}
declare function Scene({ images, duration, scaleMode, horizontalAlignment, verticalAlignment, children, }: SceneProps): react.JSX.Element;

interface OverlayProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}
declare function Overlay({ children, className, style }: OverlayProps): react.JSX.Element;

interface AnimateProps {
    children: ReactNode;
    type: AnimationType;
    start: number;
    end: number;
    distance?: number;
    easing?: EasingName | EasingFunction;
    className?: string;
    style?: CSSProperties;
}
declare function Animate({ children, type, start, end, distance, easing, className, style, }: AnimateProps): react.JSX.Element;

interface ScrollProgressResult {
    progress: number;
    isInView: boolean;
}
declare function useScrollProgress(ref: RefObject<HTMLElement | null>): ScrollProgressResult;

interface ImagePreloaderResult {
    images: HTMLImageElement[];
    progress: number;
    isLoaded: boolean;
}
declare function useImagePreloader(urls: string[]): ImagePreloaderResult;

interface SceneProgressContextValue {
    sceneIndex: number;
    sceneProgress: number;
    frameIndex: number;
    frameCount: number;
    globalProgress: number;
}
declare function useSceneProgress(): SceneProgressContextValue;

export { Animate, type AnimateProps, AnimationType, EasingFunction, EasingName, HorizontalAlignment, type ImagePreloaderResult, Overlay, type OverlayProps, Position, ScaleMode, Scene, type SceneProgressContextValue, type SceneProps, type ScrollProgressResult, ScrollSequence, type ScrollSequenceProps, VerticalAlignment, useImagePreloader, useSceneProgress, useScrollProgress };
