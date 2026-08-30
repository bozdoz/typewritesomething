import Vector from "./utils/Vector";
import { Cursor } from "./Cursor";
import { Character } from "./Character";
import { container, cursorCtx, textCtx } from "./helpers/getElements";
import debounce from "./utils/debounce";
import positionElem from "./utils/positionElem";

const FONT_SIZE = 26;
const TEXT_COLOR = "#150904";
const CURSOR_COLOR = "#4787ea";
const GLOBAL_ALPHA = 0.72;
const letterSize = parseInt(
  String(Math.min(FONT_SIZE, globalThis.innerWidth / 17)),
  10,
);

interface TypeWriterClass {
  canvasOffset: Vector;
  containerScale: number;
  chars: Character[];
  addCharacter(_chars: string): void;
  redraw(): void;
  resetCanvases(): void;
  reposition(vec?: Vector | UIEvent): void;
  debouncedReposition(this: unknown, vec?: Vector | UIEvent): void;
  reset(): void;
  cursor: Cursor;
  export(): string;
  import(str: string): void;
}

export class TypeWriter implements TypeWriterClass {
  static _instance: TypeWriterClass;

  canvasOffset = new Vector(0, 0);

  containerScale = 1;

  chars: Character[] = [];

  cursor = new Cursor();

  constructor() {
    if (TypeWriter._instance) {
      return TypeWriter._instance;
    }

    TypeWriter._instance = this;

    // add events
    globalThis.addEventListener("resize", this.debouncedReposition);
  }

  addCharacter = (_chars: string, _x?: number, _y?: number): void => {
    // manually set position and update cursor
    if (_x !== undefined && _y !== undefined) {
      this.chars.push(new Character(this, _chars, _x, _y));
      this.cursor.update(new Vector(_x, _y));
      return;
    }
    // iterate characters and move cursor right
    for (let i = 0, len = _chars.length; i < len; i += 1) {
      const {
        position: { x, y },
      } = this.cursor;
      const char = _chars[i];

      this.chars.push(new Character(this, char, x, y));
      this.cursor.moveright();
    }
  };

  redraw = (): void => {
    this.chars.forEach((char) => char.draw());
  };

  resetCanvases = (): void => {
    [textCtx, cursorCtx].forEach((ctx) => {
      const { canvas } = ctx;
      const { devicePixelRatio = 1, innerWidth, innerHeight } = window;

      ctx.setTransform(1, 0, 0, 1, 0, 0);

      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;

      ctx.scale(devicePixelRatio, devicePixelRatio);

      ctx.globalAlpha = GLOBAL_ALPHA;
    });

    // reset contexts, because resizing wipes them
    textCtx.font = `${letterSize}px Special Elite, serif`;
    textCtx.textBaseline = "top";
    textCtx.fillStyle = TEXT_COLOR;

    cursorCtx.fillStyle = CURSOR_COLOR;
    cursorCtx.scale(this.containerScale, this.containerScale);
  };

  /**
   * offset characters for given x/y
   * useful for moving/dragging
   * useful for redrawing (b/c needs resetting)
   */
  reposition = (vec?: Vector | UIEvent): void => {
    if (vec instanceof Vector) {
      this.canvasOffset._add(vec);
    }

    positionElem(container, { x: 0, y: 0 });

    this.resetCanvases();
    this.redraw();
  };

  debouncedReposition = debounce(this.reposition, 100);

  /**
   * back to original blank canvas
   */
  reset = () => {
    this.chars = [];
    this.cursor.reset();
    this.canvasOffset = new Vector(0, 0);
    this.containerScale = 1;
    container.setAttribute("style", "");

    this.reposition();
    this.cursor.draw();
  };

  export() {
    // just save x,y,str and re-instantiate classes in import
    return JSON.stringify(
      this.chars.map(({ x, y, s }: Character) => ({ x, y, s })),
    );
  }

  import(str: string) {
    try {
      const chars: Pick<Character, "x" | "y" | "s">[] = JSON.parse(str);

      if (!Array.isArray(chars)) {
        return;
      }

      this.reset();

      for (const { s, x, y } of chars) {
        this.addCharacter(s, x, y);
      }
    } catch (_) {
      // eslint-disable-next-line no-console
      console.error("failed to import");
    }
  }
}
