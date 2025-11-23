import {
  registerComponent,
  Component,
  Entity,
  System,
  QueryLike,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"
import { Body } from "./Body"

export class Sensor {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly queries: ReadonlyArray<
      QueryLike<[typeof Opal.Position, typeof Body]>
    >,
  ) {}

  readonly sensed: [Entity, [Opal.Position, Body, ...Component[]]][] = []
}

export const SensorSystem = (coral: Context) =>
  System.for(coral, [Sensor, Opal.Position, Body], {
    runEach(entity, sensor, posA, bodyA) {
      sensor.sensed.length = 0 // reset sensed list
      for (const query of sensor.queries) {
        for (const [other, otherComponents] of query.entities) {
          const [posB, bodyB] = otherComponents
          if (bodyA.checkOverlap(coral, bodyB, posA, posB)) {
            console.log("Sensed overlap between", entity, "and", other)
            sensor.sensed.push([other, otherComponents])
          }
        }
      }
    },
  })
