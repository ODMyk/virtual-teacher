import {exec, spawn} from "child_process";
import {unlink} from "fs";
import {SpeechTranscriber} from "interfaces/SpeechTranscriber";
import {promisify} from "util";

const unlinkAsync = promisify(unlink);

export class WhisperCppTranscriber implements SpeechTranscriber {
  private static readonly TEMPORARY_FILE_PATH = "./tmp/userVoice.wav";
  private static readonly TRIM_STRINGS = [
    "[BLANK_AUDIO]",
    "[SILENCE]",
    "[ SILENCE ]",
  ];

  async transcribe(buffer: Buffer): Promise<string> {
    try {
      const ffmpeg = spawn("ffmpeg", [
        "-f",
        "s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        "-i",
        "pipe:0",
        "-f",
        "wav",
        WhisperCppTranscriber.TEMPORARY_FILE_PATH,
      ]);

      ffmpeg.stdin.write(buffer);
      ffmpeg.stdin.end();

      await new Promise<void>((resolve, reject) => {
        ffmpeg.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`FFmpeg process exited with code ${code}`));
          }
        });
      });

      const stdout = await this.runWhisperCli();

      await unlinkAsync(WhisperCppTranscriber.TEMPORARY_FILE_PATH);

      return stdout
        .trim()
        .split("\n")
        .map((s) => {
          const cleanedLine = s
            .replace(/\[\d+:\d+:\d+\.\d+ --> \d+:\d+:\d+\.\d+\] /g, "")
            .trim();

          return WhisperCppTranscriber.TRIM_STRINGS.includes(
            cleanedLine.toLocaleUpperCase(),
          )
            ? ""
            : cleanedLine;
        })
        .filter((s) => s.length > 0) // Filter out empty strings
        .join(" ");
    } catch (error) {
      console.error("Error during transcription:", error);
      throw error;
    }
  }

  private runWhisperCli(): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(
        `whisper.cpp/build/bin/whisper-cli -m whisper.cpp/models/ggml-base.bin -f ${WhisperCppTranscriber.TEMPORARY_FILE_PATH}`,
        (error, stdout) => {
          if (error) {
            return reject(new Error(error?.message));
          }
          resolve(stdout);
        },
      );
    });
  }
}
