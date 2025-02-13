import {Readable} from "stream";

export interface InputStreamCreator {
  create(): Readable;
}
