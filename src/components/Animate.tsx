import { useMemo, type ReactNode, type CSSProperties } from "react";
import type { AnimationType, EasingName, EasingFunction } from "../types";
import { useSceneProgress } from "./context";
import { resolveEasing, inverseLerp } from "../core/math";

export interface AnimateProps {
  children: ReactNode;
  type: AnimationType;
  start: number;
  end: number;
  distance?: number;
  easing?: EasingName | EasingFunction;
  className?: string;
  style?: CSSProperties;
}

function getAnimationStyles(
  type: AnimationType,
  t: number,
  distance: number
): CSSProperties {
  switch (type) {
    case "fadeIn":
      return {
        opacity: t,
        visibility: t > 0 ? "visible" : "hidden",
      };
    case "fadeOut":
      return {
        opacity: 1 - t,
        visibility: t < 1 ? "visible" : "hidden",
      };
    case "moveUp":
      return {
        transform: `translateY(${(1 - t) * distance}px)`,
      };
    case "moveDown":
      return {
        transform: `translateY(${-(1 - t) * distance}px)`,
      };
    case "moveLeft":
      return {
        transform: `translateX(${(1 - t) * distance}px)`,
      };
    case "moveRight":
      return {
        transform: `translateX(${-(1 - t) * distance}px)`,
      };
    case "scaleUp": {
      const scale = 0 + t * 1; // 0 to 1
      return {
        transform: `scale(${scale})`,
      };
    }
    case "scaleDown": {
      const scale = 1 - t * (1 - 0.5); // 1 to 0.5
      return {
        transform: `scale(${scale})`,
      };
    }
    default:
      return {};
  }
}

export function Animate({
  children,
  type,
  start,
  end,
  distance = 100,
  easing = "linear",
  className,
  style,
}: AnimateProps) {
  const { frameIndex, frameCount } = useSceneProgress();
  const easingFn = useMemo(() => resolveEasing(easing), [easing]);

  // Determine visibility and interpolation
  const rawT = inverseLerp(start, end, frameIndex);
  const t = easingFn(rawT);

  const isVisible = frameIndex >= start && frameIndex <= end;
  // For fadeIn, show element after animation completes; for fadeOut, show before
  const shouldRender =
    type === "fadeIn"
      ? frameIndex >= start
      : type === "fadeOut"
        ? frameIndex <= end
        : isVisible;

  const animStyles = getAnimationStyles(type, t, distance);

  const combinedStyle: CSSProperties = {
    willChange: "transform, opacity",
    ...style,
    ...animStyles,
    ...(shouldRender ? {} : { visibility: "hidden" as const }),
  };

  return (
    <div className={className} style={combinedStyle}>
      {children}
    </div>
  );
}
