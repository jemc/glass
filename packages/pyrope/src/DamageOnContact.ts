import { registerComponent, ComponentClass, System } from "@glass/core"
import { Agate } from "@glass/agate"
import { Coral } from "@glass/coral"
import { Context } from "./Context"

export class DamageOnContact {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly targetComponentClass: ComponentClass,
    readonly amount: number,
  ) {}
}

export const DamageOnContactSystem = (context: Context) =>
  System.for(context, [DamageOnContact, Coral.Sensor], {
    shouldMatchAll: [DamageOnContact],

    runEach(entity, damage, sensor) {
      for (const [other, otherComponents] of sensor.sensed) {
        // Check if the other entity has the target component class.
        // If it doesn't, it won't be the target of any damage.
        if (!context.world.get(other, damage.targetComponentClass)) continue

        // Check if the other entity has a Status component.
        // If it does, try to set the "damage" status.
        const status = context.world.get(other, Agate.Status)
        if (status) {
          status.set("damage")

          // Check if the "damage" status was successfully set.
          // If not, it was blocked by some kind of invulnerability status,
          // so we won't do anything further.
          if (!status.isStarting("damage")) continue
        }

        // Check if the other entity has a Gauges component.
        // If it does, try to reduce its HP gauge by the damage amount.
        // TODO: Check for other gauges that offer resistance to reduce damage.
        const gauges = context.world.get(other, Agate.Gauges)
        if (gauges) {
          gauges.add("health", -damage.amount)
        }
      }
    },
  })
