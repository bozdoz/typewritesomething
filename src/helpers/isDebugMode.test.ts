describe('isDebugMode', () => {
  it('is not debug mode by default', () => {
    expect(window.location.search).toBeFalsy();

    jest.isolateModules(() => {
      const isDebugMode = require('./isDebugMode').default;
      expect(isDebugMode()).toBeFalsy();
    });
  });

  it('could be debug mode', () => {
    const windowSpy = jest.spyOn(global, 'window', 'get');
    const search = '?debug=true';

    windowSpy.mockImplementationOnce(() => {
      const mockWindow: any = {
        ...window,
        location: {
          ...window.location,
        },
      };

      Object.defineProperty(mockWindow.location, 'search', {
        get() {
          return search;
        },
      });

      return mockWindow;
    });

    jest.isolateModules(() => {
      const isDebugMode = require('./isDebugMode').default;

      expect(isDebugMode()).toBeTruthy();
    });
  });
});
