/**
 * mapping for soundless keys
 * Don't ever allow Android's ridiculous 229 code
 */
const NO_AUDIO: Record<number, string> & Partial<Record<229, never>> = {
  0: 'PRTSCR',
  8: 'BACKSPACE',
  9: 'TAB',
  16: 'SHIFT',
  17: 'CTRL',
  18: 'ALT',
  20: 'CAPSLOCK',
  27: 'ESC',
  32: 'SPACE',
  33: 'PGUP',
  34: 'PGDN',
  35: 'END',
  36: 'HOME',
  37: 'LEFT',
  38: 'UP',
  39: 'RIGHT',
  40: 'DOWN',
  45: 'INSERT',
  46: 'DEL',
  91: 'WIN',
  92: 'WIN',
  112: 'F1',
  113: 'F2',
  114: 'F3',
  115: 'F4',
  116: 'F5',
  117: 'F6',
  118: 'F7',
  119: 'F8',
  120: 'F9',
  121: 'F10',
  122: 'F11',
  123: 'F12',
  144: 'NUMLOCK',
  145: 'SCROLLLOCK',
  224: 'CMD',
};

export default NO_AUDIO;
