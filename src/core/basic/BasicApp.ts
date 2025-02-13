import {AnswerGenerator} from "interfaces/AnswerGenerator";
import {App} from "interfaces/App";
import {AppConfig} from "interfaces/AppConfig";
import {OutputManager} from "interfaces/OutputManager";
import {SpeechSynthesiser} from "interfaces/SpeechSynthesiser";
import {SpeechTranscriber} from "interfaces/SpeechTranscriber";
import {VoiceSessionManager} from "interfaces/VoiceSessionManager";
import {Readable, Writable} from "stream";

export class BasicApp implements App {
  private input: Readable;
  private outputManager: OutputManager;
  private synthesiser: SpeechSynthesiser;
  private transcriber: SpeechTranscriber;
  private voiceSessionManager: VoiceSessionManager;
  private answerGenerator: AnswerGenerator;
  private shouldListen = true;

  constructor(config: AppConfig) {
    this.outputManager = config.outputManager;
    this.input = config.inputCreator.create();
    this.answerGenerator = config.answerGenerator;
    this.synthesiser = config.synthesiser;
    this.transcriber = config.transcriber;
    this.voiceSessionManager = config.voiceSessionManager;
  }

  run() {
    this.voiceSessionManager.onSessionEnded((data: Buffer) =>
      this.transcribeAndRespond(data),
    );
    this.input.on("data", (chunk) => {
      this.shouldListen && this.voiceSessionManager.processChunk(chunk);
    });
  }

  private async transcribeAndRespond(data: Buffer) {
    this.shouldListen = false;
    const prompt = await this.transcriber.transcribe(data);
    const answer = await this.answerGenerator.generateAnswer(prompt);
    const filename = await this.synthesiser.synthesise(answer);
    await this.outputManager.output(filename);
    this.shouldListen = true;
  }
}
