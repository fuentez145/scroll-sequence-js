# scroll-sequence-js

Scroll-driven image sequence animation component for React. Canvas-based rendering with scenes, HTML overlays, and scroll-synced animations.

Think Apple product pages — images play like a video as you scroll, with text fading in and out at specific frames.

## Installation

```bash
npm install scroll-sequence-js
```

**Peer dependencies:** `react` >= 18, `react-dom` >= 18

## Quick Start

```tsx
import { ScrollSequence, Scene, Overlay, Animate } from "scroll-sequence-js";

const images = Array.from(
  { length: 60 },
  (_, i) => `/frames/frame_${String(i).padStart(4, "0")}.jpg`
);

function App() {
  return (
    <ScrollSequence scrollDelay={0.5}>
      <Scene images={images} scaleMode="fill">
        <Overlay>
          <Animate type="fadeIn" start={0} end={15}>
            <h1>Welcome</h1>
          </Animate>
          <Animate type="fadeOut" start={40} end={55}>
            <p>Keep scrolling...</p>
          </Animate>
        </Overlay>
      </Scene>
    </ScrollSequence>
  );
}
```

## Components

### `<ScrollSequence>`

Root component. Creates the canvas and manages scroll tracking.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `scrollDelay` | `number` | `0` | Smoothing delay in seconds. 0 = instant snap, higher = floatier. Max 3.5 |
| `scrollPerFrame` | `number` | `10` | Scroll distance per frame in pixels. Lower = faster animation, higher = slower |
| `position` | `"sticky" \| "absolute" \| "static"` | `"sticky"` | CSS positioning strategy for the canvas |
| `preloadPercentage` | `number` | `0` | Minimum % of images to load before becoming interactive |
| `waitForLoad` | `boolean` | `false` | Block scrolling past the sequence until all frames are preloaded |
| `renderLoader` | `(progress: number) => ReactNode` | — | Custom loading UI. Receives progress 0–100 |
| `lazy` | `boolean` | `true` | Only start preloading when the sequence approaches the viewport |
| `overlapTop` | `number` | `0` | Overlap at top in px — content above slides over the pinned canvas |
| `overlapBottom` | `number` | `0` | Overlap at bottom in px — content below slides over the pinned canvas |
| `reverseSpeedMultiplier` | `number` | `2` | Speed multiplier when scrolling back up. 2 = twice as fast in reverse |
| `stopDeceleration` | `number` | `0.65` | Deceleration factor (0–1). Higher = snappier stop, lower = more coast |
| `exitFadeLength` | `number` | `0.135` | Fraction of progress over which the canvas fades out at the end (0 = no fade) |
| `onProgress` | `(progress, sceneIndex, sceneProgress) => void` | — | Progress callback |
| `className` | `string` | — | CSS class for the outer container |
| `style` | `CSSProperties` | — | Inline styles for the outer container |

### `<Scene>`

Defines a segment of the animation with its own image set.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `images` | `string[]` | **required** | Array of image URLs for this scene |
| `duration` | `number` | `1` | Scroll height multiplier (2 = twice as long) |
| `scaleMode` | `"fit" \| "fill"` | `"fill"` | Image scaling strategy |
| `horizontalAlignment` | `"left" \| "center" \| "right"` | `"center"` | Horizontal alignment |
| `verticalAlignment` | `"top" \| "center" \| "bottom"` | `"center"` | Vertical alignment |

### `<Overlay>`

HTML content layer positioned over the canvas. Place inside a `<Scene>`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | — | CSS class |
| `style` | `CSSProperties` | — | Inline styles |

### `<Animate>`

Scroll-synced animation wrapper for child elements. Place inside an `<Overlay>`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `AnimationType` | **required** | Animation type |
| `start` | `number` | **required** | Frame number where animation begins |
| `end` | `number` | **required** | Frame number where animation ends |
| `distance` | `number` | `100` | Distance in px for move animations |
| `easing` | `EasingName \| (t: number) => number` | `"linear"` | Easing function |
| `className` | `string` | — | CSS class |
| `style` | `CSSProperties` | — | Inline styles |

**Animation types:** `fadeIn`, `fadeOut`, `moveUp`, `moveDown`, `moveLeft`, `moveRight`, `scaleUp`, `scaleDown`

**Built-in easings:** `linear`, `easeIn`, `easeOut`, `easeInOut`

## Hooks

### `useSceneProgress()`

Access current scene progress from within an `<Overlay>` or `<Animate>`.

