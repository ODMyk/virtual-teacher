import {Writable} from "stream";

export interface SpeechSynthesiser {
  synthesise(text: string): Promise<string>;
}
