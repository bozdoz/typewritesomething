import MultiAudio from "./utils/MultiAudio";
import NO_AUDIO from "./helpers/NO_AUDIO";
import { TypeWriter } from "./Typewriter";
import { container, cursorCanvas, textInput } from "./helpers/getElements";
import positionElem from "./utils/positionElem";
import getPositionFromEvent from "./utils/getPositionFromEvent";
import Vector from "./utils/Vector";
import Menu from "./Menu";
import addLongTouch from "./utils/addLongTouch";
import getAppMenu from "./getAppMenu";

const isIos = /iPad|iPhone|iPod/.test(navigator.platform);

const keypressAudio = new MultiAudio(
  "/static/audio/keypress.mp3",
  // ios struggles with playing multi-audio; needs to have at most 3
  isIos ? 3 : 7,
);
const newlineAudio = new MultiAudio("/static/audio/return.mp3", 2);
const eventTarget = cursorCanvas;

class App {
  mousemovedelay = 150;

  running = false;

  typewriter = new TypeWriter();

  menu: Menu | null = null;

  removeLongTouch = () => {};

  reset() {
    this.running = true;
    this.typewriter.reset();
    this.events("on");
    this.emptyText();
    this.focusText();
  }

  start() {
    if (this.running) return;

    this.reset();

    this.menu = getAppMenu(this);
  }

  stop() {
    if (!this.running) return;
    this.running = false;

    // kill events
    this.events("off");
    this.removeMoveEvent();

    this.menu?.destroy();

    this.menu = null;
  }

