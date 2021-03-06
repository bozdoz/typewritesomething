export const container = document.getElementById('container') as HTMLElement;
export const textInput = document.getElementById(
  'text-input'
) as HTMLInputElement;
export const textCanvas = document.getElementById(
  'text-canvas'
) as HTMLCanvasElement;
export const cursorCanvas = document.getElementById(
  'cursor-canvas'
) as HTMLCanvasElement;
export const textCtx = textCanvas.getContext('2d', {
  alpha: true,
}) as CanvasRenderingContext2D;
export const cursorCtx = cursorCanvas.getContext(
  '2d'
) as CanvasRenderingContext2D;
