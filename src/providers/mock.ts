import { CourseError } from '../errors.ts'

export async function generateMockReply(userText: string): Promise<string> {
  if (process.env.MOCK_FAULT === 'error') {
    throw new CourseError('MOCK_FAILURE', '这是主动注入的模拟故障；清除 MOCK_FAULT 后重试。')
  }

  // Fixed behavior makes debugging reproducible. This is not a model inference.
  const response = userText.includes('降温')
    ? '一下子冷下来确实很明显，今天出门时感觉怎么样？'
    : `收到你的输入：${userText}`

  return `【模拟回复·第 1 轮】${response}`
}
