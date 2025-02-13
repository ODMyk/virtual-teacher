import {AnswerGenerator} from "interfaces/AnswerGenerator";

export class EchoAnswer implements AnswerGenerator {
  async generateAnswer(text: string) {
    return text;
  }
}
