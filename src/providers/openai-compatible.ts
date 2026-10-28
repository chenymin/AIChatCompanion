import type { LiveProviderConfig } from '../config.ts'
import { CourseError } from '../errors.ts'
import type { ChatMessage, ModelClient, ModelGenerateOptions } from '../model.ts'

function invalidResponse(): CourseError {
  return new CourseError('INVALID_MODEL_RESPONSE', '模型响应没有可用的正文，请检查模型与 Chat Completions 协议是否兼容。')
}

function extractReply(payload: unknown): string {
  if (!payload || typeof payload !== 'object') throw invalidResponse()
  const choices = (payload as { choices?: unknown }).choices
  if (!Array.isArray(choices)) throw invalidResponse()

  const firstChoice: unknown = choices[0]
  if (!firstChoice || typeof firstChoice !== 'object') throw invalidResponse()
  const message = (firstChoice as { message?: unknown }).message
  if (!message || typeof message !== 'object') throw invalidResponse()

  // Provider reasoning fields are never treated as learner-visible answer text.
  const content = (message as { content?: unknown }).content
  if (typeof content !== 'string' || !content.trim()) throw invalidResponse()
  return content.trim()
}

export function createOpenAICompatibleModelClient(config: LiveProviderConfig): ModelClient {
  return {
    mode: 'live',
    async generate(messages: readonly ChatMessage[], options?: ModelGenerateOptions): Promise<string> {
      const timeoutSignal = AbortSignal.timeout(config.timeoutMs)
      const signal = options?.signal
        ? AbortSignal.any([timeoutSignal, options.signal])
        : timeoutSignal

      try {
        const response = await fetch(config.baseURL + '/chat/completions', {
          method: 'POST',
          redirect: 'error',
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ model: config.model, messages, stream: false }),
          signal,
        })

        if (!response.ok) {
          // Do not read or print the upstream error body: it can contain sensitive data.
          await response.body?.cancel().catch(() => undefined)
          throw new CourseError('MODEL_HTTP_ERROR', `模型服务返回 HTTP ${response.status}，请检查接入配置或稍后重试。`)
        }

        let payload: unknown
        try {
          // The fetch signal also cancels response body consumption after headers arrive.
          payload = await response.json()
        } catch {
          if (signal.aborted) throw new CourseError('MODEL_ABORTED', '本次模型请求已中止。')
          throw invalidResponse()
        }
        return extractReply(payload)
      } catch (error) {
        if (options?.signal?.aborted) {
          throw new CourseError('MODEL_CANCELLED', '本次模型请求已取消。')
        }
        if (timeoutSignal.aborted) {
          throw new CourseError('MODEL_TIMEOUT', '模型请求超时，请稍后重试或调整 LLM_TIMEOUT_MS。')
        }
        if (error instanceof CourseError) throw error
        // Raw network errors and causes may contain URLs or transport details.
        throw new CourseError('MODEL_NETWORK_ERROR', '无法连接模型服务，请检查网络和接入配置。')
      }
    },
  }
}
