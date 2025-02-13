import {VoiceSessionManager} from "interfaces/VoiceSessionManager";
import VAD, {Event, Mode} from "node-vad";

export class NodeVadSessionManager implements VoiceSessionManager {
  private readonly threshold = 2500;
  private lastVoiceTimestamp: number;
  private sessionData: Buffer[] = [];
  private readonly vad = new VAD(Mode.AGGRESSIVE);
  private onSessionEndCallback?: (session: Buffer) => void;
  private isSessionActive = false;

  async processChunk(chunk: Buffer) {
    const vadResult = await this.vad.processAudio(chunk as any, 16000);
    const now = Date.now();
    if (this.isSessionActive) {
      this.sessionData.push(chunk);
    }
    if (vadResult === Event.VOICE) {
      this.startSession();
      this.lastVoiceTimestamp = now;
    } else if (
      this.isSessionActive &&
      vadResult === Event.SILENCE &&
      now - this.lastVoiceTimestamp > this.threshold
    ) {
      this.endSession();
    }
  }

  onSessionEnded(callback: (session: Buffer) => void): void {
    this.onSessionEndCallback = callback;
  }

  private startSession() {
    this.isSessionActive = true;
  }

  private endSession() {
    this.isSessionActive = false;
    if (this.sessionData && this.onSessionEndCallback) {
      this.onSessionEndCallback(Buffer.concat(this.sessionData));
    }
    this.sessionData.length = 0;
  }
}
