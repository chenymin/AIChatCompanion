import type { ChatMessage } from './model.ts'

// Twenty completed role messages = at most ten successful user/assistant pairs.
// The system instruction and current input are added separately when requesting.
export const HISTORY_WINDOW = 20

export class Conversation {
  #messages: ChatMessage[] = []

  get messageCount(): number {
    return this.#messages.length
  }

  history(): ChatMessage[] {
    return this.#messages.map((message) => ({ ...message }))
  }

  prepareTurn(userText: string): ChatMessage[] {
    // Preparing a request never modifies committed state.
    return [...this.history(), { role: 'user', content: userText }]
  }

  commitTurn(userText: string, reply: string): void {
    const completed: ChatMessage[] = [
      ...this.#messages,
      { role: 'user', content: userText },
      { role: 'assistant', content: reply },
    ]
    this.#messages = completed.slice(-HISTORY_WINDOW)
  }

  reset(): void {
    this.#messages = []
  }
}
