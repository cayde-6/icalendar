export class CliError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'CliError'
    this.code = code
  }
}
