import {AnswerGenerator} from "./AnswerGenerator";
import {InputStreamCreator} from "./InputStreamCreator";
import {OutputManager} from "./OutputManager";
import {SpeechSynthesiser} from "./SpeechSynthesiser";
import {SpeechTranscriber} from "./SpeechTranscriber";
import {VoiceSessionManager} from "./VoiceSessionManager";

export interface AppConfig {
  inputCreator: InputStreamCreator;
  outputManager: OutputManager;
  synthesiser: SpeechSynthesiser;
  transcriber: SpeechTranscriber;
  voiceSessionManager: VoiceSessionManager;
  answerGenerator: AnswerGenerator;
}
