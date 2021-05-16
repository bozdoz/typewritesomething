import waitFor from './waitFor';

describe('waitFor', () => {
  const check = jest.fn();
  const error = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  it('does not wait when immediately true', (done) => {
    check.mockImplementationOnce(() => true);

    waitFor(check).then(done).catch(error);

    expect(check).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
    expect(error).not.toHaveBeenCalled();
  });

  it('waits if not yet true', (done) => {
    waitFor(check).then(done).catch(error);

    expect(check).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 150);

    check.mockImplementationOnce(() => true);

    jest.runOnlyPendingTimers();

    expect(check).toHaveBeenCalledTimes(2);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
  });

  it('times out after 10 tries, or 1500ms by default', (done) => {
    waitFor(check).catch(done);

    jest.advanceTimersByTime(1500);

    expect(check).toHaveBeenCalledTimes(10);
    expect(setTimeout).toHaveBeenCalledTimes(9);
  });
});
