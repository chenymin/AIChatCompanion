import { CourseError } from './errors.ts'

export interface MockProviderConfig {
  mode: 'mock'
}

export interface LiveProviderConfig {
  mode: 'live'
  baseURL: string
  model: string
  apiKey: string
  timeoutMs: number
}

export type ProviderConfig = MockProviderConfig | LiveProviderConfig

function requiredValue(name: 'LLM_BASE_URL' | 'LLM_MODEL' | 'LLM_API_KEY'): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new CourseError('MISSING_PROVIDER_CONFIG', `真实模型模式需要配置 ${name}。`)
  }
  return value
}

function normalizeBaseURL(value: string): string {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new CourseError('INVALID_BASE_URL', 'LLM_BASE_URL 必须是有效的 HTTP 或 HTTPS 地址。')
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
    throw new CourseError('INVALID_BASE_URL', 'LLM_BASE_URL 必须是有效的 HTTP 或 HTTPS 地址。')
  }
  if (parsed.username || parsed.password || value.includes('?') || value.includes('#')) {
    throw new CourseError('INVALID_BASE_URL', 'LLM_BASE_URL 不能包含用户名、密码、查询参数或片段。')
  }

  const baseURL = parsed.href.replace(/\/+$/, '')
  if (parsed.pathname.replace(/\/+$/, '').endsWith('/chat/completions')) {
    throw new CourseError('INVALID_BASE_URL', 'LLM_BASE_URL 只填写服务基础地址，不要包含 /chat/completions。')
  }
  return baseURL
}

function readTimeoutMs(): number {
  const rawValue = process.env.LLM_TIMEOUT_MS?.trim() ?? '30000'
  if (!/^[0-9]+$/.test(rawValue)) {
    throw new CourseError('INVALID_TIMEOUT', 'LLM_TIMEOUT_MS 必须是 1 到 120000 之间的整数。')
  }

  const timeoutMs = Number(rawValue)
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
    throw new CourseError('INVALID_TIMEOUT', 'LLM_TIMEOUT_MS 必须是 1 到 120000 之间的整数。')
  }
  return timeoutMs
}

export function loadProviderConfig(): ProviderConfig {
  const mode = (process.env.MODEL_MODE ?? 'mock').trim()
  if (mode === 'mock') return { mode: 'mock' }
  if (mode !== 'live') {
    throw new CourseError('INVALID_MODEL_MODE', 'MODEL_MODE 只能是 mock 或 live。')
  }

  return {
    mode: 'live',
    baseURL: normalizeBaseURL(requiredValue('LLM_BASE_URL')),
    model: requiredValue('LLM_MODEL'),
    apiKey: requiredValue('LLM_API_KEY'),
    timeoutMs: readTimeoutMs(),
  }
}
