export interface OutputManager {
  output(filename: string): Promise<void>;
}
