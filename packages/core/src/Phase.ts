import { System, SystemFactory, SystemContext } from "./System"
import { OrderedList, OrderedListAddOpts } from "./OrderedList"
import { ComponentClass, ComponentClasses } from "./Component"

export class Phase {
  constructor(readonly name: string) {}

  static readonly Load = new Phase("Load")
  static readonly Impetus = new Phase("Impetus")
  static readonly Action = new Phase("Action")
  static readonly Reaction = new Phase("Reaction")
  static readonly Correction = new Phase("Correction")
  static readonly PreRender = new Phase("PreRender")
  static readonly Render = new Phase("Render")
  static readonly Advance = new Phase("Advance")
}

export class PhaseGraph {
  private phases: OrderedList<Phase> = new OrderedList()
  private phaseSystemFactories: OrderedList<SystemFactory>[] = []
  private phaseSystemContexts: SystemContext[][] = []
  private phaseSystems: System[][] = []

  declarePhase(phase: Phase, opts: OrderedListAddOpts<Phase> = {}) {
    const index = this.phases.addIfNotExists(phase, opts)
    if (index !== undefined) {
      this.phaseSystemFactories.splice(index, 0, new OrderedList())
      this.phaseSystems.splice(index, 0, new Array())
    }
  }

  addSystem<
    C extends SystemContext = SystemContext,
    T extends ComponentClasses = ComponentClass[],
  >(
    phase: Phase,
    systemFactory: SystemFactory<C, T>,
    systemContext: C,
    system: System,
    opts: OrderedListAddOpts<SystemFactory<C, T>> = {},
  ) {
    const phaseIndex = this.phases.indexOf(phase)
    if (phaseIndex === undefined)
      throw new Error(`Phase ${phase.name} not found in phase graph`)

    const systemIndex = this.phaseSystemFactories[phaseIndex]!.add(
      systemFactory as unknown as SystemFactory, // TODO: is this possible without the unknown cast?
      opts as unknown as OrderedListAddOpts<SystemFactory>, // TODO: is this possible without the unknown cast?
    )
    const phaseContexts = (this.phaseSystemContexts[phaseIndex] ??= [])
    const phaseSystems = (this.phaseSystems[phaseIndex] ??= [])
    phaseContexts.splice(systemIndex, 0, systemContext)
    phaseSystems.splice(systemIndex, 0, system)
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
