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
  redraw(): void;
  render(): void;
  applyViewportTransform(ctx: CanvasRenderingContext2D): void;
  resetCanvases(): void;
  reposition(vec?: Vector | UIEvent): void;
  panBy(vec: Vector): void;
  zoomAt(point: Vector, factor: number): void;
  setScaleAt(point: Vector, worldPoint: Vector, scale: number): void;
  screenToWorld(point: Vector): Vector;
  debouncedReposition(this: unknown, vec?: Vector | UIEvent): void;
  reset(): void;
  cursor: Cursor;
  export(): string;
  import(str: string): void;
}

export class TypeWriter implements TypeWriterClass {
  static _instance: TypeWriterClass;

  viewport = new Viewport();

  chars: Character[] = [];

  cursor = new Cursor(this.viewport);

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

    // iterate characters and move cursor right
    for (let i = 0, len = _chars.length; i < len; i += 1) {
      const {
        position: { x, y },
      } = this.cursor;
      const char = _chars[i];

      this.chars.push(new Character(char, x, y));
      this.cursor.moveright();
    }

    this.render();
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

  resetCanvases = (): void => {
    [textCtx, cursorCtx].forEach((ctx) => {
      const { canvas } = ctx;
      const { devicePixelRatio = 1, innerWidth, innerHeight } = window;

      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
    });

    this.render();
  };

  render = (): void => {
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
    this.render();
  };

  /**
   * Zoom around a screen-space point while keeping that point anchored.
   */
  zoomAt = (point: Vector, factor: number): void => {
    this.viewport.zoomAt(point, factor);
    this.render();
  };

  setScaleAt = (point: Vector, worldPoint: Vector, scale: number): void => {
    this.viewport.setScaleAtWorld(point, worldPoint, scale);
    this.render();
  };

  screenToWorld = (point: Vector): Vector => this.viewport.screenToWorld(point);

  /**
   * Re-render after panning or resizing. A Vector is interpreted as a
   * screen-space pan; a UIEvent indicates that the canvases need resizing.
   */
  reposition = (vec?: Vector | UIEvent): void => {
    if (vec instanceof Vector) {
      this.viewport.panBy(vec);
    }

    positionElem(container, { x: 0, y: 0 });

    this.resetCanvases();
  };

  debouncedReposition = debounce(this.reposition, 100);

  /**
   * Back to the original blank canvas and default viewport.
   */
  reset = () => {
    this.chars = [];
    this.viewport.reset();
    this.cursor.reset();
    container.setAttribute('style', '');

    this.reposition();
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

      this.reset();

      for (const { s, x, y } of chars) {
        this.addCharacter(s, x, y);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('failed to import');
    }
  }
}
