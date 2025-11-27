import { ComponentClass, registerComponent, System } from "@glass/core"
import { Context } from "./Context"
import { Status } from "./Status"

export class StatusRemovesComponents {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly componentClassesByStatus: Record<string, ComponentClass[]>,
  ) {}
}

export const StatusRemovesComponentsSystem = (context: Context) =>
  System.for(context, [StatusRemovesComponents, Status], {
    shouldMatchAll: [StatusRemovesComponents],

    runEach(entity, removes, status) {
      for (const [statusName, componentClassess] of Object.entries(
        removes.componentClassesByStatus,
      )) {
        if (status.is(statusName))
          context.world.remove(entity, componentClassess)
      }
    },
  })
