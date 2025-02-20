import axios from "axios";
import {AnswerGenerator} from "interfaces/AnswerGenerator";

export class LocalOllamaModel implements AnswerGenerator {
  private static readonly OLLAMA_URL = "http://localhost:11434/api/generate";
  private static readonly OLLAMA_MODEL = "smollm";
  private static readonly ON_FAILURE_MESSAGE =
    "Sorry, I can't process your message right now";

  async generateAnswer(text: string) {
    try {
      const response = await axios.post(LocalOllamaModel.OLLAMA_URL, {
        model: LocalOllamaModel.OLLAMA_MODEL,
        prompt: text,
        stream: false,
        num_predict: 100,
        system:
          "You are being used for speech synthesis. Respond conversationally with natural speech, avoiding any markup or formatting.",
        temperature: 0.3,
      });

      return (
        (response?.data?.response as string) ||
        LocalOllamaModel.ON_FAILURE_MESSAGE
      );
    } catch (error) {
      console.error(`Error during ollama prompt: ${error}`);
      return LocalOllamaModel.ON_FAILURE_MESSAGE;
    }
  }
}
