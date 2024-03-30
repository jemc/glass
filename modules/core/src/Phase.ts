import { System, SystemFactory } from "./System"
import { OrderedList, OrderedListAddOpts } from "./OrderedList"
import { World } from "./World"
import { StatusSystem } from "."

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

  forEachPhase(fn: (phase: Phase) => void) {
    this.phases.forEach(fn)
  }

  forEachSystem(fn: (system: System) => void) {
    this.phaseSystems.forEach((systems) => systems.forEach(fn))
  }

  forEachPhaseAndSystem(
    fn: (phase: Phase, systemFactory: SystemFactory, system: System) => void,
  ) {
    this.phases.all.forEach((phase, phaseIndex) => {
      if (phaseIndex !== undefined)
        this.phaseSystems
          .at(phaseIndex)!
          .forEach((system, systemIndex) =>
            fn(
              phase,
              this.phaseSystemFactories[phaseIndex]!.all[systemIndex]!,
              system,
            ),
          )
    })
  }
}
