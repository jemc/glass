import { registerComponent, System, ComponentClass } from "@glass/core"
import { Agate } from "@glass/agate"
import { Coral } from "@glass/coral"
import { Context } from "./Context"

export interface StatusOnContactConfig {
  with: ComponentClass
  sets: string[]
}

export class StatusOnContact {
  static readonly componentId = registerComponent(this)

  constructor(readonly configs: Record<string, StatusOnContactConfig>) {}
}

export const StatusOnContactSystem = (context: Context) =>
  System.for(context, [StatusOnContact, Agate.Status, Coral.Sensor], {
    shouldMatchAll: [StatusOnContact],

    runEach(entity, onContact, status, sensor) {
      for (const [other, otherComponents] of sensor.sensed) {
        for (const [configName, config] of Object.entries(onContact.configs)) {
          if (context.world.get(other, config.with)) {
            for (const statusName in config.sets) {
              status.set(statusName)
            }
          }
        }
      }
    },
  })
