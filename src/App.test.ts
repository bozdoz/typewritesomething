import { fireEvent } from '@testing-library/dom';
import App from './App';
import { textInput } from './helpers/getElements';
import Vector from './utils/Vector';

jest.mock('./helpers/getElements');

jest.useFakeTimers();

const mockPlay = jest.fn();
window.Audio.prototype.play = mockPlay;

/**
 * Simulate keydown event
 */
function getEvent(char: string) {
  return {
    key: char,
    which: char.toLowerCase().charCodeAt(0) - 32,
  };
}

describe('Character', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
    app.typewriter.viewport.reset();

    jest.resetAllMocks();
    jest.spyOn(app, 'handleKeyUp');
    jest.spyOn(app, 'handleKeyDown');
    jest.spyOn(app, 'events');
  });

  it('has a typewriter instance', () => {
    expect(app.typewriter).toBeTruthy();
  });

  it('calls audio on keydown', () => {
    app.start();

    expect(app.events).toHaveBeenCalled();

    fireEvent.keyDown(textInput, getEvent('d'));

    expect(app.handleKeyDown).toHaveBeenCalled();
    expect(mockPlay).toHaveBeenCalled();
  });

  it('calls audio on keydown, once per letter', () => {
    app.start();

    fireEvent.keyDown(textInput, getEvent('d'));
    fireEvent.keyDown(textInput, getEvent('d'));

    expect(app.handleKeyDown).toHaveBeenCalledTimes(2);
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it('resets audio on keydown, after keyup on the same letter', () => {
    app.start();

    fireEvent.keyDown(textInput, getEvent('d'));
    fireEvent.keyUp(textInput, getEvent('d'));
    fireEvent.keyDown(textInput, getEvent('d'));

    expect(app.handleKeyUp).toHaveBeenCalledTimes(1);
    expect(app.handleKeyDown).toHaveBeenCalledTimes(2);
    expect(mockPlay).toHaveBeenCalledTimes(2);
  });

  it('zooms only for modified wheel events', () => {
    const zoomAt = jest.spyOn(app.typewriter, 'zoomAt');
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();
    const event = {
      clientX: 100,
      clientY: 120,
      ctrlKey: false,
      deltaMode: 0,
      deltaY: 10,
      metaKey: true,
      preventDefault,
      stopPropagation,
    } as any;

    app.handleWheel(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(zoomAt).toHaveBeenCalledWith(new Vector(100, 120), Math.exp(-0.02));

    zoomAt.mockClear();
    preventDefault.mockClear();
    app.handleWheel({ ...event, metaKey: false });

    expect(zoomAt).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('starts pinch zooming and keeps the pinch from becoming a click', () => {
    const setScaleAt = jest.spyOn(app.typewriter, 'setScaleAt');
    const moveToClick = jest.spyOn(app.typewriter.cursor, 'moveToClick');
    const startEvent = {
      touches: [
        { clientX: 50, clientY: 100 },
        { clientX: 150, clientY: 100 },
      ],
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as any;
    const moveEvent = {
      touches: [
        { clientX: 20, clientY: 100 },
        { clientX: 220, clientY: 100 },
      ],
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as any;

    app.handleTouchStart(startEvent);
    app.handleTouchMove(moveEvent);

    expect(setScaleAt).toHaveBeenCalledWith(
      new Vector(120, 100),
      new Vector(100, 100),
      2
    );

    app.handleMouseUp({ touches: [{ clientX: 20, clientY: 100 }] } as any);
    app.handleMouseUp({ touches: [] } as any);

    expect(moveToClick).not.toHaveBeenCalled();
  });
});
