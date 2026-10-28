import { randomUUID } from 'node:crypto'
import { performance } from 'node:perf_hooks'

export function createTrace() {
  const runId = randomUUID()
  const started = performance.now()
  let modelCalls = 0

  return {
    runId,
    modelCall() {
      modelCalls += 1
    },
    event(stage: string, details: Record<string, string | number | boolean> = {}) {
      // stderr is reserved for traces; stdout contains the learner-visible reply.
      process.stderr.write(JSON.stringify({
        ...details,
        runId,
        stage,
        elapsedMs: Math.round(performance.now() - started),
        modelCalls,
      }) + '\n')
    },
  }
}

export type TurnTrace = ReturnType<typeof createTrace>