```tsx
const { sceneIndex, sceneProgress, frameIndex, frameCount, globalProgress } = useSceneProgress();
```

| Property | Type | Description |
|----------|------|-------------|
| `sceneIndex` | `number` | Current scene index (0-based) |
| `sceneProgress` | `number` | 0–1 progress within the current scene |
| `frameIndex` | `number` | Current frame index within the scene |
| `frameCount` | `number` | Total frames in the current scene |
| `globalProgress` | `number` | 0–1 progress across all scenes |

### `useScrollProgress(ref)`

Returns scroll progress for any container element. Useful for custom scroll-driven effects outside of `<ScrollSequence>`.

```tsx
const ref = useRef<HTMLDivElement>(null);
const { progress, isInView } = useScrollProgress(ref);
```

### `useImagePreloader(urls)`

Preloads images and tracks progress.

```tsx
const { images, progress, isLoaded } = useImagePreloader(imageUrls);
```

## Image URL Helper

```tsx
import { generateImageUrls } from "scroll-sequence-js";

// Generates: ["/frames/frame-0001.jpg", "/frames/frame-0002.jpg", ...]
const urls = generateImageUrls("/frames/frame-{index}.jpg", 60);

// With custom start index and padding
const urls = generateImageUrls("/img/shot_{index}.webp", 100, 1, 4);
```

## Core Engine (framework-agnostic)

For use without React. Import from `scroll-sequence-js/core`.

```ts
import { ScrollEngine } from "scroll-sequence-js/core";

const engine = new ScrollEngine({
  canvas: document.querySelector("canvas")!,
  container: document.querySelector("#scroll-container")!,
  scenes: [{ images: ["/frame_001.jpg", "/frame_002.jpg"] }],
  scrollDelay: 0.5,
  scrollPadding: 0,
  reverseSpeedMultiplier: 2,
  stopDeceleration: 0.65,
  overlapTop: 0,
  onProgress: (progress, sceneIndex, sceneProgress) => {
    console.log(progress);
  },
  onPreloadProgress: (loaded, total) => {
    console.log(`${loaded}/${total}`);
  },
});

// Cleanup
engine.destroy();
```

## Recipes

### Overlap content over the animation

Use `overlapTop` / `overlapBottom` to let surrounding content slide over the pinned canvas — great for hero sections and exit transitions.

```tsx
<ScrollSequence overlapTop={400} overlapBottom={800} exitFadeLength={0.135}>
  <Scene images={frames} scaleMode="fill" />
</ScrollSequence>
```

### Custom loading screen

Block scrolling until images load, with a custom loader:

```tsx
<ScrollSequence
  waitForLoad
  renderLoader={(progress) => (
    <div className="loader">Loading {Math.round(progress)}%</div>
  )}
>
  <Scene images={frames} scaleMode="fill" />
</ScrollSequence>
```

### Multiple scenes

Chain scenes for different animation segments. Each gets its own images and duration.

```tsx
<ScrollSequence scrollDelay={1}>
  <Scene images={introFrames} duration={1}>
    <Overlay>
      <h1>Introduction</h1>
    </Overlay>
  </Scene>
  <Scene images={detailFrames} duration={2}>
    <Overlay>
      <h1>Details</h1>
    </Overlay>
  </Scene>
</ScrollSequence>
```

## Tips

- **Scroll speed:** Adjust `scrollPerFrame` to control animation speed. 5 = fast, 10 = normal, 20 = slow
- **Smoothing:** `scrollDelay` between 0.3–0.8s gives a buttery feel without feeling laggy
- **Image count:** 50–100 images per scene is a good starting point
- **Image format:** Use `.jpg` or `.webp` for best size/quality ratio. Aim for < 60KB per image at 1920×1080
- **Aspect ratio:** Use nearly square ratios if targeting both mobile and desktop
- **Overlap:** Use `overlapTop` to tuck the sequence behind a hero section; pair with `exitFadeLength` for smooth transitions out

## Releasing

Releases are published to npm by GitHub Actions when a semver tag is pushed.

1. Update `version` in `package.json` and commit the change.
2. Push the commit to `main`.
3. Create and push a matching tag, for example:

   ```shell
   git tag v0.1.1
   git push origin v0.1.1
   ```

The release workflow type-checks and builds the package, verifies that the tag
matches `package.json`, publishes with npm provenance, and creates a GitHub
Release. Configure the repository secret `NPM_TOKEN` before the first release.
A granular npm automation token limited to this package is recommended. The
workflow also requests GitHub's OIDC token so npm can attach provenance.

## License

MIT
