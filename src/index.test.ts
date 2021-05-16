import { fireEvent } from '@testing-library/dom';

const appStart = jest.fn();
const appFocus = jest.fn();

interface App {
  start(): void;
  focusText(): void;
}

/** @constructor */
function mockApp(this: App) {
  this.start = appStart;
  this.focusText = appFocus;
}

jest.mock('./App', () => ({
  default: mockApp,
}));

describe('index', () => {
  let splash: HTMLDivElement;
  const loadEvent = new Event('load');

  beforeEach(() => {
    jest.clearAllMocks();

    splash = document.createElement('div');
    splash.id = 'splash';
    splash.tabIndex = 0;

    // (re) initialize html
    while (document.body.firstChild) {
      document.body.firstChild.remove();
    }
    document.body.append(splash);

    // re-add index file
    jest.isolateModules(() => {
      require('./index');
    });
  });

  it('gives focus to splash on load', () => {
    expect(document.activeElement).toBe(document.body);
    window.dispatchEvent(loadEvent);
    expect(document.activeElement).toBe(splash);
  });

  it('wipes location hash on load', () => {
    const windowSpy = jest.spyOn(global, 'window', 'get');
    let hash = '';

    windowSpy.mockImplementationOnce(() => {
      const mockWindow: any = {
        ...window,
        location: {
          ...window.location,
        },
      };

      Object.defineProperty(mockWindow.location, 'hash', {
        get() {
          return hash;
        },
        set(newValue) {
          hash = newValue;
        },
      });
      return mockWindow;
    });

    window.location.hash = 'asdf';

    window.dispatchEvent(loadEvent);

    expect(window.location.hash).toBe('');
  });

  it('starts app after keyup on splash', () => {
    window.dispatchEvent(loadEvent);

    fireEvent.keyUp(splash);

    expect(appStart).toHaveBeenCalledTimes(1);
    expect(appFocus).toHaveBeenCalledTimes(1);
  });

  it('starts app after click on splash', () => {
    window.dispatchEvent(loadEvent);

    fireEvent.click(splash);

    expect(appStart).toHaveBeenCalledTimes(1);
    expect(appFocus).toHaveBeenCalledTimes(1);
  });

  it('hides the splash after click', () => {
    window.dispatchEvent(loadEvent);

    fireEvent.click(splash);

    expect(splash.classList.contains('hide')).toBe(true);
  });

  it('does not start app if ctrl key pressed', () => {
    window.dispatchEvent(loadEvent);

    const keyUp = new KeyboardEvent('keyup', {
      ctrlKey: true,
    });

    splash.dispatchEvent(keyUp);

    expect(appStart).toHaveBeenCalledTimes(0);
    expect(appFocus).toHaveBeenCalledTimes(0);
  });

  it('does not start app twice', () => {
    window.dispatchEvent(loadEvent);

    fireEvent.click(splash);
    fireEvent.click(splash);

    expect(appStart).toHaveBeenCalledTimes(1);
    expect(appFocus).toHaveBeenCalledTimes(1);
  });
});
