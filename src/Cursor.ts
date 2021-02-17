import { cursorCtx, textInput } from './helpers/getElements';
import positionElem from './utils/positionElem';
import Vector from './utils/Vector';

const FONT_SIZE = 26;
const containerScale = 1;
const GLOBAL_ALPHA = 0.72;
const letterSize = parseInt(
  String(Math.min(FONT_SIZE, window.innerWidth / 17)),
  10
);
const letterWidth = (letterSize * 12) / 20;
const lineHeight = letterSize + 8;
const cursorWidth = letterWidth;
const cursorHeight = lineHeight - 6;
const paddingVec = (function getPaddingVec() {
  const _x = Math.min(100, window.innerWidth / 8);
  const _y = Math.min(_x, window.innerHeight / 8);
  return new Vector(_x, _y);
})();

// top-left
const initialPosVec = paddingVec;

export class Cursor {
  _cursorTimeout?: number;

  _raf?: number;

  _time?: Date;

  _opacity?: number;

  position = initialPosVec;

  reset = () => {
    this.position = initialPosVec;
  };

  clear = () => {
    const _pos = this.position.subtract(1).divideBy(containerScale);

    // rect appears to have a border on the bottom-right
    const width = cursorWidth + 4;
    const height = cursorHeight + 4;
    cursorCtx.clearRect(_pos.x, _pos.y, width, height);
  };

  /**
   * @param {Vector} vec
   */
  update = (vec: Vector) => {
    this.clear();

    this.position = vec;

    setTimeout(() => {
      positionElem(textInput, {
        x: Math.min(vec.x, window.innerWidth),
        y: Math.min(vec.y, window.innerHeight),
      });
    }, 0);
    this.draw();
  };

  _draw = () => {
    const _pos = this.position.divideBy(containerScale);

    cursorCtx.fillRect(_pos.x, _pos.y, cursorWidth, cursorHeight);
  };

  draw = () => {
    this._draw();

    window.clearTimeout(this._cursorTimeout!);
    if (this._raf) {
      window.cancelAnimationFrame(this._raf);
    }
    this._opacity = GLOBAL_ALPHA;
    this._cursorTimeout = window.setTimeout(this.fadeOut.bind(this), 2200);
  };

  nudge = (vec: Vector) => {
    this.update(this.position.add(vec.multiplyBy(containerScale)));
  };

  moveleft = () => {
    this.nudge(new Vector(-cursorWidth, 0));
  };

  moveright = () => {
    this.nudge(new Vector(cursorWidth, 0));
  };

  moveup = () => {
    this.nudge(new Vector(0, -cursorHeight));
  };

  movedown = () => {
    this.nudge(new Vector(0, cursorHeight));
  };

  /** centers on mouse click */
  moveToClick = (vec: Vector) => {
    this.update(vec.subtract(new Vector(cursorWidth / 2, cursorHeight / 2)));
  };

  addtab = () => {
    this.nudge(new Vector(letterWidth * 4, 0));
  };

  newline = () => {
    this.update(new Vector(paddingVec.x, this.position.y + lineHeight));
  };

  fadeOut = () => {
    this._time = new Date();
    this._raf = window.requestAnimationFrame(this._fadeanim.bind(this));
  };

  _fadeanim = () => {
    const dt = Date.now() - this._time!.valueOf();
    const newOpacity = this._opacity! - (0.1 * dt) / 300;

    if (newOpacity <= 0) {
      this.clear();
    } else {
      cursorCtx.save();
      this.clear();
      this._opacity = newOpacity;
      cursorCtx.globalAlpha = this._opacity;
      this._draw();
      cursorCtx.restore();
      this._raf = window.requestAnimationFrame(this._fadeanim.bind(this));
    }
  };

  /** mapping for keys that move cursor */
  navButtons: Record<string, () => void> = {
    Backspace: this.moveleft.bind(this),
    Tab: this.addtab.bind(this),
    ArrowLeft: this.moveleft.bind(this),
    ArrowUp: this.moveup.bind(this),
    ArrowRight: this.moveright.bind(this),
    ArrowDown: this.movedown.bind(this),
    Enter: this.newline.bind(this),
  };
}