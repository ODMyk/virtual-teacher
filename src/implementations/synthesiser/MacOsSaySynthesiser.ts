import {exec} from "child_process";
import {unlink, writeFile} from "fs";
import {SpeechSynthesiser} from "interfaces/SpeechSynthesiser";
import {promisify} from "util";

const unlinkAsync = promisify(unlink);
const writeFileAsync = promisify(writeFile);

export class MacOsSaySynthesiser implements SpeechSynthesiser {
  private static readonly TEMPORARY_FILE_PATH_TXT = "./tmp/aiVoice.txt";
  private static readonly TEMPORARY_FILE_PATH_AIFF = "./tmp/aiVoice.aiff";
  private static readonly TEMPORARY_FILE_PATH_WAV = "./tmp/aiVoice.wav";

  async synthesise(text: string): Promise<string> {
    return new Promise(async (res, rej) => {
      try {
        // Write the text to a temporary file
        await writeFileAsync(
          MacOsSaySynthesiser.TEMPORARY_FILE_PATH_TXT,
          text,
          "utf-8",
        );

        await this.runSayCommand();

        const ffmpegProcess = this.convertAiffToWav();

        ffmpegProcess.on("close", async (code) => {
          if (code !== 0) {
            console.error("FFmpeg process failed with exit code", code);
          }

          unlinkAsync(MacOsSaySynthesiser.TEMPORARY_FILE_PATH_AIFF);
          res(MacOsSaySynthesiser.TEMPORARY_FILE_PATH_WAV);
        });
      } catch (error) {
        console.error("Error during synthesis:", error);
        rej(error);
      }
    });
  }

  private runSayCommand(): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(
        `say -o ${MacOsSaySynthesiser.TEMPORARY_FILE_PATH_AIFF} -v Alex -f '${MacOsSaySynthesiser.TEMPORARY_FILE_PATH_TXT}'`,
        (error) => {
          if (error) {
            reject(new Error(`Error generating audio: ${error.message}`));
          } else {
            unlinkAsync(MacOsSaySynthesiser.TEMPORARY_FILE_PATH_TXT);
            resolve();
          }
        },
      );
    });
  }

  private convertAiffToWav() {
    const ffmpegProcess = exec(
      `ffmpeg -i ${MacOsSaySynthesiser.TEMPORARY_FILE_PATH_AIFF} ${MacOsSaySynthesiser.TEMPORARY_FILE_PATH_WAV}`,
    );

    ffmpegProcess.on("error", (error) => {
      console.error("Error running ffmpeg:", error);
    });

    return ffmpegProcess;
  }
}
