import {
  Entity,
  System,
  registerComponent,
  MutableVector2,
  ReadVector2,
  World,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"
import { BlockedBy } from "./BlockedBy"
import { Body } from "./Body"
import { Riding } from "./Riding"

const VELOCITY = Symbol("Velocity._velocity")
const RESIDUALS = Symbol("Velocity._residuals")

export class Velocity {
  static readonly componentId = registerComponent(this)

  readonly [VELOCITY] = new MutableVector2()
  readonly [RESIDUALS] = new MutableVector2()

  // TODO: Find a better name for this.
  get vector(): ReadVector2 {
    return this[VELOCITY]
  }

  setVerticalConstantVelocity(speed: number) {
    if (this[VELOCITY].y !== speed) this[RESIDUALS].y = 0
    this[VELOCITY].y = speed
  }

  setHorizontalConstantVelocity(speed: number) {
    if (this[VELOCITY].x !== speed) this[RESIDUALS].x = 0
    this[VELOCITY].x = speed
  }

  approachVerticalVelocity(target: number, maxChange?: number) {
    if (!maxChange) return this.setVerticalConstantVelocity(target)

    if (target > this[VELOCITY].y) {
      this[VELOCITY].y = Math.min(this[VELOCITY].y + maxChange, target)
    } else if (target < this[VELOCITY].y) {
      this[VELOCITY].y = Math.max(this[VELOCITY].y - maxChange, target)
    }
  }

  approachHorizontalVelocity(target: number, maxChange?: number) {
    if (!maxChange) return this.setHorizontalConstantVelocity(target)

    if (target > this[VELOCITY].x) {
      this[VELOCITY].x = Math.min(this[VELOCITY].x + maxChange, target)
    } else if (target < this[VELOCITY].x) {
      this[VELOCITY].x = Math.max(this[VELOCITY].x - maxChange, target)
    }
  }
}

export const VelocitySystem = (coral: Context) =>
  System.for(coral, [Velocity, Opal.Position], {
    shouldMatchAll: [Velocity],

    run(entities) {
      const { world } = coral

      ///
      // Find the fastest axis-aligned speed among all dynamic entities,
      // and set that as the number of substeps to simulate.

      let totalSubsteps = 0
      for (const [entity, [velocity, position]] of entities) {
        const absDx =
          Math.abs(velocity.vector.x) + Math.abs(velocity[RESIDUALS].x)
        const absDy =
          Math.abs(velocity.vector.y) + Math.abs(velocity[RESIDUALS].y)
        const entityFastest = absDx > absDy ? absDx : absDy
        if (entityFastest > totalSubsteps) {
          totalSubsteps = entityFastest
        }
      }
      totalSubsteps = Math.max(Math.ceil(totalSubsteps), 1)

      ///
      // Move each entity forward one pixel at a time during each substep.
      // Slower objects will skip some of the substeps.

      for (let i = 0; i < totalSubsteps; i++) {
        for (const [entity, [velocity, position]] of entities) {
          // Determine if this is a body that can be blocked by something.
          // We do this check regardless of velocity, which is useful for
          // checking things like whether a character is standing on the ground,
          // which may be true even when the character has a zero velocity.
          const blockedBy = world.get(entity, BlockedBy)
          const body = world.get(entity, Body)
          if (blockedBy && body) {
            blockedBy.updateForSubstep(coral, entity, body, position)
          }

          // Determine if this entity should move along the X axis this substep.
          // TODO: use modular arithmetic to get them interspersed better.
          if (velocity.vector.x > 0) {
            let shouldMove = false
            if (velocity.vector.x >= i + 1) {
              shouldMove = true
            } else if (velocity.vector.x + velocity[RESIDUALS].x > i + 1) {
              shouldMove = true
              velocity[RESIDUALS].x = 0
            } else {
              velocity[RESIDUALS].x +=
                velocity.vector.x - Math.floor(velocity.vector.x)
            }
            if (shouldMove) {
              tryMoveRight(coral, entity, velocity, position, blockedBy)
            }
          } else if (velocity.vector.x < 0) {
            let shouldMove = false
            if (velocity.vector.x <= -i - 1) {
              shouldMove = true
            } else if (velocity.vector.x + velocity[RESIDUALS].x < -i - 1) {
              shouldMove = true
              velocity[RESIDUALS].x = 0
            } else {
              velocity[RESIDUALS].x +=
                velocity.vector.x - Math.ceil(velocity.vector.x)
            }
            if (shouldMove) {
              tryMoveLeft(coral, entity, velocity, position, blockedBy)
            }
          }

          // Determine if this entity should move along the Y axis this substep.
          if (velocity.vector.y > 0) {
            let shouldMove = false
            if (velocity.vector.y >= i + 1) {
              shouldMove = true
            } else if (velocity.vector.y + velocity[RESIDUALS].y > i + 1) {
              shouldMove = true
              velocity[RESIDUALS].y = 0
            } else {
              velocity[RESIDUALS].y +=
                velocity.vector.y - Math.floor(velocity.vector.y)
            }
            if (shouldMove) {
              tryMoveDown(coral, entity, velocity, position, blockedBy)
            }
          } else if (velocity.vector.y < 0) {
            let shouldMove = false
            if (velocity.vector.y <= -i - 1) {
              shouldMove = true
            } else if (velocity.vector.y + velocity[RESIDUALS].y < -i - 1) {
              shouldMove = true
              velocity[RESIDUALS].y = 0
            } else {
              velocity[RESIDUALS].y +=
                velocity.vector.y - Math.ceil(velocity.vector.y)
            }
            if (shouldMove) {
              tryMoveUp(coral, entity, velocity, position, blockedBy)
            }
          }
        }
      }
    },
  })

function tryMoveRight(
  coral: Context,
  entity: number,
  velocity: Velocity,
  pos: Opal.Position,
  blockedBy: BlockedBy | undefined,
) {
  if (blockedBy?.wasBlockedOnRight) {
    velocity.setHorizontalConstantVelocity(0)
  } else {
    pos.updateCoords((coords) => (coords.x += 1))

    // Also try to move any entities riding on this one.
    coral.world.getCollected(entity, Riding)?.forEach((ridingEntity) => {
      const ridingVelocity = coral.world.get(ridingEntity, Velocity)
      const ridingPosition = coral.world.get(ridingEntity, Opal.Position)
      if (ridingVelocity && ridingPosition)
        tryMoveRight(
          coral,
          ridingEntity,
          ridingVelocity,
          ridingPosition,
          coral.world.get(ridingEntity, BlockedBy),
        )
    })
  }
}

function tryMoveLeft(
  coral: Context,
  entity: number,
  velocity: Velocity,
  pos: Opal.Position,
  blockedBy: BlockedBy | undefined,
) {
  if (blockedBy?.wasBlockedOnLeft) {
    velocity.setHorizontalConstantVelocity(0)
  } else {
    pos.updateCoords((coords) => (coords.x -= 1))

    // Also try to move any entities riding on this one.
    coral.world.getCollected(entity, Riding)?.forEach((ridingEntity) => {
      const ridingVelocity = coral.world.get(ridingEntity, Velocity)
      const ridingPosition = coral.world.get(ridingEntity, Opal.Position)
      if (ridingVelocity && ridingPosition)
        tryMoveLeft(
          coral,
          ridingEntity,
          ridingVelocity,
          ridingPosition,
          coral.world.get(ridingEntity, BlockedBy),
        )
    })
  }
}

function tryMoveDown(
  coral: Context,
  entity: number,
  velocity: Velocity,
  pos: Opal.Position,
  blockedBy: BlockedBy | undefined,
) {
  if (blockedBy?.wasBlockedOnBottom) {
    velocity.setVerticalConstantVelocity(0)
  } else {
    pos.updateCoords((coords) => (coords.y += 1))
    // TODO: handle clearing riding status for more than just downward riding
    coral.world.remove(entity, [Riding])

    // Also try to move any entities riding on this one.
    coral.world.getCollected(entity, Riding)?.forEach((ridingEntity) => {
      const ridingVelocity = coral.world.get(ridingEntity, Velocity)
      const ridingPosition = coral.world.get(ridingEntity, Opal.Position)
      if (ridingVelocity && ridingPosition)
        tryMoveDown(
          coral,
          ridingEntity,
          ridingVelocity,
          ridingPosition,
          coral.world.get(ridingEntity, BlockedBy),
        )
    })
  }
}

function tryMoveUp(
  coral: Context,
  entity: number,
  velocity: Velocity,
  pos: Opal.Position,
  blockedBy: BlockedBy | undefined,
) {
  if (blockedBy?.wasBlockedOnTop) {
    velocity.setVerticalConstantVelocity(0)
  } else {
    pos.updateCoords((coords) => (coords.y -= 1))
    // TODO: handle clearing riding status for more than just downward riding
    coral.world.remove(entity, [Riding])

    // Also try to move any entities riding on this one.
    coral.world.getCollected(entity, Riding)?.forEach((ridingEntity) => {
      const ridingVelocity = coral.world.get(ridingEntity, Velocity)
      const ridingPosition = coral.world.get(ridingEntity, Opal.Position)
      if (ridingVelocity && ridingPosition)
        tryMoveUp(
          coral,
          ridingEntity,
          ridingVelocity,
          ridingPosition,
          coral.world.get(ridingEntity, BlockedBy),
        )
    })
  }
}
