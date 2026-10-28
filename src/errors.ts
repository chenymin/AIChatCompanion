export class CourseError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'CourseError'
    this.code = code
  }
}

// Only deliberately authored error messages may reach the terminal.
export function safeError(error: unknown): { code: string; message: string } {
  return error instanceof CourseError
    ? { code: error.code, message: error.message }
    : { code: 'UNEXPECTED_ERROR', message: '发生未预期错误，请在 VS Code 中设置断点定位。' }
}
