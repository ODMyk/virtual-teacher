declare module "node-vad" {
  export enum Event {
    ERROR = -1,
    NOISE = 0,
    SILENCE = 1,
    VOICE = 2,
  }

  export enum Mode {
    NORMAL = 0,
    LOW_BITRATE = 1,
    AGGRESSIVE = 2,
    VERY_AGGRESSIVE = 3,
  }

  export interface VADOptions {
    mode?: Mode;
    audioFrequency?: number;
    debounceTime?: number;
  }

  /**
   * Voice Activity Detection class
   */
  export default class VAD {
    /**
     * Create a new Voice Activity Detection instance
     * @param options Configuration options for VAD
     */
    constructor(mode: Mode);

    /**
     * Process a chunk of audio data
     * @param audioData Int16Array or Float32Array of audio samples
     * @returns Promise that resolves to a VAD Event
     */
    processAudio(audioData: ArrayBufferLike, rate?: number): Promise<Event>;

    /**
     * Stop the VAD instance and free resources
     */
    stop(): void;
  }
}
