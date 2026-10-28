import { createModelClient } from './providers/index.ts'
import type { ChatMessage } from './model.ts'
import { CourseError, safeError } from './errors.ts'
import { createTrace } from './trace.ts'

export async function runTurn(input: string, options: { signal?: AbortSignal } = {}): Promise<string> {
  const trace = createTrace()

  try {
    trace.event('input.received', { inputLength: input.length })
    const userText = input.trim()

    if (!userText) {
      throw new CourseError('EMPTY_INPUT', '请输入非空文字。')
    }

    trace.event('input.normalized', { inputLength: userText.length })
    const model = createModelClient()
    const messages: ChatMessage[] = [
      { role: 'system', content: '你是友善的中文聊天助手。简短、自然地回应用户，只输出面向用户的回答。' },
      { role: 'user', content: userText },
    ]
    trace.event('provider.selected', { mode: model.mode, requestMessageCount: messages.length })
    if (options.signal?.aborted) throw new CourseError('REQUEST_CANCELLED', '本轮请求已取消。')
    trace.modelCall()
    trace.event('model.started', { mode: model.mode })
    const reply = await model.generate(messages, { signal: options.signal })
    if (options.signal?.aborted) throw new CourseError('REQUEST_CANCELLED', '本轮请求已取消。')
    trace.event('model.completed', { outputLength: reply.length })
    trace.event('turn.completed', { saved: false })
    return reply
  } catch (error) {
    trace.event('turn.failed', { errorCode: safeError(error).code, saved: false })
    throw error
  }
}
