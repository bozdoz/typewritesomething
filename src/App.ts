import MultiAudio from './utils/MultiAudio';
import NO_AUDIO from './helpers/NO_AUDIO';
import { TypeWriter } from './Typewriter';
import { container, textInput, cursorCanvas } from './helpers/getElements';
import positionElem from './utils/positionElem';
import getPositionFromEvent from './utils/getPositionFromEvent';
import Vector from './utils/Vector';
import Menu from './Menu';
import addLongTouch from './utils/addLongTouch';
import getAppMenu from './getAppMenu';

const isIos = /iPad|iPhone|iPod/.test(navigator.platform);

const keypressAudio = new MultiAudio(
  '/static/audio/keypress.mp3',
  // ios struggles with playing multi-audio; needs to have at most 3
  isIos ? 3 : 7
);
const newlineAudio = new MultiAudio('/static/audio/return.mp3', 2);
const eventTarget = cursorCanvas;
const WHEEL_ZOOM_INTENSITY = 0.002;

interface PinchState {
  startDistance: number;
  startScale: number;
  worldAnchor: Vector;
}

class App {
  mousemovedelay = 150;

  running = false;

  typewriter = new TypeWriter();

  menu: Menu | null = null;

  removeLongTouch = () => {};

  reset() {
    this.running = true;
    this.typewriter.reset();
    this.events('on');
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
    this.events('off');
    this.removeMoveEvent();

    this.menu?.destroy();

    this.menu = null;
  }

  events = (onoff = 'on') => {
    const documentEvents: Record<string, any> = {
      mousedown: this.handleMouseDown,
      touchstart: this.handleTouchStart,
      mouseup: this.handleMouseUp,
      touchend: this.handleMouseUp,
      touchcancel: this.handleTouchCancel,
    };
    const cursorEvents: Record<string, any> = {
      keydown: this.handleKeyDown,
      keyup: this.handleKeyUp,
      focus: this.handleFocus,
      keypress: this.handleKeyPress,
    };

    const method = onoff === 'on' ? 'addEventListener' : 'removeEventListener';

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in documentEvents) {
      const fnc = documentEvents[key];
      eventTarget[method](key, fnc);
    }

