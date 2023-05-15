import { World } from "@glass/core"
import { Context } from "./Context"
import { Renderable } from "./Renderable"
import { SpriteRendering } from "./SpriteRendering"

export const RenderRenderablesSystem = (world: World, context: Context) => {
  const rendering = new SpriteRendering(context.render, 1000)

  return world.systemFor([Renderable], {
    run(entities) {
      rendering.beginRender(context.render)
      for (const [entity, [renderable]] of entities.entries()) {
        rendering.addSpriteToRender(context.render, renderable)
      }
      rendering.finishRender(context.render)
    },
  })
}
