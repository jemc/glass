import {
  Status,
  World,
  prerequisiteComponents,
  registerComponent,
} from "@glass/core"
import { Context } from "./Context"
import { Sprite } from "./Sprite"

export class SpriteSetFromStatus {
  static readonly componentId = registerComponent(this)
  static readonly prerequisiteComponentIds = prerequisiteComponents(
    Context,
    Status,
    Sprite,
  )

  constructor(readonly mappings: ReadonlyArray<[string[], string]>) {}
}

export const SpriteSetFromStatusSystem = (world: World) =>
  world.systemFor([SpriteSetFromStatus, Status, Sprite], {
    runEach(entity, spriteSetFromStatus, status, sprite) {
      const { mappings } = spriteSetFromStatus
      for (const [requiredStatusNames, spriteName] of mappings) {
        if (requiredStatusNames.every((name) => status.is(name))) {
          sprite.use(spriteName)
          break
        }
      }
    },
  })
