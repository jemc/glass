import { System, registerComponent } from "@glass/core"
import { Context } from "./Context"
import { Status } from "./Status"
import { Gauges } from "./Gauges"

interface GaugesSetStatusConfig {
  readonly [gaugeName: string]: {
    // The maximum value for the gauge which can cause this status effect.
    readonly atMost?: number

    // The minimum value for the gauge which can cause this status effect.
    readonly atLeast?: number

    // The status names to be applied (if not blocked) by the effect.
    readonly sets?: string[]

    // The status names to be removed (if not sustained) by the effect.
    readonly stops?: string[]
  }[]
}

export class GaugesSetStatus {
  static readonly componentId = registerComponent(this)

  constructor(readonly config: GaugesSetStatusConfig = {}) {}
}

export const GaugesSetStatusSystem = (agate: Context) =>
  System.for(agate, [GaugesSetStatus, Status, Gauges], {
    shouldMatchAll: [GaugesSetStatus],

    runEach(entity, gaugesSetStatus, status, gauges) {
      const { config } = gaugesSetStatus

      for (const [gaugeName, statusEffects] of Object.entries(config)) {
        const gaugeValue = gauges.get(gaugeName)

        for (const statusEffect of statusEffects) {
          if (
            (statusEffect.atMost !== undefined &&
              gaugeValue > statusEffect.atMost) ||
            (statusEffect.atLeast !== undefined &&
              gaugeValue < statusEffect.atLeast)
          )
            continue

          if (statusEffect.sets) {
            for (const statusName of statusEffect.sets) {
              status.set(statusName)
            }
          }
          if (statusEffect.stops) {
            for (const statusName of statusEffect.stops) {
              status.stop(statusName)
            }
          }
        }
      }
    },
  })
