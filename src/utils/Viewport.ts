import Vector from './Vector';

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 8;

const clamp = (value: number): number =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

/**
 * Maps logical writing coordinates to screen coordinates.
 */
class Viewport {
  scale = 1;

  offset = new Vector(0, 0);

  screenToWorld = (point: Vector): Vector =>
    point.subtract(this.offset).divideBy(this.scale);

  worldToScreen = (point: Vector): Vector =>
    point.multiplyBy(this.scale).add(this.offset);

  panBy = (delta: Vector): void => {
    this.offset._add(delta);
  };

  setScaleAt = (point: Vector, scale: number): void => {
    this.setScaleAtWorld(point, this.screenToWorld(point), scale);
  };

  setScaleAtWorld = (
    point: Vector,
    worldPoint: Vector,
    scale: number
  ): void => {
    this.scale = clamp(scale);
    this.offset = point.subtract(worldPoint.multiplyBy(this.scale));
  };

  zoomAt = (point: Vector, factor: number): void => {
    this.setScaleAt(point, this.scale * factor);
  };

  reset = (): void => {
    this.scale = 1;
    this.offset = new Vector(0, 0);
  };
}

export default Viewport;
