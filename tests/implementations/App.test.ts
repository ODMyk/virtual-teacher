import {App} from "../../src/interfaces/App";
import {AnswerGenerator} from "../../src/interfaces/AnswerGenerator";
import {AppConfig} from "../../src/interfaces/AppConfig";
import {Readable} from "stream";
import {OutputManager} from "../../src/interfaces/OutputManager";
import {SpeechSynthesiser} from "../../src/interfaces/SpeechSynthesiser";
import {SpeechTranscriber} from "../../src/interfaces/SpeechTranscriber";
import {VoiceSessionManager} from "../../src/interfaces/VoiceSessionManager";
import {EventEmitter} from "events";

class BasicApp implements App {
  private input: Readable;
  private outputManager: OutputManager;
  private synthesiser: SpeechSynthesiser;
  private transcriber: SpeechTranscriber;
  private voiceSessionManager: VoiceSessionManager;
  private answerGenerator: AnswerGenerator;

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
      this.voiceSessionManager.processChunk(chunk);
    });
  }

  private async transcribeAndRespond(data: Buffer) {
    const prompt = await this.transcriber.transcribe(data);
    if (prompt) {
      console.log(`User said: ${prompt}`);
      const answer = await this.answerGenerator.generateAnswer(prompt);
      console.log(`Ai answered: ${answer}`);
      const filename = await this.synthesiser.synthesise(answer);
      await this.outputManager.output(filename);
    }
  }
}

