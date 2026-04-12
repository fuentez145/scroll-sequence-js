import type { ReactNode, CSSProperties } from "react";

export interface OverlayProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Overlay({ children, className, style }: OverlayProps) {
  const overlayStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "auto",
    ...style,
  };

  return (
    <div className={className} style={overlayStyle}>
      {children}
    </div>
  );
}
