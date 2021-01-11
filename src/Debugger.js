const colors = ['red', 'green', 'blue', 'orange', 'brown', 'purple', 'black'];

const positions = {
  topleft: 0,
  bottomleft: 0,
  bottomright: 0,
  topright: 0,
};

class Debugger {
  _formatter = (message) => message;

  constructor({ position = 'topleft' } = {}) {
    const div = document.createElement('div');

    this.elem = div;

    div.style.position = 'absolute';

    if (position.startsWith('top')) {
      div.style.top = `${positions[position]}em`;
    } else {
      div.style.bottom = `${positions[position]}em`;
    }

    if (position.endsWith('left')) {
      div.style.left = '0';
    } else {
      div.style.right = '0';
    }

    div.style.color = colors[positions[position]];

    document.body.appendChild(div);

    positions[position] += 1;
  }

  log(message) {
    this.elem.innerText = this._formatter(message);
  }

  formatter(func) {
    this._formatter = func;
  }
}

export default Debugger;
