import {spawn} from "child_process";
import {unlink} from "fs";
import {OutputManager} from "interfaces/OutputManager";
import {promisify} from "util";

const unlinkAsync = promisify(unlink);

export class BlackHoleOutputManager implements OutputManager {
  private static readonly DEVICE_NAME = "BlackHole 16ch";

  async output(filename: string): Promise<void> {
    return new Promise((res, rej) => {
      const sox = spawn("sox", [
        "--no-show-progress",
        "-t",
        "wav",
        filename,
        "-t",
        "coreaudio",
        BlackHoleOutputManager.DEVICE_NAME,
      ]);

      sox.stdout.on("data", () => {
        console.log("Data is being streamed into pipe");
      });

      sox.on("error", (error) => {
        console.error("SoX error:", error);
        rej();
      });

      sox.on("close", () => {
        unlinkAsync(filename);
        setTimeout(res, 200);
      });
    });
  }
}
