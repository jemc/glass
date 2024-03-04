import { Entity, World } from "@glass/core"
import { Position, PositionWithin } from "./Position"
import { Renderable } from "./Renderable"

export const UpdateTransformsSystem = (world: World) => {
  return world.systemFor([Position, Renderable], {
    run(entities) {
      for (const [entity, [position, renderable]] of entities.entries()) {
        update(world, entity, position, renderable)
      }
    },
  })
}

function update(
  world: World,
  entity: Entity,
  position: Position,
  renderable: Renderable,
) {
  const parentRenderable = updateParent(world, entity)

  renderable.position = position.coords
  renderable.updateTransforms(world.clock.frame, parentRenderable)
}

function updateParent(world: World, entity: Entity) {
  const parent = world.get(entity, PositionWithin)?.collectionEntity
  if (!parent) return

  const parentRenderable = world.get(parent, Renderable)
  if (!parentRenderable) return

  const parentPosition = world.get(parent, Position)
  if (!parentPosition) return

  update(world, parent, parentPosition, parentRenderable)

  return parentRenderable
}
