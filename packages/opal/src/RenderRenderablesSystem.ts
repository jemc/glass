import { Entity, Matrix3, System, World } from "@glass/core"
import { Context } from "./Context"
import { Renderable } from "./Renderable"
import { Position, PositionWithin } from "./Position"

export const RenderRenderablesSystem = (opal: Context) => {
  const { world } = opal
  const seenSet = new Set<Entity>()

  function renderTreeContaining(entity: Entity) {
    // Traverse upward parents first, so that we start the root of the tree.
    let parent
    do {
      entity = parent ?? entity
      parent = world.get(entity, PositionWithin)?.collectionEntity
    } while (parent !== undefined)

    const worldTransform =
      world.get(entity, Position)?.localTransformMatrix ?? Matrix3.create()
    renderChildrenThenSelf(
      entity,
      world.get(entity, Renderable),
      worldTransform,
    )
  }

  function renderChildrenThenSelf(
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
        child,
        world.get(child, Renderable),
        childWorldTransform,
        worldAlpha,
      )
    }

    // Finally, render the node itself.
    seenSet.add(entity)
    if (renderable && worldTransform) {
      opal._spriteRendering.addSpriteToRender(
        opal.render,
        renderable,
        worldTransform,
        worldAlpha,
      )
    }
  }

  return System.for(opal, [Renderable], {
    shouldMatchAll: [Renderable],

    run(entities) {
      opal._spriteRendering.beginRender(opal.render)

      seenSet.clear()

      for (const [entity, [renderable]] of entities.entries()) {
        if (seenSet.has(entity)) continue
        renderTreeContaining(entity)
      }

      opal._spriteRendering.finishRender(opal.render)
    },
  })
}
