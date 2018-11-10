export class RequestError extends Error {
  private _code: number
  public get code() {
    return this._code
  }
  constructor({code, message}: {code: number; message: string}) {
    super(message)
    this._code = code
  }
}