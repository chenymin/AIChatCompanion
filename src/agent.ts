import { generateMockReply } from './providers/mock.ts'
import { CourseError, safeError } from './errors.ts'
import { createTrace } from './trace.ts'

export async function runTurn(input: string): Promise<string> {
  const trace = createTrace()

  try {
    trace.event('input.received', { inputLength: input.length })
    const userText = input.trim()

    if (!userText) {
      throw new CourseError('EMPTY_INPUT', '请输入非空文字。')
    }

    trace.event('input.normalized', { inputLength: userText.length })
    trace.modelCall()
    trace.event('model.started', { mode: 'mock' })
    const reply = await generateMockReply(userText)
    trace.event('model.completed', { outputLength: reply.length })
    trace.event('turn.completed', { saved: false })
    return reply
  } catch (error) {
    trace.event('turn.failed', { errorCode: safeError(error).code, saved: false })
    throw error
  }
}
