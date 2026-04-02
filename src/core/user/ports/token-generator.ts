export interface TokenGenerator {
  generate(payload: Record<string, unknown>): string;
}
