import { System, registerComponent } from "@glass/core"
import { Context } from "./Context"
import { Status } from "./Status"

export class DestroyOnStatus {
  static readonly componentId = registerComponent(this)

  constructor(readonly statusName: string) {}
}

export const DestroyOnStatusSystem = (agate: Context) =>
  System.for(agate, [DestroyOnStatus, Status], {
    shouldMatchAll: [DestroyOnStatus],

    runEach(entity, destroyOn, status) {
      if (status.is(destroyOn.statusName)) agate.world.destroy(entity)
    },
  })
