import {AppConfig} from "interfaces/AppConfig";
import {BasicApp} from "./BasicApp";
import {App} from "interfaces/App";
import {BlackHoleInputCreator} from "implementations/input/BlackHoleInputCreator";
import {BlackHoleOutputManager} from "implementations/output/BlackHoleOutputManager";
import {MacOsSaySynthesiser} from "implementations/synthesiser/MacOsSaySynthesiser";
import {WhisperCppTranscriber} from "implementations/transcriber/WhisperCppTranscriber";
import {NodeVadSessionManager} from "implementations/voiceSessionManager/NodeVadSessionManager";
import {LocalOllamaModel} from "implementations/answerGenerator/LocalOllamaModel";

export abstract class BasicAppFactory {
  static create(): App {
    const config: AppConfig = {
      answerGenerator: new LocalOllamaModel(),
      inputCreator: new BlackHoleInputCreator(),
      outputManager: new BlackHoleOutputManager(),
      synthesiser: new MacOsSaySynthesiser(),
      transcriber: new WhisperCppTranscriber(),
      voiceSessionManager: new NodeVadSessionManager(),
    };
    return new BasicApp(config);
  }
}
