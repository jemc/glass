import { registerComponent, prerequisiteComponents, World } from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"

interface Config {
  readonly text: string
  readonly font: string
}

export class RenderText {
  static readonly componentId = registerComponent(this)
  static readonly prerequisiteComponentIds = prerequisiteComponents(
    Context,
    Opal.Renderable,
  )

  constructor(readonly config: Config) {}
}

export const RenderTextSystem = (world: World) =>
  world.systemFor([Context, RenderText, Opal.Renderable], {
    runEach(entity, context, renderText, renderable) {
      const { text, font } = renderText.config
      const firstChar = text[0]
      const firstTexture = context.opal.textures.get(
        `font-${font}-${firstChar}`,
      )

      if (!firstTexture) return

      // TODO: Instead of creating so many separate entities, should we
      // make a shader to draw them onto a single TextureSurfaceDrawable?

      var offset = 0
      text.split("").forEach((glyph) => {
        const texture = context.opal.textures.get(`font-${font}-${glyph}`)
        if (!texture) return

        world.create([
          context.opal,
          new Opal.PositionWithin(entity),
          new Opal.Position(offset, 0),
          new Opal.Renderable({ depth: renderable.depth }),
          new Opal.Sprite(`font-${font}-${glyph}`),
        ])

        offset += texture.width
      })

      world.remove(entity, [RenderText])
    },
  })
