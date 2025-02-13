export interface SpeechTranscriber {
  transcribe(buffer: Buffer): Promise<string>;
}
