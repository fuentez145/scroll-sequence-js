import { useState, useEffect, useRef } from "react";
import { preloadImages } from "../core/ImagePreloader";

export interface ImagePreloaderResult {
  images: HTMLImageElement[];
  progress: number;
  isLoaded: boolean;
}

export function useImagePreloader(urls: string[]): ImagePreloaderResult {
  const [state, setState] = useState<ImagePreloaderResult>({
    images: [],
    progress: 0,
    isLoaded: false,
  });

  // Store urls as a ref to compare by content, not reference
  const urlsRef = useRef<string[]>([]);
  const urlsKey = urls.join("\0");

  useEffect(() => {
    let cancelled = false;

    setState({ images: [], progress: 0, isLoaded: false });

    preloadImages(urls, (progress) => {
      if (cancelled) return;
      setState((prev) => ({
        ...prev,
        progress: progress.percent,
      }));
    })
      .then((images) => {
        if (cancelled) return;
        setState({ images, progress: 100, isLoaded: true });
      })
      .catch(() => {
        // Errors are already per-image; this fires on first failure
        if (cancelled) return;
      });

    return () => {
      cancelled = true;
    };
  }, [urlsKey]);

  return state;
}
