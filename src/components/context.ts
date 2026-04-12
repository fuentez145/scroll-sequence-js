import { createContext, useContext } from "react";
import type { SceneConfig } from "../types";

// --- Sequence Context: scene registration ---
export interface SequenceContextValue {
  registerScene: (id: string, config: SceneConfig) => void;
  unregisterScene: (id: string) => void;
}

export const SequenceContext = createContext<SequenceContextValue | null>(null);

export function useSequenceContext(): SequenceContextValue {
  const ctx = useContext(SequenceContext);
  if (!ctx) {
    throw new Error("<Scene> must be used inside <ScrollSequence>");
  }
  return ctx;
}

// --- Scene Progress Context: current frame/progress for overlays ---
export interface SceneProgressContextValue {
  sceneIndex: number;
  sceneProgress: number;
  frameIndex: number;
  frameCount: number;
  globalProgress: number;
}

export const SceneProgressContext =
  createContext<SceneProgressContextValue | null>(null);

export function useSceneProgress(): SceneProgressContextValue {
  const ctx = useContext(SceneProgressContext);
  if (!ctx) {
    throw new Error(
      "<Overlay> / <Animate> must be used inside a <Scene> within <ScrollSequence>"
    );
  }
  return ctx;
}
