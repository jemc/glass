import { System, World, registerComponent } from "@glass/core"
import { Agate } from "@glass/agate"
import { Sprite } from "./Sprite"

export class SpriteSetFromStatus {
  static readonly componentId = registerComponent(this)

  constructor(readonly mappings: ReadonlyArray<[string[], string]>) {}
}

export const SpriteSetFromStatusSystem = (world: World) =>
  System.for([SpriteSetFromStatus, Agate.Status, Sprite], {
    shouldMatchAll: [SpriteSetFromStatus],

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
