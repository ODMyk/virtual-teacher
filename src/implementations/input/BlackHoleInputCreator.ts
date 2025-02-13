import {spawn} from "child_process";
import {InputStreamCreator} from "interfaces/InputStreamCreator";
import {Readable} from "stream";

export class BlackHoleInputCreator implements InputStreamCreator {
  create(): Readable {
    const ffmpeg = spawn("ffmpeg", [
      "-f",
      "avfoundation",
      "-i",
      ":BlackHole 16ch",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-acodec",
      "pcm_s16le",
      "-f",
      "s16le",
      "pipe:1",
      "-hide_banner",
      "-loglevel",
      "quiet",
    ]);

    return ffmpeg.stdout;
  }
}
