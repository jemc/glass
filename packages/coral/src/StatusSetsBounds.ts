import { registerComponent, System } from "@glass/core"
import { Agate } from "@glass/agate"
import { Context } from "./Context"
import { Bounds } from "./Bounds"

export class StatusSetsBounds {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly mappings: ReadonlyArray<
      [ReadonlyArray<string>, [number, number, number, number]]
    >,
  ) {}
}

export const StatusSetsBoundsSystem = (coral: Context) =>
  System.for(coral, [StatusSetsBounds, Agate.Status, Bounds], {
    shouldMatchAll: [StatusSetsBounds],

    runEach(entity, statusSetsBounds, status, bounds) {
      const { mappings } = statusSetsBounds
      // Set bounds based on the first mapping whose required status names
      // are all present in the current status.
      for (const [requiredStatusNames, boundsValues] of mappings) {
        if (requiredStatusNames.every((name) => status.is(name))) {
          bounds.update(...boundsValues)
          break
        }
      }
    },
  })
