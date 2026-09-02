import * as fs from 'fs';
import * as path from 'path';

describe('index.html', () => {
  it('defers the main script until the document has been parsed', () => {
    document.documentElement.innerHTML = fs.readFileSync(
      path.resolve(__dirname, '../index.html'),
      'utf8'
    );

    const mainScript = document.querySelector(
      'script[src="/dist/main.js"]'
    ) as HTMLScriptElement;

    expect(mainScript).not.toBeNull();
    expect(mainScript.defer).toBe(true);
    expect(mainScript.hasAttribute('async')).toBe(false);
    expect(document.getElementById('container')).not.toBeNull();
  });
});
