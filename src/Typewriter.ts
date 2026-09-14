import { Cursor } from './Cursor';
import { Character } from './Character';
import { container, cursorCtx, textCtx } from './helpers/getElements';
import debounce from './utils/debounce';
import Vector from './utils/Vector';
import Viewport from './utils/Viewport';
import positionElem from './utils/positionElem';

const FONT_SIZE = 26;
const TEXT_COLOR = '#150904';
const CURSOR_COLOR = '#4787ea';
const GLOBAL_ALPHA = 0.72;
const letterSize = parseInt(
  String(Math.min(FONT_SIZE, window.innerWidth / 17)),
  10
);

interface TypeWriterClass {
  viewport: Viewport;
  chars: Character[];
  addCharacter(_chars: string): void;
  appendCharacters(_chars: string): Character[];
  drawCharacters(chars: Character[]): void;
  redraw(): void;
  render(): void;
  applyViewportTransform(ctx: CanvasRenderingContext2D): void;
  resetCanvases(render?: boolean): void;
  cancelScheduledRender(): void;
  scheduleRender(): void;
  reposition(vec?: Vector | UIEvent, render?: boolean): void;
  panBy(vec: Vector): void;
  zoomAt(point: Vector, factor: number): void;
  setScaleAt(point: Vector, worldPoint: Vector, scale: number): void;
  screenToWorld(point: Vector): Vector;
  debouncedReposition(this: unknown, vec?: Vector | UIEvent): void;
  reset(render?: boolean): void;
  cursor: Cursor;
  export(): string;
  import(str: string): void;
}

export class TypeWriter implements TypeWriterClass {
  static _instance: TypeWriterClass;

  viewport = new Viewport();

  chars: Character[] = [];

  cursor = new Cursor(this.viewport);

  _renderFrame?: number;

  constructor() {
    if (TypeWriter._instance) {
      return TypeWriter._instance;
    }

    TypeWriter._instance = this;

    // add events
    window.addEventListener('resize', this.debouncedReposition);
  }

  addCharacter = (_chars: string, _x?: number, _y?: number): void => {
    // manually set position and update cursor
    if (_x !== undefined && _y !== undefined) {
      this.chars.push(new Character(_chars, _x, _y));
      this.cursor.update(new Vector(_x, _y));
      this.render();
      return;
    }

    // A viewport update may be waiting for the next animation frame. Flush
    // it before drawing new text so the existing and new characters share a
    // transform.
    if (this._renderFrame !== undefined) {
      this.render();
    }

    this.drawCharacters(this.appendCharacters(_chars));
  };

  appendCharacters = (_chars: string): Character[] => {
    const newChars: Character[] = [];

    // iterate characters and move cursor right
    for (let i = 0, len = _chars.length; i < len; i += 1) {
      const {
        position: { x, y },
      } = this.cursor;
      const char = _chars[i];
      const character = new Character(char, x, y);

      this.chars.push(character);
      newChars.push(character);
      this.cursor.moveright();
    }

    return newChars;
  };

  drawCharacters = (chars: Character[]): void => {
    if (chars.length === 0) return;

    this.applyViewportTransform(textCtx);
    textCtx.globalAlpha = GLOBAL_ALPHA;
    textCtx.font = `${letterSize}px Special Elite, serif`;
    textCtx.textBaseline = 'top';
    textCtx.fillStyle = TEXT_COLOR;

    chars.forEach((char) => char.draw());
  };

  redraw = (): void => {
    this.chars.forEach((char) => char.draw());
  };

  applyViewportTransform = (ctx: CanvasRenderingContext2D): void => {
    const { devicePixelRatio = 1 } = window;
    const { offset, scale } = this.viewport;

    ctx.setTransform(
      devicePixelRatio * scale,
      0,
      0,
      devicePixelRatio * scale,
      devicePixelRatio * offset.x,
      devicePixelRatio * offset.y
    );
  };

