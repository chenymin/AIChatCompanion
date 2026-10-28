import { loadProviderConfig } from '../config.ts'
import type { ModelClient } from '../model.ts'
import { createMockModelClient } from './mock.ts'
import { createOpenAICompatibleModelClient } from './openai-compatible.ts'

export function createModelClient(): ModelClient {
  const config = loadProviderConfig()
  return config.mode === 'mock'
    ? createMockModelClient()
    : createOpenAICompatibleModelClient(config)
}
