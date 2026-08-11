const MAX_CONCURRENT = 6;

export interface PreloadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export type PreloadProgressCallback = (progress: PreloadProgress) => void;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = async () => {
      // Decode before handing the frame to canvas. Otherwise the first draw can
      // synchronously decode a large image during a scroll event.
      if (typeof img.decode === "function") {
        try {
          await img.decode();
        } catch {
          // Some browsers reject decode() after onload; the image is still usable.
        }
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export async function preloadImages(
  urls: string[],
  onProgress?: PreloadProgressCallback
): Promise<HTMLImageElement[]> {
  const total = urls.length;
  if (total === 0) {
    onProgress?.({ loaded: 0, total: 0, percent: 100 });
    return [];
  }

  const results: HTMLImageElement[] = new Array(total);
  let loaded = 0;
  let nextIndex = 0;

  function reportProgress() {
    onProgress?.({
      loaded,
      total,
      percent: total > 0 ? (loaded / total) * 100 : 0,
    });
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
      loadImage(urls[index])
        .then((img) => {
          if (hasRejected) return;
          results[index] = img;
          loaded++;
          reportProgress();
          processNext();
        })
        .catch((err) => {
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

export function generateImageUrls(
  pattern: string,
  count: number,
  startIndex = 0,
  padLength = 4
): string[] {
  const urls: string[] = [];
  for (let i = startIndex; i < startIndex + count; i++) {
    const paddedIndex = String(i).padStart(padLength, "0");
    urls.push(pattern.replace("{index}", paddedIndex));
  }
  return urls;
}
