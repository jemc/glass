import { registerComponent, System } from "@glass/core"
import { Agate } from "@glass/agate"
import { Context } from "./Context"
import { Renderable } from "./Renderable"

export class AnimateAlphaOnStatus {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly config: Record<
      string,
      { frameCounts: number[]; alphas: number[] }
    >,
  ) {}
}

export const AnimateAlphaOnStatusSystem = (opal: Context) =>
  System.for(opal, [AnimateAlphaOnStatus, Agate.Status, Renderable], {
    shouldMatchAll: [AnimateAlphaOnStatus],
    runEach(entity, animateAlphaOnStatus, status, renderable) {
      const { config } = animateAlphaOnStatus

      for (const [statusName, statusConfig] of Object.entries(config)) {
        if (!status.is(statusName)) continue

        let frames = status.framesSinceStarted(statusName) ?? 0
        let entryIndex = 0
        while (frames > 0) {
          frames -= statusConfig.frameCounts[entryIndex] ?? 1
          entryIndex++
          if (entryIndex >= statusConfig.alphas.length) entryIndex = 0
        }
        renderable.alpha = statusConfig.alphas[entryIndex] ?? 1
      }
    },
  })