  resetCanvases = (render = true): void => {
    [textCtx, cursorCtx].forEach((ctx) => {
      const { canvas } = ctx;
      const { devicePixelRatio = 1, innerWidth, innerHeight } = window;

      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
    });

    if (render) {
      this.render();
    }
  };

  cancelScheduledRender = (): void => {
    if (this._renderFrame === undefined) return;

    // requestAnimationFrame is unavailable in jsdom and other non-visual
    // environments, so scheduleRender falls back to setTimeout there.
    if (typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(this._renderFrame);
    } else {
      window.clearTimeout(this._renderFrame);
    }

    this._renderFrame = undefined;
  };

  scheduleRender = (): void => {
    if (this._renderFrame !== undefined) return;

    if (typeof window.requestAnimationFrame === 'function') {
      this._renderFrame = window.requestAnimationFrame(() => {
        this._renderFrame = undefined;
        this.render();
      });
      return;
    }

    // jsdom does not provide requestAnimationFrame unless it is configured
    // as a visual browser. Keep the same coalescing semantics in tests.
    this._renderFrame = window.setTimeout(() => {
      this._renderFrame = undefined;
      this.render();
    }, 0);
  };

  render = (): void => {
    this.cancelScheduledRender();

    [textCtx, cursorCtx].forEach((ctx) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      this.applyViewportTransform(ctx);
      ctx.globalAlpha = GLOBAL_ALPHA;
    });

    textCtx.font = `${letterSize}px Special Elite, serif`;
    textCtx.textBaseline = 'top';
    textCtx.fillStyle = TEXT_COLOR;

    cursorCtx.fillStyle = CURSOR_COLOR;

    this.redraw();
    this.cursor.positionInput();
    this.cursor.draw();
  };

  /**
   * Pan the viewport by a screen-space vector.
   */
  panBy = (vec: Vector): void => {
    this.viewport.panBy(vec);
    this.scheduleRender();
  };

  /**
   * Zoom around a screen-space point while keeping that point anchored.
   */
  zoomAt = (point: Vector, factor: number): void => {
    this.viewport.zoomAt(point, factor);
    this.scheduleRender();
  };

  setScaleAt = (point: Vector, worldPoint: Vector, scale: number): void => {
    this.viewport.setScaleAtWorld(point, worldPoint, scale);
    this.scheduleRender();
  };

  screenToWorld = (point: Vector): Vector => this.viewport.screenToWorld(point);

  /**
   * Re-render after panning or resizing. A Vector is interpreted as a
   * screen-space pan; a UIEvent indicates that the canvases need resizing.
   */
  reposition = (vec?: Vector | UIEvent, render = true): void => {
    if (vec instanceof Vector) {
      this.viewport.panBy(vec);
    }

    positionElem(container, { x: 0, y: 0 });

    this.resetCanvases(render);
  };

  debouncedReposition = debounce(this.reposition, 100);

  /**
   * Back to the original blank canvas and default viewport.
   */
  reset = (render = true) => {
    this.cancelScheduledRender();
    this.chars = [];
    this.viewport.reset();
    this.cursor.reset();
    container.setAttribute('style', '');

    this.reposition(undefined, render);
  };

  export() {
    // just save x,y,str and re-instantiate classes in import
    return JSON.stringify(
      this.chars.map(({ x, y, s }: Character) => ({ x, y, s }))
    );
  }

  import(str: string) {
    try {
      const chars: Pick<Character, 'x' | 'y' | 's'>[] = JSON.parse(str);

      if (!Array.isArray(chars)) {
        return;
      }

      this.reset(false);
      // Restore saved coordinates in one batch. Calling addCharacter here
      // would perform a full scene render for every saved character.
      this.chars = chars.map(({ s, x, y }) => new Character(s, x, y));

      // Keep the cursor at the saved position without appending a new char.
      const lastChar = chars[chars.length - 1];
      if (lastChar) {
        this.cursor.position = new Vector(lastChar.x, lastChar.y);
      }

      this.render();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('failed to import');
    }
  }
}
