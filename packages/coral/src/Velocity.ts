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
import { _CanBlock } from "./_CanBlock"

const VELOCITY = Symbol("Velocity._velocity")
const RESIDUALS = Symbol("Velocity._residuals")
const SCRATCH = Symbol("Velocity._scratch")

export class Velocity {
  static readonly componentId = registerComponent(this)

  readonly [VELOCITY] = new MutableVector2(0, 0)
  readonly [RESIDUALS] = new MutableVector2(0, 0)
  readonly [SCRATCH] = new MutableVector2(0, 0)

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
      for (const [entity, [v, position]] of entities) {
        const absDx = (v[SCRATCH].x = Math.abs(v[VELOCITY].x + v[RESIDUALS].x))
        const absDy = (v[SCRATCH].y = Math.abs(v[VELOCITY].y + v[RESIDUALS].y))
        if (absDx > totalSubsteps) totalSubsteps = absDx
        if (absDy > totalSubsteps) totalSubsteps = absDy
      }
      totalSubsteps = Math.floor(totalSubsteps, 1)
      // totalSubsteps = Math.max(Math.ceil(totalSubsteps), 1)

      for (const [entity, [v, position]] of entities) {
        v[SCRATCH].x = totalSubsteps / v[SCRATCH].x
        v[SCRATCH].y = totalSubsteps / v[SCRATCH].y
      }

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
          const shouldMoveX =
            Math.floor(i % velocity[SCRATCH].x) === 0 &&
            velocity[SCRATCH].x <= totalSubsteps
          if (velocity.vector.x > 0) {
            if (shouldMoveX)
              tryMoveRight(coral, entity, velocity, position, blockedBy)
          } else if (velocity.vector.x < 0) {
            if (shouldMoveX)
              tryMoveLeft(coral, entity, velocity, position, blockedBy)
          } else {
            velocity[RESIDUALS].x = 0
          }

          // Determine if this entity should move along the Y axis this substep.
          const shouldMoveY =
            Math.floor(i % velocity[SCRATCH].y) === 0 &&
            velocity[SCRATCH].y <= totalSubsteps
          if (velocity.vector.y > 0) {
            if (shouldMoveY)
              tryMoveDown(coral, entity, velocity, position, blockedBy)
          } else if (velocity.vector.y < 0) {
            if (shouldMoveY)
              tryMoveUp(coral, entity, velocity, position, blockedBy)
          } else {
            velocity[RESIDUALS].y = 0
          }
        }
      }

      ///
      // Calculate residual velocities for the next frame.
      for (const [entity, [velocity, position]] of entities) {
        const combX = velocity[VELOCITY].x + velocity[RESIDUALS].x
        const combY = velocity[VELOCITY].y + velocity[RESIDUALS].y
        velocity[RESIDUALS].x =
          combX > 0 ? combX - Math.floor(combX) : combX - Math.ceil(combX)
        velocity[RESIDUALS].y =
          combY > 0 ? combY - Math.floor(combY) : combY - Math.ceil(combY)
      }
    },
  })

function tryMoveRight(
  coral: Context,
  entity: number,
  velocity: Velocity,
  pos: Opal.Position,
  blockedBy: BlockedBy | undefined,
  dueToRiding = false,
) {
  if (blockedBy?.wasBlockedOnRight) {
    velocity.setHorizontalConstantVelocity(0)
  } else {
    pos.updateCoords((coords) => (coords.x += 1))

    // Also try to move any entities riding on this one.
    coral.world.getCollected(entity, Riding)?.forEach((ridingEntity) => {
      const ridingVelocity = coral.world.get(ridingEntity, Velocity)
      const ridingPosition = coral.world.get(ridingEntity, Opal.Position)
      const ridingBlockedBy = coral.world.get(ridingEntity, BlockedBy)
      if (ridingVelocity && ridingPosition) {
        if (ridingBlockedBy) {
          const ridingBody = coral.world.get(ridingEntity, Body)
          if (ridingBody) {
            ridingBlockedBy.updateForSubstep(
              coral,
              ridingEntity,
              ridingBody,
              ridingPosition,
            )
          }
        }
        tryMoveRight(
          coral,
          ridingEntity,
          ridingVelocity,
          ridingPosition,
          ridingBlockedBy,
          true,
        )
      }
    })
  }
}

