// @deno-types=npm:@types/jest
import { fireEvent } from "@testing-library/dom";

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

jest.mock("./App", () => ({
  default: mockApp,
}));

describe("index", () => {
  let splash: HTMLDivElement;
  const loadEvent = new Event("load");

  beforeEach(() => {
    jest.clearAllMocks();
    // make sure require('./index') fires again
    jest.resetModules();

    splash = document.createElement("div");
    splash.id = "splash";
    splash.tabIndex = 0;

    // (re) initialize html
    while (document.body.firstChild) {
      document.body.firstChild.remove();
    }
    document.body.append(splash);

    // add js
    import("./index.ts");
  });

  it("gives focus to splash on load", () => {
    expect(document.activeElement).toBe(document.body);
    globalThis.dispatchEvent(loadEvent);
    expect(document.activeElement).toBe(splash);
  });

  it("wipes location hash on load", () => {
    const windowSpy = jest.spyOn(globalThis, "window", "get");
    let hash = "";

    windowSpy.mockImplementationOnce(() => {
      // deno-lint-ignore no-explicit-any
      const mockWindow: any = {
        ...window,
        location: {
          ...globalThis.location,
        },
      };

      Object.defineProperty(mockWindow.location, "hash", {
        get() {
          return hash;
        },
        set(newValue) {
          hash = newValue;
        },
      });
      return mockWindow;
    });

    globalThis.location.hash = "asdf";

    globalThis.dispatchEvent(loadEvent);

    expect(globalThis.location.hash).toBe("");
  });

  it("starts app after keyup on splash", () => {
    globalThis.dispatchEvent(loadEvent);

    fireEvent.keyUp(splash);

    expect(appStart).toHaveBeenCalledTimes(1);
    expect(appFocus).toHaveBeenCalledTimes(1);
  });

  it("starts app after click on splash", () => {
    globalThis.dispatchEvent(loadEvent);

    fireEvent.click(splash);

    expect(appStart).toHaveBeenCalledTimes(1);
    expect(appFocus).toHaveBeenCalledTimes(1);
  });

  it("hides the splash after click", () => {
    globalThis.dispatchEvent(loadEvent);

    fireEvent.click(splash);

    expect(splash.classList.contains("hide")).toBe(true);
  });

  it("does not start app if ctrl key pressed", () => {
    globalThis.dispatchEvent(loadEvent);

    const keyUp = new KeyboardEvent("keyup", {
      ctrlKey: true,
    });

    splash.dispatchEvent(keyUp);

    expect(appStart).toHaveBeenCalledTimes(0);
    expect(appFocus).toHaveBeenCalledTimes(0);
  });

  it("does not start app twice", () => {
    globalThis.dispatchEvent(loadEvent);

    fireEvent.click(splash);
    fireEvent.click(splash);

    expect(appStart).toHaveBeenCalledTimes(1);
    expect(appFocus).toHaveBeenCalledTimes(1);
  });
});
