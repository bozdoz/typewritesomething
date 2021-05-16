import loadScript from './loadScript';

jest.mock('./loadScript', () => ({
  default: jest.fn(),
}));

const { NODE_ENV } = process.env;

describe('sentry', () => {
  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV;
  });

  describe('development', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';

      jest.isolateModules(() => {
        require('./sentry');
      });
    });

    it('works without loading anything', () => {
      expect(window.sentry).toBeDefined();

      expect(() => {
        window.sentry.captureMessage('howdy');
      }).not.toThrow();
    });

    it('does not call loadScript', () => {
      expect(loadScript).not.toHaveBeenCalled();
    });
  });

  describe('production', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';

      jest.isolateModules(() => {
        require('./sentry');
      });
    });

    it('works in production without loading anything', () => {
      expect(window.sentry).toBeDefined();

      expect(() => {
        window.sentry.captureMessage('howdy');
      }).not.toThrow();
    });

    it('does call loadScript', () => {
      expect(loadScript).toHaveBeenCalled();
    });
  });
});