function tryMoveLeft(
  coral: Context,
  entity: number,
  velocity: Velocity,
  pos: Opal.Position,
  blockedBy: BlockedBy | undefined,
  dueToRiding = false,
) {
  if (blockedBy?.wasBlockedOnLeft) {
    velocity.setHorizontalConstantVelocity(0)
  } else {
    pos.updateCoords((coords) => (coords.x -= 1))

    // Also try to move any entities riding on this one.
    coral.world.getCollected(entity, Riding)?.forEach((ridingEntity) => {
      const ridingVelocity = coral.world.get(ridingEntity, Velocity)
      const ridingPosition = coral.world.get(ridingEntity, Opal.Position)
      const ridingBlockedBy = coral.world.get(ridingEntity, BlockedBy)
      if (ridingVelocity && ridingPosition) {
        if (ridingBlockedBy) {
          const ridingBody = coral.world.get(ridingEntity, Body)
          if (ridingBody) {
            ridingBlockedBy.updateForSubstep(
              coral,
              ridingEntity,
              ridingBody,
              ridingPosition,
            )
          }
        }
        tryMoveLeft(
          coral,
          ridingEntity,
          ridingVelocity,
          ridingPosition,
          ridingBlockedBy,
          true,
        )
      }
    })
  }
}

function tryMoveDown(
  coral: Context,
  entity: number,
  velocity: Velocity,
  pos: Opal.Position,
  blockedBy: BlockedBy | undefined,
  dueToRiding = false,
) {
  if (blockedBy?.wasBlockedOnBottom) {
    velocity.setVerticalConstantVelocity(0)
  } else {
    pos.updateCoords((coords) => (coords.y += 1))
    // TODO: handle clearing riding status for more than just downward riding
    if (!dueToRiding) coral.world.remove(entity, [Riding])

    // Also try to move any entities riding on this one.
    coral.world.getCollected(entity, Riding)?.forEach((ridingEntity) => {
      const ridingVelocity = coral.world.get(ridingEntity, Velocity)
      const ridingPosition = coral.world.get(ridingEntity, Opal.Position)
      const ridingBlockedBy = coral.world.get(ridingEntity, BlockedBy)
      if (ridingVelocity && ridingPosition) {
        if (ridingBlockedBy) {
          const ridingBody = coral.world.get(ridingEntity, Body)
          if (ridingBody) {
            ridingBlockedBy.updateForSubstep(
              coral,
              ridingEntity,
              ridingBody,
              ridingPosition,
            )
          }
        }
        tryMoveDown(
          coral,
          ridingEntity,
          ridingVelocity,
          ridingPosition,
          ridingBlockedBy,
          true,
        )
      }
    })
  }
}

function tryMoveUp(
  coral: Context,
  entity: number,
  velocity: Velocity,
  pos: Opal.Position,
  blockedBy: BlockedBy | undefined,
  dueToRiding = false,
) {
  if (blockedBy?.wasBlockedOnTop) {
    velocity.setVerticalConstantVelocity(0)
  } else {
    // Also try to collect riding status for downward riding
    const canBlock = coral.world.get(entity, _CanBlock)
    if (canBlock) {
      const body = coral.world.get(entity, Body)
      if (body) {
        for (const canBlockEntitySet of canBlock.entitySets) {
          for (const canBlockEntity of canBlockEntitySet) {
            const canBlockBody = coral.world.get(canBlockEntity, Body)
            const canBlockPosition = coral.world.get(
              canBlockEntity,
              Opal.Position,
            )
            if (canBlockBody && canBlockPosition) {
              if (
                canBlockBody.checkSurfaceDownward(
                  coral,
                  canBlockPosition,
                  body,
                  pos,
                )
              ) {
                coral.world.set(entity, [new Riding(canBlockEntity)])
              }
            }
          }
        }
        for (const canBlockEntitySet of canBlock.entitySetsDownwardOnly) {
          for (const canBlockEntity of canBlockEntitySet) {
            const canBlockBody = coral.world.get(canBlockEntity, Body)
            const canBlockPosition = coral.world.get(
              canBlockEntity,
              Opal.Position,
            )
            if (canBlockBody && canBlockPosition) {
              if (
                canBlockBody.checkSurfaceDownward(
                  coral,
                  canBlockPosition,
                  body,
                  pos,
                )
              ) {
                coral.world.set(canBlockEntity, [new Riding(entity)])
              }
            }
          }
        }
      }
    }

    pos.updateCoords((coords) => (coords.y -= 1))
    // TODO: handle clearing riding status for more than just downward riding
    if (!dueToRiding) coral.world.remove(entity, [Riding])

    // Also try to move any entities riding on this one.
    coral.world.getCollected(entity, Riding)?.forEach((ridingEntity) => {
      const ridingVelocity = coral.world.get(ridingEntity, Velocity)
      const ridingPosition = coral.world.get(ridingEntity, Opal.Position)
      const ridingBlockedBy = coral.world.get(ridingEntity, BlockedBy)
      if (ridingVelocity && ridingPosition) {
        if (ridingBlockedBy) {
          const ridingBody = coral.world.get(ridingEntity, Body)
          if (ridingBody) {
            ridingBlockedBy.updateForSubstep(
              coral,
              ridingEntity,
              ridingBody,
              ridingPosition,
            )
          }
        }
        tryMoveUp(
          coral,
          ridingEntity,
          ridingVelocity,
          ridingPosition,
          ridingBlockedBy,
          true,
        )
      }
    })
  }
}
