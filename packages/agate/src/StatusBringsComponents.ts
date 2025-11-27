import {
  Component,
  ComponentClass,
  registerComponent,
  System,
} from "@glass/core"
import { Context } from "./Context"
import { Status } from "./Status"

const BROUGHT_STATUSES = Symbol("StatusBringsComponents._brought_statuses")

export class StatusBringsComponents {
  static readonly componentId = registerComponent(this)

  constructor(readonly componentsByStatus: Record<string, Component[]>) {}

  readonly [BROUGHT_STATUSES]: Set<string> = new Set()
}

export const StatusBringsComponentsSystem = (context: Context) =>
  System.for(context, [StatusBringsComponents, Status], {
    shouldMatchAll: [StatusBringsComponents],

    runEach(entity, brings, status) {
      for (const [statusName, components] of Object.entries(
        brings.componentsByStatus,
      )) {
        if (
          status.is(statusName) &&
          !brings[BROUGHT_STATUSES].has(statusName)
        ) {
          brings[BROUGHT_STATUSES].add(statusName)
          context.world.set(entity, components)
        } else if (
          brings[BROUGHT_STATUSES].has(statusName) &&
          !status.is(statusName)
        ) {
          brings[BROUGHT_STATUSES].delete(statusName)
          context.world.remove(
            entity,
            components.map((c) => c.constructor as unknown as ComponentClass),
          )
        }
      }
    },
  })
