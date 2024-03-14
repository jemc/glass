import { Entity, Matrix3, World } from "@glass/core"
import { Context } from "./Context"
import { Renderable } from "./Renderable"
import { Position, PositionWithin } from "./Position"

export const RenderRenderablesSystem = (world: World) => {
  const seenSet = new Set<Entity>()

  function renderTreeContaining(entity: Entity, context: Context) {
    // Traverse upward parents first, so that we start the root of the tree.
    let parent
    do {
      entity = parent ?? entity
      parent = world.get(entity, PositionWithin)?.collectionEntity
    } while (parent !== undefined)

    const worldTransform =
      world.get(entity, Position)?.localTransformMatrix ?? Matrix3.create()
    renderChildrenThenSelf(
      context,
      entity,
      world.get(entity, Renderable),
      worldTransform,
    )
  }

  function renderChildrenThenSelf(
    context: Context,
    entity: Entity,
    renderable?: Renderable,
    worldTransform?: Float32Array,
    parentWorldAlpha?: number,
  ) {
    const worldAlpha = (parentWorldAlpha ?? 1) * (renderable?.alpha ?? 1)

    // Render the children of the node first.
    const childWorldTransform = Matrix3.create()
    for (const child of world.getCollected(entity, PositionWithin)?.values()) {
      const position = world.get(child, Position)
      if (position && worldTransform)
        Matrix3.multiply(
          position.localTransformMatrix,
          worldTransform,
          childWorldTransform,
        )

      renderChildrenThenSelf(
        context,
        child,
        world.get(child, Renderable),
        childWorldTransform,
        worldAlpha,
      )
    }

    // Finally, render the node itself.
    seenSet.add(entity)
    if (renderable && worldTransform) {
      context._spriteRendering.addSpriteToRender(
        context.render,
        renderable,
        worldTransform,
        worldAlpha,
      )
    }
  }

  return world.systemFor([Context, Renderable], {
    run(entities) {
      Context.forEach((context: Context) => {
        context._spriteRendering.beginRender(context.render)
      })

      seenSet.clear()

      for (const [entity, [context, renderable]] of entities.entries()) {
        if (seenSet.has(entity)) continue
        renderTreeContaining(entity, context)
      }

      Context.forEach((context: Context) => {
        context._spriteRendering.finishRender(context.render)
      })
    },
  })
}
