import {
  Component,
  Phase,
  SystemContext,
  World,
  registerComponent,
} from "@glass/core"
import { Agate } from "@glass/agate"
import { ArrangementPlaySystem } from "./Arrangement"

// TODO: Get rid of this or make it private.
export const setupFns: ((ctx: Context) => Promise<void>)[] = []

export class Context extends SystemContext {
  static readonly componentId = registerComponent(this)

  static async setup(agate: Agate.Context) {
    const ctx = new Context(agate)
    await Promise.all(setupFns.map((fn) => fn(ctx)))
    return ctx
  }

  readonly audio = new AudioContext({
    sampleRate: 44100,
    latencyHint: "interactive",
  })

  readonly world: World = this.agate.world

  // Constructor is private to ensure that the async `setup` function is used.
  private constructor(readonly agate: Agate.Context) {
    super()

    this.world.addSystem(Phase.PreRender, ArrangementPlaySystem, this)
  }

  create(...components: Component[]): number {
    return this.world.create(this.agate, this, ...components)
  }
}
