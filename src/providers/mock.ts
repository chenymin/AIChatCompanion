import { CourseError } from '../errors.ts'
import type { ChatMessage, ModelClient, ModelGenerateOptions } from '../model.ts'

async function generate(messages: readonly ChatMessage[], options?: ModelGenerateOptions): Promise<string> {
  if (options?.signal?.aborted) {
    throw new CourseError('MODEL_CANCELLED', '本次模型请求已取消。')
  }
  if (process.env.MOCK_FAULT === 'error') {
    throw new CourseError('MOCK_FAILURE', '这是主动注入的模拟故障；清除 MOCK_FAULT 后重试。')
  }

  const userMessages = messages.filter((message) => message.role === 'user')
  const userText = userMessages.at(-1)?.content
  if (!userText?.trim()) {
    throw new CourseError('EMPTY_INPUT', '请输入非空文字。')
  }

  // Fixed behavior makes debugging reproducible. This is not a model inference.
  const response = userText.includes('降温')
    ? '一下子冷下来确实很明显，今天出门时感觉怎么样？'
    : `收到你的输入：${userText}`

  // This counter describes only the visible message window, not a persisted session.
  return `【模拟回复·第 ${userMessages.length} 轮】${response}`
}

export function createMockModelClient(): ModelClient {
  return { mode: 'mock', generate }
}

