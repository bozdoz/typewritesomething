import Vector from './Vector';
import Viewport, { MAX_SCALE, MIN_SCALE } from './Viewport';

describe('Viewport', () => {
  it('converts between screen and world coordinates', () => {
    const viewport = new Viewport();

    viewport.panBy(new Vector(20, -10));
    viewport.setScaleAt(new Vector(0, 0), 2);

    const worldPoint = new Vector(40, 25);
    const screenPoint = viewport.worldToScreen(worldPoint);

    expect(viewport.screenToWorld(screenPoint)).toEqual(worldPoint);
  });

  it('keeps the point under the cursor fixed while zooming', () => {
    const viewport = new Viewport();
    const anchor = new Vector(120, 80);
    const worldPoint = viewport.screenToWorld(anchor);

    viewport.zoomAt(anchor, 2);

    expect(viewport.scale).toBe(2);
    expect(viewport.worldToScreen(worldPoint)).toEqual(anchor);
  });

  it('clamps zoom to the supported range', () => {
    const viewport = new Viewport();

    viewport.zoomAt(new Vector(0, 0), 0.001);
    expect(viewport.scale).toBe(MIN_SCALE);

    viewport.zoomAt(new Vector(0, 0), 1000);
    expect(viewport.scale).toBe(MAX_SCALE);
  });

  it('supports pinch scaling around a moving midpoint', () => {
    const viewport = new Viewport();
    const midpoint = new Vector(100, 100);
    const worldAnchor = viewport.screenToWorld(midpoint);

    viewport.setScaleAtWorld(new Vector(140, 100), worldAnchor, 2);

    expect(viewport.worldToScreen(worldAnchor)).toEqual({ x: 140, y: 100 });
  });
});