    if (onoff === 'on') {
      eventTarget.addEventListener('touchmove', this.handleTouchMove, {
        passive: false,
      });
      eventTarget.addEventListener('wheel', this.handleWheel, {
        passive: false,
      });
    } else {
      eventTarget.removeEventListener('touchmove', this.handleTouchMove);
      eventTarget.removeEventListener('wheel', this.handleWheel);
    }

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in cursorEvents) {
      const fnc = cursorEvents[key];
      textInput[method](key, fnc);
    }

    if (onoff === 'on') {
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
    const noAudio: boolean | string = (NO_AUDIO as any)[e.which] || isMeta;
    const isPressed = this.pressedKeys[e.code];

    if (isPressed) {
      return false;
    }

    if (!noAudio) {
      this.pressedKeys[e.code] = true;

      if (e.key === 'Enter') {
        newlineAudio.play();
      } else {
        keypressAudio.play();
      }
      return true;
    }

    if (noAudio === 'TAB') {
      // refocus
      window.setTimeout(() => {
        textInput.focus();
      }, 10);
      e.preventDefault();
    }

    return true;
  };

  handleKeyPress = (e: KeyboardEvent) => {
    const isMeta = e.altKey || e.ctrlKey || e.metaKey;
    const disable = e.key === 'Tab' || e.key === 'Enter';

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
    const ignoreKey = key === 'Shift';
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

  mouseDragOffset = new Vector(0, 0);

  pinchState: PinchState | null = null;

  suppressTouchEnd = false;

  /**
   * handleMouseDown
   * @param {MouseEvent} e
   */
  handleMouseDown = (e: MouseEvent | TouchEvent) => {
    if (this.pinchState) return;

    // TODO: add menu somehow somewhere
    // ignore right click
    if ('button' in e && e.button === 2) return;

    // mousemove would be expensive, so we add it only after the mouse is down
    this.mouseuptimeout = window.setTimeout(() => {
      this.mouseDownStartPos = getPositionFromEvent(e);
      this.mouseDragOffset = new Vector(0, 0);

      eventTarget.addEventListener('mousemove', this.handleMouseMove);
    }, this.mousemovedelay);
  };

  /**
   * handleTouchStart
   * @param {TouchEvent} e
   */
  handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length >= 2) {
      this.startPinch(e);
      return true;
    }

    return this.handleMouseDown(e);
  };

  getTouchMidpoint = (touches: TouchList): Vector => {
    const first = touches[0];
    const second = touches[1];

    return new Vector(
      (first.clientX + second.clientX) / 2,
      (first.clientY + second.clientY) / 2
    );
  };

  getTouchDistance = (touches: TouchList): number => {
    const first = touches[0];
    const second = touches[1];
    const x = second.clientX - first.clientX;
    const y = second.clientY - first.clientY;

    return Math.max(Math.sqrt(x * x + y * y), 1);
  };

  startPinch = (e: TouchEvent) => {
    const midpoint = this.getTouchMidpoint(e.touches);
    const hadActiveDrag = this.mouseDownStartPos !== null;

    this.removeMoveEvent();
    positionElem(container, { x: 0, y: 0 });

    if (hadActiveDrag) {
      this.typewriter.panBy(this.mouseDragOffset);
    }

    this.mouseDownStartPos = null;
    this.mouseDragOffset = new Vector(0, 0);
    this.pinchState = {
      startDistance: this.getTouchDistance(e.touches),
      startScale: this.typewriter.viewport.scale,
      worldAnchor: this.typewriter.screenToWorld(midpoint),
    };
    this.suppressTouchEnd = true;
  };

  handleTouchMove = (e: TouchEvent) => {
    if (this.pinchState) {
      this.handlePinchMove(e);
    } else if (this.mouseDownStartPos) {
      this.handleMouseMove(e);
    }
  };

  handlePinchMove = (e: TouchEvent) => {
    if (!this.pinchState || e.touches.length < 2) return;

    e.preventDefault();
    e.stopPropagation();

    const midpoint = this.getTouchMidpoint(e.touches);
    const distance = this.getTouchDistance(e.touches);
    const scale =
      this.pinchState.startScale * (distance / this.pinchState.startDistance);

    this.typewriter.setScaleAt(midpoint, this.pinchState.worldAnchor, scale);
  };

  endPinch = () => {
    this.pinchState = null;
    this.mouseDownStartPos = null;
    this.removeMoveEvent();
    positionElem(container, { x: 0, y: 0 });
    this.typewriter.render();
  };

  handleTouchCancel = () => {
    this.endPinch();
    this.suppressTouchEnd = false;
  };

  handleWheel = (e: WheelEvent) => {
    if (!e.metaKey && !e.ctrlKey) return;

    e.preventDefault();
    e.stopPropagation();

    const deltaMultiplier = e.deltaMode === 1 ? 16 : window.innerHeight;
    const delta = e.deltaMode === 0 ? e.deltaY : e.deltaY * deltaMultiplier;
    const factor = Math.exp(-delta * WHEEL_ZOOM_INTENSITY);

    this.typewriter.zoomAt(new Vector(e.clientX, e.clientY), factor);
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
    this.mouseDragOffset = _position;

    // fake canvas moving by cheaply altering css
    positionElem(container, _position);

    this.typewriter.cursor.clear();
  };

  /**
   * handleMouseUp
   * @param {MouseEvent} e
   */
  handleMouseUp = (e: MouseEvent | TouchEvent) => {
    const rightClick = 'button' in e && e.button === 2;
    const stillTouches = 'touches' in e && e.touches.length > 0;

    if (this.pinchState) {
      this.endPinch();
      return;
    }

    if ('touches' in e && this.suppressTouchEnd) {
      if (!stillTouches) {
        this.suppressTouchEnd = false;
      }
      return;
    }

    if (rightClick || stillTouches) return;

    this.removeMoveEvent();

    const position = getPositionFromEvent(e);

    if (this.mouseDownStartPos) {
      // reposition canvas if mouse moved
      position._subtract(this.mouseDownStartPos);

      this.typewriter.reposition(position);
      this.mouseDownStartPos = null;
      this.mouseDragOffset = new Vector(0, 0);
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
    this.typewriter.cursor.moveToClick(this.typewriter.screenToWorld(position));
    this.focusText();
  };

  removeMoveEvent = () => {
    window.clearTimeout(this.mouseuptimeout);
    eventTarget.removeEventListener('mousemove', this.handleMouseMove);
  };

  emptyText = () => {
    // sets value to empty first to adjust for cursor location
    textInput.value = '';
    // leaves a character to disable automatic ProperCase in mobile
    textInput.value = '=';
  };

  focusText = () => {
    textInput.focus();
    // TODO: reposition canvas to quasi-center textInput
  };
}

export default App;
