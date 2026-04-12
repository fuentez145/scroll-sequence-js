import { useEffect, useId, type ReactNode } from "react";
import type { ScaleMode, HorizontalAlignment, VerticalAlignment } from "../types";
import { useSequenceContext } from "./context";

export interface SceneProps {
  images: string[];
  duration?: number;
  scaleMode?: ScaleMode;
  horizontalAlignment?: HorizontalAlignment;
  verticalAlignment?: VerticalAlignment;
  children?: ReactNode;
}

export function Scene({
  images,
  duration = 1,
  scaleMode = "fill",
  horizontalAlignment = "center",
  verticalAlignment = "center",
  children,
}: SceneProps) {
  const id = useId();
  const { registerScene, unregisterScene } = useSequenceContext();

  useEffect(() => {
    registerScene(id, {
      images,
      duration,
      scaleMode,
      horizontalAlignment,
      verticalAlignment,
    });

    return () => {
      unregisterScene(id);
    };
  }, [id, images, duration, scaleMode, horizontalAlignment, verticalAlignment, registerScene, unregisterScene]);

  // Scene children (overlays) are rendered — they read progress via context
  return <>{children}</>;
}
