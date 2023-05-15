export abstract class LoadAsset<T> {
  constructor(public url: string) {
    setTimeout(() => this.load())
  }

  abstract load(): void

  private _result: T | undefined

  get result() {
    return this._result
  }

  get isFinished() {
    return this._result !== undefined
  }

  finished(result: T) {
    if (this.isFinished) return
    this._result = result
  }
}