describe("App", () => {
  let mockInputCreator: jest.Mocked<AppConfig["inputCreator"]>;
  let mockOutputManager: jest.Mocked<AppConfig["outputManager"]>;
  let mockAnswerGenerator: jest.Mocked<AppConfig["answerGenerator"]>;
  let mockSynthesiser: jest.Mocked<AppConfig["synthesiser"]>;
  let mockTranscriber: jest.Mocked<AppConfig["transcriber"]>;
  let mockVoiceSessionManager: jest.Mocked<AppConfig["voiceSessionManager"]>;
  let mockReadable: EventEmitter;
  let app: App;
  let sessionEndCallback: (buffer: Buffer) => void;

  beforeEach(() => {
    mockReadable = new EventEmitter();

    mockInputCreator = {
      create: jest.fn().mockReturnValue(mockReadable),
    };
    mockOutputManager = {
      output: jest.fn().mockResolvedValue(undefined),
    };
    mockAnswerGenerator = {
      generateAnswer: jest.fn().mockResolvedValue("Це відповідь від AI"),
    };
    mockSynthesiser = {
      synthesise: jest.fn().mockResolvedValue("response.wav"),
    };
    mockTranscriber = {
      transcribe: jest
        .fn()
        .mockResolvedValue("Привіт, це тестове повідомлення"),
    };
    mockVoiceSessionManager = {
      processChunk: jest.fn().mockResolvedValue(undefined),
      onSessionEnded: jest.fn().mockImplementation((callback) => {
        sessionEndCallback = callback;
      }),
    };

    app = new BasicApp({
      inputCreator: mockInputCreator,
      outputManager: mockOutputManager,
      answerGenerator: mockAnswerGenerator,
      synthesiser: mockSynthesiser,
      transcriber: mockTranscriber,
      voiceSessionManager: mockVoiceSessionManager,
    });

    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  test("should process audio data correctly", async () => {
    app.run();

    const audioChunk = Buffer.from("тестові аудіодані");
    mockReadable.emit("data", audioChunk);

    expect(mockVoiceSessionManager.processChunk).toHaveBeenCalledWith(
      audioChunk,
    );

    const sessionData = Buffer.from("завершені аудіодані сесії");
    await sessionEndCallback(sessionData);

    expect(mockTranscriber.transcribe).toHaveBeenCalledWith(sessionData);
    expect(mockAnswerGenerator.generateAnswer).toHaveBeenCalledWith(
      "Привіт, це тестове повідомлення",
    );
    expect(mockSynthesiser.synthesise).toHaveBeenCalledWith(
      "Це відповідь від AI",
    );
    expect(mockOutputManager.output).toHaveBeenCalledWith("response.wav");

    const transcribeCallOrder =
      mockTranscriber.transcribe.mock.invocationCallOrder[0];
    const answerCallOrder =
      mockAnswerGenerator.generateAnswer.mock.invocationCallOrder[0];
    const synthesiseCallOrder =
      mockSynthesiser.synthesise.mock.invocationCallOrder[0];
    const outputCallOrder =
      mockOutputManager.output.mock.invocationCallOrder[0];

    expect(transcribeCallOrder).toBeLessThan(answerCallOrder);
    expect(answerCallOrder).toBeLessThan(synthesiseCallOrder);
    expect(synthesiseCallOrder).toBeLessThan(outputCallOrder);
  });

  test("should handle transcription exception", async () => {
    mockTranscriber.transcribe.mockRejectedValueOnce(
      new Error("Помилка розпізнавання мовлення"),
    );

    app.run();

    const sessionData = Buffer.from("аудіодані");

    await expect(sessionEndCallback(sessionData)).rejects.toThrow(
      "Помилка розпізнавання мовлення",
    );

    expect(mockAnswerGenerator.generateAnswer).not.toHaveBeenCalled();
    expect(mockSynthesiser.synthesise).not.toHaveBeenCalled();
    expect(mockOutputManager.output).not.toHaveBeenCalled();
  });

  test("should not process empty transcription", async () => {
    mockTranscriber.transcribe.mockResolvedValueOnce("");

    app.run();

    const sessionData = Buffer.from("тихі аудіодані");
    await sessionEndCallback(sessionData);

    expect(mockAnswerGenerator.generateAnswer).not.toHaveBeenCalled();
    expect(mockSynthesiser.synthesise).not.toHaveBeenCalled();
    expect(mockOutputManager.output).not.toHaveBeenCalled();
  });

  test("should process different responses for each call", async () => {
    mockAnswerGenerator.generateAnswer
      .mockResolvedValueOnce("Перша відповідь")
      .mockResolvedValueOnce("Друга відповідь")
      .mockResolvedValueOnce("Третя відповідь");

    mockSynthesiser.synthesise
      .mockResolvedValueOnce("response1.wav")
      .mockResolvedValueOnce("response2.wav")
      .mockResolvedValueOnce("response3.wav");

    app.run();

    const sessionData1 = Buffer.from("аудіодані сесії 1");
    const sessionData2 = Buffer.from("аудіодані сесії 2");
    const sessionData3 = Buffer.from("аудіодані сесії 3");

    await sessionEndCallback(sessionData1);
    await sessionEndCallback(sessionData2);
    await sessionEndCallback(sessionData3);

    expect(mockSynthesiser.synthesise).toHaveBeenNthCalledWith(
      1,
      "Перша відповідь",
    );
    expect(mockSynthesiser.synthesise).toHaveBeenNthCalledWith(
      2,
      "Друга відповідь",
    );
    expect(mockSynthesiser.synthesise).toHaveBeenNthCalledWith(
      3,
      "Третя відповідь",
    );

    expect(mockOutputManager.output).toHaveBeenNthCalledWith(
      1,
      "response1.wav",
    );
    expect(mockOutputManager.output).toHaveBeenNthCalledWith(
      2,
      "response2.wav",
    );
    expect(mockOutputManager.output).toHaveBeenNthCalledWith(
      3,
      "response3.wav",
    );

    expect(mockTranscriber.transcribe).toHaveBeenCalledTimes(3);
    expect(mockAnswerGenerator.generateAnswer).toHaveBeenCalledTimes(3);
    expect(mockSynthesiser.synthesise).toHaveBeenCalledTimes(3);
    expect(mockOutputManager.output).toHaveBeenCalledTimes(3);
  });

  test("should generate different answers based on input matching", async () => {
    mockAnswerGenerator.generateAnswer.mockImplementation((input: string) => {
      if (input.toLowerCase().includes("погода")) {
        return Promise.resolve("Сьогодні сонячно, температура 25 градусів");
      } else if (input.toLowerCase().includes("час")) {
        return Promise.resolve("Зараз 15:30");
      } else if (input.toLowerCase().includes("привіт")) {
        return Promise.resolve("Вітаю! Чим можу допомогти?");
      } else {
        return Promise.resolve("Не розумію запитання. Можете повторити?");
      }
    });

    app.run();

    mockTranscriber.transcribe
      .mockResolvedValueOnce("Яка сьогодні погода?")
      .mockResolvedValueOnce("Скільки зараз час?")
      .mockResolvedValueOnce("Привіт, як справи?")
      .mockResolvedValueOnce("Розкажи анекдот");

    await sessionEndCallback(Buffer.from("аудіо 1"));
    await sessionEndCallback(Buffer.from("аудіо 2"));
    await sessionEndCallback(Buffer.from("аудіо 3"));
    await sessionEndCallback(Buffer.from("аудіо 4"));

    expect(mockSynthesiser.synthesise).toHaveBeenNthCalledWith(
      1,
      "Сьогодні сонячно, температура 25 градусів",
    );
    expect(mockSynthesiser.synthesise).toHaveBeenNthCalledWith(
      2,
      "Зараз 15:30",
    );
    expect(mockSynthesiser.synthesise).toHaveBeenNthCalledWith(
      3,
      "Вітаю! Чим можу допомогти?",
    );
    expect(mockSynthesiser.synthesise).toHaveBeenNthCalledWith(
      4,
      "Не розумію запитання. Можете повторити?",
    );
  });
});
