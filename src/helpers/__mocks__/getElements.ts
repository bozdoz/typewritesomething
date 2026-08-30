HTMLCanvasElement.prototype.getContext = () => ({
  canvas: {
    style: {},
  },
  // TODO test that these mocks are called
  scale() {},
  clearRect() {},
  fillRect() {},
  save() {},
  translate() {},
  rotate() {},
  fillText() {},
  restore() {},
  setTransform() {},
  // deno-lint-ignore no-explicit-any
} as any);

export const container = document.createElement("div");
export const textInput = document.createElement("div");
export const textCanvas = document.createElement("canvas");
export const cursorCanvas = document.createElement("canvas");
export const textCtx = textCanvas.getContext("2d", { alpha: true });
export const cursorCtx = cursorCanvas.getContext("2d");
