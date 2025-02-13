export interface VoiceSessionManager {
  processChunk(chunk: Buffer): Promise<void>;
  onSessionEnded(callback: (session: Buffer) => void): void;
}
