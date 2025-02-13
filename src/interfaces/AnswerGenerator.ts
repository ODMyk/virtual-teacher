export interface AnswerGenerator {
  generateAnswer(text: string): Promise<string>;
}
