import { runTurn } from './agent.ts'
import { safeError } from './errors.ts'
import { startRepl } from './repl.ts'

const args = process.argv.slice(2)
if (args[0] === '--') args.shift()

if (args.includes('--help')) {
  process.stdout.write('单次：pnpm run chat -- "突然降温"\n多轮：pnpm run chat\n默认 MODEL_MODE=mock；真实模式见 .env.example。\n故障实验：MOCK_FAULT=error pnpm run chat\n')
} else if (!args.length) {
  try {
    await startRepl()
  } catch (error) {
    const failure = safeError(error)
    process.stderr.write(`[${failure.code}] ${failure.message}\n`)
    process.exitCode = 1
  }
} else {
  const controller = new AbortController()
  const onInterrupt = () => {
    process.exitCode = 130
    controller.abort()
  }
  process.on('SIGINT', onInterrupt)
  try {
    const reply = await runTurn(args.join(' '), { signal: controller.signal })
    process.stdout.write(reply + '\n')
  } catch (error) {
    const failure = safeError(error)
    process.stderr.write(`[${failure.code}] ${failure.message}\n`)
    process.exitCode = controller.signal.aborted ? 130 : 1
  } finally {
    process.off('SIGINT', onInterrupt)
  }
}
