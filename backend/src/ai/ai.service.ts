const MODEL = '@cf/meta/llama-3.1-8b-instruct';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export class AIService {
  constructor(private ai: Ai) {}

  async chat(messages: Message[]) {
    const response = await this.ai.run(MODEL, { messages });
    return response;
  }

  async completion(prompt: string) {
    const response = await this.ai.run(MODEL, {
      messages: [{ role: 'user', content: prompt }],
    });
    return response;
  }
}
