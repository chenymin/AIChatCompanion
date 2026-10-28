import { runTurn } from './agent.ts'
import { safeError } from './errors.ts'

const args = process.argv.slice(2)
if (args[0] === '--') args.shift()

if (args.includes('--help')) {
  process.stdout.write('用法：pnpm run chat -- "突然降温"\n默认 MODEL_MODE=mock；真实模式见 .env.example。\n故障实验：MOCK_FAULT=error pnpm run chat -- "突然降温"\n')
} else {
  const controller = new AbortController()
  const onInterrupt = () => {
    process.exitCode = 130
    controller.abort()
  }
  process.on('SIGINT', onInterrupt)
  try {
    const reply = await runTurn(args.length ? args.join(' ') : '突然降温', { signal: controller.signal })
    process.stdout.write(reply + '\n')
  } catch (error) {
    const failure = safeError(error)
    process.stderr.write(`[${failure.code}] ${failure.message}\n`)
    process.exitCode = controller.signal.aborted ? 130 : 1
  } finally {
    process.off('SIGINT', onInterrupt)
  }
}
