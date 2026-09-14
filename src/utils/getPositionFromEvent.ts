import Vector from './Vector';

const getPositionFromEvent = (e: TouchEvent | MouseEvent): Vector => {
  if ('touches' in e) {
    const touch = e.type === 'touchend' ? e.changedTouches[0] : e.touches[0];

    return new Vector(touch.clientX, touch.clientY);
  }

  return new Vector(e.clientX, e.clientY);
};

export default getPositionFromEvent;
