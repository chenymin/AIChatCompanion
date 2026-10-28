export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ModelGenerateOptions {
  signal?: AbortSignal
}

// The agent depends on this contract, not on a particular HTTP provider.
export interface ModelClient {
  mode: 'mock' | 'live'
  generate(messages: readonly ChatMessage[], options?: ModelGenerateOptions): Promise<string>
}
