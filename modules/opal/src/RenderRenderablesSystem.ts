import { Entity, World } from "@glass/core"
import { Context } from "./Context"
import { Renderable } from "./Renderable"
import { SpriteRendering } from "./SpriteRendering"
import { Position, PositionWithin } from "./Position"

export const RenderRenderablesSystem = (world: World, context: Context) => {
  const rendering = new SpriteRendering(context.render, 1000)
  const seenSet = new Set<Entity>()

  function renderTreeContaining(entity: Entity) {
    // Traverse upward parents first, so that we start the root of the tree.
    let parent
    do {
      entity = parent ?? entity
      parent = world.get(entity, PositionWithin)?.collectionEntity
    } while (parent !== undefined)

    renderChildrenThenSelf(entity, world.get(entity, Renderable))
  }

  function renderChildrenThenSelf(
    entity: Entity,
    renderable?: Renderable,
    parentRenderable?: Renderable,
  ) {
    const position = world.get(entity, Position)
    if (position && renderable)
      renderable.updateTransforms(position, parentRenderable)

    // Render the children of the node first.
    for (const child of world.getCollected(entity, PositionWithin)?.values()) {
      renderChildrenThenSelf(child, world.get(child, Renderable), renderable)
    }

    // Finally, render the node itself.
    seenSet.add(entity)
    if (renderable) rendering.addSpriteToRender(context.render, renderable)
  }

  return world.systemFor([Renderable, Position], {
    run(entities) {
      rendering.beginRender(context.render)
      seenSet.clear()

      for (const entity of entities.keys()) {
        if (seenSet.has(entity)) continue
        renderTreeContaining(entity)
      }

      rendering.finishRender(context.render)
    },
  })
}
