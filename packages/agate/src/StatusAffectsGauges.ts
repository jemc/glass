import { System, registerComponent } from "@glass/core"
import { Context } from "./Context"
import { Status } from "./Status"
import { Gauges, GaugeEffect } from "./Gauges"

interface TimedGaugeEffectConfig extends GaugeEffect {
  readonly initialDelayFrames?: number
  readonly repeatIntervalFrames?: number
}

interface TimedGaugeEffect extends TimedGaugeEffectConfig {
  readonly initialDelayFrames: number
  readonly repeatIntervalFrames: number
  currentDelayFrames: number
}

export class StatusAffectsGauges {
  static readonly componentId = registerComponent(this)

  readonly config: { [status: string]: TimedGaugeEffect[] } = {}

  constructor(config: { [status: string]: TimedGaugeEffectConfig[] }) {
    for (const [status, effects] of Object.entries(config)) {
      this.config[status] = effects.map((effect) => ({
        ...effect,
        initialDelayFrames: effect.initialDelayFrames ?? 0,
        repeatIntervalFrames: effect.repeatIntervalFrames ?? Infinity,
        currentDelayFrames: effect.initialDelayFrames ?? 0,
      }))
    }
  }
}

export const StatusAffectsGaugesSystem = (agate: Context) =>
  System.for(agate, [StatusAffectsGauges, Status, Gauges], {
    shouldMatchAll: [StatusAffectsGauges],

    runEach(entity, effects, status, gauges) {
      for (const [statusName, gaugeEffects] of Object.entries(effects.config)) {
        if (status.is(statusName)) {
          const isStarting = status.isStarting(statusName)

          for (const effect of gaugeEffects) {
            if (isStarting)
              effect.currentDelayFrames = effect.initialDelayFrames

            if (effect.currentDelayFrames <= 0) {
              gauges.apply(effect)
              effect.currentDelayFrames = effect.repeatIntervalFrames
            }
            effect.currentDelayFrames--
          }
        }
      }
    },
  })
