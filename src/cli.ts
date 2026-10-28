import { runTurn } from './agent.ts'
import { safeError } from './errors.ts'

const args = process.argv.slice(2)
if (args[0] === '--') args.shift()

if (args.includes('--help')) {
  process.stdout.write('用法：npm run chat -- "突然降温"\n故障实验：MOCK_FAULT=error npm run chat -- "突然降温"\n')
} else {
  try {
    const reply = await runTurn(args.length ? args.join(' ') : '突然降温')
    process.stdout.write(reply + '\n')
  } catch (error) {
    const failure = safeError(error)
    process.stderr.write(`[${failure.code}] ${failure.message}\n`)
    process.exitCode = 1
  }
}
