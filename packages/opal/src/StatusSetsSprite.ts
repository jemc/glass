import { registerComponent, System } from "@glass/core"
import { Agate } from "@glass/agate"
import { Sprite } from "./Sprite"
import { Context } from "./Context"

export class StatusSetsSprite {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly mappings: ReadonlyArray<[ReadonlyArray<string>, string]>,
  ) {}
}

export const StatusSetsSpriteSystem = (opal: Context) =>
  System.for(opal, [StatusSetsSprite, Agate.Status, Sprite], {
    shouldMatchAll: [StatusSetsSprite],

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
