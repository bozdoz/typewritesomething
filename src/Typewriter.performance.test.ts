import { TypeWriter } from './Typewriter';
import { textCtx } from './helpers/getElements';
import Vector from './utils/Vector';

jest.mock('./helpers/getElements');

jest.useFakeTimers();

describe('Typewriter rendering performance', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('imports a document with one final scene render', () => {
    const typewriter = new TypeWriter();
    const render = jest.spyOn(typewriter, 'render');
    const fillText = jest.spyOn(textCtx, 'fillText');
    const size = 2000;
    const characters = Array.from({ length: size }, (_, index) => ({
      s: 'A',
      x: index * 15,
      y: 100,
    }));

    typewriter.import(JSON.stringify(characters));

    expect(render).toHaveBeenCalledTimes(1);
    expect(fillText).toHaveBeenCalledTimes(size);
    expect(typewriter.chars).toHaveLength(size);
    expect(typewriter.cursor.position).toEqual({
      x: characters[size - 1].x,
      y: characters[size - 1].y,
    });

    render.mockRestore();
    fillText.mockRestore();
  });

  it('draws appended text incrementally without a full scene render', () => {
    const typewriter = new TypeWriter();
    const render = jest.spyOn(typewriter, 'render');
    const fillText = jest.spyOn(textCtx, 'fillText');

    typewriter.addCharacter('ABC');

    expect(render).not.toHaveBeenCalled();
    expect(fillText).toHaveBeenCalledTimes(3);

    render.mockRestore();
    fillText.mockRestore();
  });

  it('coalesces viewport updates until the scheduled frame', () => {
    const typewriter = new TypeWriter();
    const render = jest.spyOn(typewriter, 'render');

    typewriter.zoomAt(new Vector(10, 10), 1.1);
    typewriter.zoomAt(new Vector(20, 20), 1.1);
    typewriter.panBy(new Vector(5, 5));

    expect(render).not.toHaveBeenCalled();
    expect(typewriter._renderFrame).toEqual(expect.any(Number));

    jest.advanceTimersByTime(20);

    expect(render).toHaveBeenCalledTimes(1);
    expect(typewriter._renderFrame).toBeUndefined();

    render.mockRestore();
  });
});
