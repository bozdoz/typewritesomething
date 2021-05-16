import { cursorCanvas } from './helpers/getElements';
import Menu from './Menu';
import Vector from './utils/Vector';

jest.mock('./helpers/getElements');

jest.mock('./utils/getPositionFromEvent', () => ({
  default: jest.fn(
    (e: CustomEvent) => new Vector(e.detail.pageX, e.detail.pageY)
  ),
}));

describe('Menu', () => {
  // from Menu.ts
  const positionBuffer = 5;
  let menu: Menu;

  beforeEach(() => {
    jest.spyOn(Menu.prototype, 'events');
    jest.spyOn(Menu.prototype, 'openMenu');

    menu = new Menu();
  });

  afterEach(() => {
    menu.destroy();
  });

  it('can initialize', () => {
    expect(menu).toBeTruthy();
  });

  it('adds event listeners', () => {
    expect(menu.events).toHaveBeenCalledWith('on');
  });

  it('destroys events', () => {
    menu.destroy();
    expect(menu.events).toHaveBeenCalledWith('off');
  });

  it('destroys elements', () => {
    menu.destroy();
    expect(menu.menuBackdrop.parentNode).toBeNull();
  });

  it('creates menu elements', () => {
    expect(menu.menu).toBeTruthy();
    expect(menu.menu?.parentNode).toBe(menu.menuBackdrop);
    expect(menu.menuBackdrop?.parentNode).toBeNull();
  });

  it('can add menu items', () => {
    menu.addMenuItem('text');

    expect(menu.menu?.children).toHaveLength(1);

    expect((menu.menu?.children[0] as HTMLElement).innerHTML).toBe('text');
  });

  it('can add html entities as titles', () => {
    menu.addMenuItem('&nbsp; text');

    expect(menu.menu?.children).toHaveLength(1);

    expect((menu.menu?.children[0] as HTMLElement).innerHTML).toBe(
      '&nbsp; text'
    );
    expect((menu.menu?.children[0] as HTMLElement).textContent).toBe('  text');
  });

  it('can add clickable menu items', () => {
    const onClick = jest.fn();

    menu.addMenuItem('text', { callback: onClick });

    (menu.menu?.children[0] as HTMLElement).click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('opens menu on contextmenu', () => {
    const rightClick = new CustomEvent('contextmenu', {
      detail: {
        pageX: 10,
        pageY: 10,
      },
    });

    expect(menu.openMenu).not.toHaveBeenCalled();

    cursorCanvas.dispatchEvent(rightClick);

    expect(menu.openMenu).toHaveBeenCalledTimes(1);
    expect(menu.openMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 10 + positionBuffer,
        y: 10 + positionBuffer,
      })
    );
    expect(window.gtag).toHaveBeenCalled();
  });

  it('should have focus after opening', () => {
    expect(document.activeElement).toBe(document.body);

    menu.openMenu({
      x: 0,
      y: 0,
    });

    expect(document.activeElement).toBe(menu.menu);
  });
});
