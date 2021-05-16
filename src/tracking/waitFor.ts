/** Wait for a condition to be true */
const waitFor = (cb: (...args: any[]) => boolean): Promise<void> =>
  new Promise((resolve, reject) => {
    let tries = 10;
    const retry = () => {
      const ready = cb();

      if (ready) {
        resolve();

        return;
      }

      tries -= 1;

      if (tries === 0) {
        reject();
      } else {
        setTimeout(retry, 150);
      }
    };

    retry();
  });

export default waitFor;