  events = (onoff = "on") => {
    // deno-lint-ignore no-explicit-any
    const documentEvents: Record<string, any> = {
      mousedown: this.handleMouseDown,
      touchstart: this.handleTouchStart,
      mouseup: this.handleMouseUp,
      touchend: this.handleMouseUp,
    };
    // deno-lint-ignore no-explicit-any
    const cursorEvents: Record<string, any> = {
      keydown: this.handleKeyDown,
      keyup: this.handleKeyUp,
      focus: this.handleFocus,
      keypress: this.handleKeyPress,
    };

    const method = onoff === "on" ? "addEventListener" : "removeEventListener";

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in documentEvents) {
      const fnc = documentEvents[key];
      eventTarget[method](key, fnc);
    }

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in cursorEvents) {
      const fnc = cursorEvents[key];
      textInput[method](key, fnc);
    }

    if (onoff === "on") {
      // TODO: maybe move this event to Menu
      this.removeLongTouch = addLongTouch(eventTarget, (e) => {
        const position = getPositionFromEvent(e);

        // remove mobile keyboard for css positioning of menu
        textInput.blur();

        this.menu?.openMenu(position);
      });
    } else {
      this.removeLongTouch();
      this.removeLongTouch = () => {};
    }
  };

  pressedKeys: Record<string, boolean> = {};

  /**
   * keydown handles audio
   * @param {KeyboardEvent} e
   */
  handleKeyDown = (e: KeyboardEvent) => {
    const isMeta = e.altKey || e.ctrlKey || e.metaKey;
    // deno-lint-ignore no-explicit-any
    const noAudio: boolean | string = (NO_AUDIO as any)[e.which] || isMeta;
    const isPressed = this.pressedKeys[e.code];

    if (isPressed) {
      return false;
    }

    if (!noAudio) {
      this.pressedKeys[e.code] = true;

      if (e.key === "Enter") {
        newlineAudio.play();
      } else {
        keypressAudio.play();
      }
      return true;
    }

    if (noAudio === "TAB") {
      // refocus
      globalThis.setTimeout(() => {
        textInput.focus();
      }, 10);
      e.preventDefault();
    }

    return true;
  };

  handleKeyPress = (e: KeyboardEvent) => {
    const isMeta = e.altKey || e.ctrlKey || e.metaKey;
    const disable = e.key === "Tab" || e.key === "Enter";

    if (disable || isMeta) {
      e.preventDefault();
    }

    return !disable;
  };

  /**
   * keyup handles character input and navigation
   * @param {KeyboardEvent} e
   */
  handleKeyUp = (e: KeyboardEvent) => {
    const { key, code } = e;
    const ignoreKey = key === "Shift";
    const isMeta = e.altKey || e.ctrlKey || e.metaKey;

    if (ignoreKey) {
      return;
    }

    if (this.pressedKeys[code]) {
      delete this.pressedKeys[code];
    }

    if (isMeta) {
      // ignore if user is refreshing or navigating or something
      this.emptyText();

      return;
    }

    const { typewriter } = this;
    const nav = typewriter.cursor.navButtons[key];
    // TODO: add test for first character being set
    // ignores first character, which should always be a single character
    const letters = textInput.value.substr(1);

    if (nav) {
      nav();
    } else if (letters) {
      typewriter.addCharacter(letters);
    }

    this.emptyText();
    // android needs to blur to remove autocomplete double-type
    textInput.blur();
    this.focusText();
  };

  handleFocus = () => {
    this.focusText();
  };

  mouseuptimeout?: number;

  mouseDownStartPos: Vector | null = null;

  /**
   * handleMouseDown
   * @param {MouseEvent} e
   */
  handleMouseDown = (e: MouseEvent | TouchEvent) => {
    // TODO: add menu somehow somewhere
    // ignore right click
    if ("button" in e && e.button === 2) return;

    // mousemove would be expensive, so we add it only after the mouse is down
    this.mouseuptimeout = globalThis.setTimeout(() => {
      this.mouseDownStartPos = getPositionFromEvent(e);

      eventTarget.addEventListener("touchmove", this.handleMouseMove);
      eventTarget.addEventListener("mousemove", this.handleMouseMove);
    }, this.mousemovedelay);
  };

  /**
   * handleTouchStart
   * @param {TouchEvent} e
   */
  handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches && e.touches.length === 2) {
      // todo: work on zooming
      // (https://codepen.io/bozdoz/pen/xxEmJyx?editors=0011)

      return true;
    }

    return this.handleMouseDown(e);
  };

  /**
   * handleMouseMove
   * @param {MouseEvent} e
   */
  handleMouseMove = (e: MouseEvent | TouchEvent) => {
    // probably prevents browser zoom
    e.preventDefault();
    e.stopPropagation();

    if (!this.mouseDownStartPos) {
      return;
    }

    const _position = getPositionFromEvent(e)._subtract(this.mouseDownStartPos);

    // fake canvas moving by cheaply altering css
    positionElem(container, _position);

    this.typewriter.cursor.clear();
  };

  /**
   * handleMouseUp
   * @param {MouseEvent} e
   */
  handleMouseUp = (e: MouseEvent | TouchEvent) => {
    const rightClick = "button" in e && e.button === 2;
    const stillTouches = "touches" in e && e.touches.length > 0;

    if (rightClick || stillTouches) return;

    this.removeMoveEvent();

    const position = getPositionFromEvent(e);

    if (this.mouseDownStartPos) {
      // reposition canvas if mouse moved
      position._subtract(this.mouseDownStartPos);

      this.typewriter.reposition(position);
      this.mouseDownStartPos = null;
    } else {
      // act as if it were just a click handler
      this.updateCursor(position);
    }
  };

  /**
   * Updates cursor to a given position
   * @param {Vector} position
   */
  updateCursor = (position: Vector) => {
    this.typewriter.cursor.moveToClick(position);
    this.focusText();
  };

  removeMoveEvent = () => {
    globalThis.clearTimeout(this.mouseuptimeout);
    eventTarget.removeEventListener("touchmove", this.handleMouseMove);
    eventTarget.removeEventListener("mousemove", this.handleMouseMove);
  };

  emptyText = () => {
    // sets value to empty first to adjust for cursor location
    textInput.value = "";
    // leaves a character to disable automatic ProperCase in mobile
    textInput.value = "=";
  };

  focusText = () => {
    textInput.focus();
    // TODO: reposition canvas to quasi-center textInput
  };
}

export default App;
