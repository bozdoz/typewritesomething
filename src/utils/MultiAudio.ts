import { Howl } from "howler";

interface MultiAudio {
  play(): void;
}

/**
 * A single audio can only play once; this creates multiple instances
 * and rotates playing them.
 *
 * @param {string} src source of audio file
 * @param {number} instances number of simultaneous instances of this sound
 */
const MultiAudio = function multiAudio(
  this: MultiAudio,
  src: string,
  instances = 5,
) {
  const output: Howl[] = [];

  for (let i = 0; i < instances; i += 1) {
    output.push(new Howl({ src }));
  }

  let current = 0;

  this.play = function play() {
    const audio = output[(current += 1) % instances];
    audio.play();
  };
  // deno-lint-ignore no-explicit-any
} as any as { new (src: string, instances: number): MultiAudio };

export default MultiAudio;
