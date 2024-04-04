import { System, SystemFactory } from "./System"
import { OrderedList, OrderedListAddOpts } from "./OrderedList"

export class Phase {
  constructor(readonly name: string) {}

  static readonly Load = new Phase("Load")
  static readonly Impetus = new Phase("Impetus")
  static readonly Action = new Phase("Action")
  static readonly Reaction = new Phase("Reaction")
  static readonly Correction = new Phase("Correction")
  static readonly PreRender = new Phase("PreRender")
  static readonly Render = new Phase("Render")
}

export class PhaseGraph {
  private phases: OrderedList<Phase> = new OrderedList()
  private phaseSystemFactories: OrderedList<SystemFactory>[] = []
  private phaseSystems: System[][] = []

  addPhase(phase: Phase, opts: OrderedListAddOpts<Phase> = {}) {
    const index = this.phases.add(phase, opts)
    if (index !== undefined) {
      this.phaseSystemFactories.splice(index, 0, new OrderedList())
      this.phaseSystems.splice(index, 0, new Array())
    }
  }

  addSystem(
    phase: Phase,
    systemFactory: SystemFactory,
    system: System,
    opts: OrderedListAddOpts<SystemFactory> = {},
  ) {
    const phaseIndex = this.phases.indexOf(phase)
    if (phaseIndex === undefined)
      throw new Error(`Phase ${phase.name} not found in phase graph`)

    const systemIndex = this.phaseSystemFactories[phaseIndex]!.add(
      systemFactory,
      opts,
    )
    if (systemIndex !== undefined)
      this.phaseSystems[phaseIndex]![systemIndex] = system
  }

  public *systems() {
    for (const [phaseIndex, _phase] of this.phases.entries()) {
      if (phaseIndex === undefined) continue
      for (const s of this.phaseSystems[phaseIndex]!) {
        yield s
      }
    }
  }

  public *phasesAndSystems() {
    for (const [phaseIndex, phase] of this.phases.entries()) {
      if (phaseIndex === undefined) continue
      for (const s of this.phaseSystems[phaseIndex]!) {
        yield [phase, s]
      }
    }
  }

  public *phasesAndSystemFactories() {
    for (const [phaseIndex, phase] of this.phases.entries()) {
      if (phaseIndex === undefined) continue
      for (const f of this.phaseSystemFactories[phaseIndex]!.values()) {
        yield [phase, f]
      }
    }
  }
}
