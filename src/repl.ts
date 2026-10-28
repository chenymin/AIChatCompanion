import { createInterface } from 'node:readline'
import { runTurn } from './agent.ts'
import { Conversation } from './conversation.ts'
import { safeError } from './errors.ts'

export async function startRepl(): Promise<void> {
  const conversation = new Conversation()
  const terminal = Boolean(process.stdin.isTTY)
  const reader = createInterface({ input: process.stdin, output: process.stdout, terminal })
  let activeController: AbortController | undefined
  let stopping = false

  const onInterrupt = () => {
    stopping = true
    process.exitCode = 130
    activeController?.abort()
    reader.close()
  }
  process.on('SIGINT', onInterrupt)
  reader.on('SIGINT', onInterrupt)
  reader.setPrompt('你> ')
  const prompt = () => {
    if (terminal && !stopping) reader.prompt()
  }

  process.stdout.write('多轮会话：/history 查看历史，/reset 重置，/exit 退出。\n')
  prompt()

  try {
    // Await each full turn so later input cannot overtake its state commit.
    for await (const line of reader) {
      if (stopping) break
      const input = line.trim()
      if (!input) {
        prompt()
        continue
      }
      if (input === '/exit') break
      if (input === '/history') {
        process.stdout.write(JSON.stringify(conversation.history(), null, 2) + '\n')
        prompt()
        continue
      }
      if (input === '/reset') {
        conversation.reset()
        process.stdout.write('当前内存会话已重置。\n')
        prompt()
        continue
      }

      activeController = new AbortController()
      try {
        const reply = await runTurn(input, { conversation, signal: activeController.signal })
        process.stdout.write(reply + '\n')
      } catch (error) {
        const failure = safeError(error)
        process.stderr.write(`[${failure.code}] ${failure.message}\n`)
      } finally {
        activeController = undefined
      }
      if (stopping) break
      prompt()
    }
  } finally {
    process.off('SIGINT', onInterrupt)
    reader.off('SIGINT', onInterrupt)
    reader.close()
    process.stdout.write('会话已结束；内存历史不保留。\n')
  }
}
