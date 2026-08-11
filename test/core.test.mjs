import test from "node:test";
import assert from "node:assert/strict";
import { FrameRenderer, generateImageUrls, preloadImages } from "../dist/core.js";

test("generateImageUrls creates ordered padded frame URLs", () => {
  assert.deepEqual(
    generateImageUrls("/frames/frame-{index}.webp", 3, 1, 3),
    ["/frames/frame-001.webp", "/frames/frame-002.webp", "/frames/frame-003.webp"]
  );
});

test("preloadImages waits for decode before resolving", async () => {
  const decodeCalls = [];
  globalThis.Image = class {
    set src(value) {
      this.url = value;
      queueMicrotask(() => this.onload?.());
    }
    decode() {
      decodeCalls.push(this.url);
      return Promise.resolve();
    }
  };

  const progress = [];
  const images = await preloadImages(["a.webp", "b.webp"], (value) => progress.push(value));

  assert.equal(images.length, 2);
  assert.deepEqual(decodeCalls.sort(), ["a.webp", "b.webp"]);
  assert.equal(progress.at(-1).loaded, 2);
  assert.equal(progress.at(-1).percent, 100);
});

test("preloadImages reports empty sequences as complete", async () => {
  const progress = [];
  assert.deepEqual(await preloadImages([], (value) => progress.push(value)), []);
  assert.deepEqual(progress, [{ loaded: 0, total: 0, percent: 100 }]);
});

test("FrameRenderer ignores images without decoded dimensions", () => {
  let drawCalls = 0;
  globalThis.window = { devicePixelRatio: 1 };
  const context = {
    scale() {},
    clearRect() {},
    drawImage() { drawCalls += 1; },
  };
  const canvas = {
    width: 0,
    height: 0,
    style: {},
    getContext() { return context; },
  };
  const renderer = new FrameRenderer(canvas);
  renderer.resize(100, 100);
  renderer.drawFrame({ naturalWidth: 0, naturalHeight: 0 });
  assert.equal(drawCalls, 0);
});
