import { registerComponent } from "@glass/core"

export class Context {
  static readonly componentId = registerComponent(this)

  static readonly setupFns: ((ctx: Context) => Promise<void>)[] = []
  static async setup() {
    const ctx = new Context()
    await Promise.all(Context.setupFns.map((fn) => fn(ctx)))
    return ctx
  }

  readonly audio = new AudioContext({
    sampleRate: 44100,
    latencyHint: "interactive",
  })

  // Constructor is private to ensure that the async `setup` function is used.
  private constructor() {}
}
