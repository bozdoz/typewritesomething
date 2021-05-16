import loadScript from './loadScript';

describe('loadScript', () => {
  beforeEach(() => {
    // (re) initialize html
    while (document.body.firstChild) {
      document.body.firstChild.remove();
    }

    // script requires a script tag (always true in practice)
    const script = document.createElement('script');
    document.body.appendChild(script);
  });

  it('adds a script to the DOM', () => {
    expect(document.querySelectorAll('script')).toHaveLength(1);
    loadScript('dummy.js');
    expect(document.querySelectorAll('script')).toHaveLength(2);
  });

  it('adds script before first script', () => {
    loadScript('/dummy.js');
    expect(document.querySelectorAll('script')).toHaveLength(2);
    expect(document.querySelectorAll('script')[0].src).toBe(
      'http://localhost/dummy.js'
    );
  });

  it('has expected properties', () => {
    loadScript('/dummy.js', {
      crossOrigin: 'anonymous',
    });
    const script = document.querySelectorAll('script')[0];
    expect(script.async).toBe(true);
    expect(script.crossOrigin).toBe('anonymous');
  });
});
