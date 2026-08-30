import { fireEvent } from "@testing-library/dom";
import App from "./App";
import { textInput } from "./helpers/getElements";

jest.mock("./helpers/getElements");

jest.useFakeTimers();

const mockPlay = jest.fn();
globalThis.Audio.prototype.play = mockPlay;

/**
 * Simulate keydown event
 */
function getEvent(char: string) {
  return {
    key: char,
    which: char.toLowerCase().charCodeAt(0) - 32,
  };
}

describe("Character", () => {
  let app: App;

  beforeEach(() => {
    app = new App();

    jest.resetAllMocks();
    jest.spyOn(app, "handleKeyUp");
    jest.spyOn(app, "handleKeyDown");
    jest.spyOn(app, "events");
  });

  it("has a typewriter instance", () => {
    expect(app.typewriter).toBeTruthy();
  });

  it("calls audio on keydown", () => {
    app.start();

    expect(app.events).toHaveBeenCalled();

    fireEvent.keyDown(textInput, getEvent("d"));

    expect(app.handleKeyDown).toHaveBeenCalled();
    expect(mockPlay).toHaveBeenCalled();
  });

  it("calls audio on keydown, once per letter", () => {
    app.start();

    fireEvent.keyDown(textInput, getEvent("d"));
    fireEvent.keyDown(textInput, getEvent("d"));

    expect(app.handleKeyDown).toHaveBeenCalledTimes(2);
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it("resets audio on keydown, after keyup on the same letter", () => {
    app.start();

    fireEvent.keyDown(textInput, getEvent("d"));
    fireEvent.keyUp(textInput, getEvent("d"));
    fireEvent.keyDown(textInput, getEvent("d"));

    expect(app.handleKeyUp).toHaveBeenCalledTimes(1);
    expect(app.handleKeyDown).toHaveBeenCalledTimes(2);
    expect(mockPlay).toHaveBeenCalledTimes(2);
  });
});
