import addLongTouch from './addLongTouch';

describe('addLongTouch', () => {
  const addFn = jest.fn();
  const removeFn = jest.fn();
  const elem = document.createElement('div');
  const cb = jest.fn();

  beforeEach(() => {
    HTMLElement.prototype.addEventListener = addFn;
    HTMLElement.prototype.removeEventListener = removeFn;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('adds event listeners', () => {
    addLongTouch(elem, cb);

    expect(addFn).toHaveBeenCalledTimes(3);
    expect(removeFn).toHaveBeenCalledTimes(0);
  });

  it('can remove event listeners', () => {
    const remove = addLongTouch(elem, cb);

    remove();

    expect(addFn).toHaveBeenCalledTimes(3);
    expect(removeFn).toHaveBeenCalledTimes(3);
  });
});
