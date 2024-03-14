import {
  registerComponent,
  prerequisiteComponents,
  World,
  Vector2,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"
import { Direction } from "./Direction"

// A Walker component is attached to anything that moves by walking
// from tile to tile in a 2-dimensional tile map.

export class Walker {
  static readonly componentId = registerComponent(this)
  static readonly prerequisiteComponentIds = prerequisiteComponents(
    Context,
    Opal.Position,
  )

  constructor(
    public context: Context,
    readonly config: WalkerConfig,
  ) {}
  wantsToGo?: Direction
  lastDirection = Direction.Down
}

export interface WalkerConfig {
  // How many frames it takes to move from one tile to the next tile.
  // Reducing this number increases the movement speed.
  framesPerStep: number
}

// The Walking component is attached to anything that is currently walking
// within a 2-dimensional tile map.
export class Walking {
  static readonly componentId = registerComponent(this)
  static readonly prerequisiteComponentIds = prerequisiteComponents(
    Context,
    Walker,
  )

  stepVector: Vector2
  constructor(
    public direction: Direction,
    public stepSize: number,
    public initialPosition: Vector2,
    public framesRemaining: number,
  ) {
    this.stepVector = new Vector2(
      this.directionVectorX * stepSize,
      this.directionVectorY * stepSize,
    )
  }

  get directionVectorX(): number {
    if (this.direction === Direction.Left) return -1
    if (this.direction === Direction.Right) return 1
    return 0
  }

  get directionVectorY(): number {
    if (this.direction === Direction.Up) return -1
    if (this.direction === Direction.Down) return 1
    return 0
  }
}

export const WalkSystem = (world: World) =>
  world.systemFor([Walker, Opal.Position], {
    runEach: (entity, walker, position) => {
      const { tileSize } = walker.context.config

      // The entity may or may not currently be walking.
      let walking = world.get(entity, Walking)

      // If the entity is already walking but ready to finish, stop walking.
      if (walking && walking.framesRemaining <= 0) {
        world.remove(entity, [Walking])
        walking = undefined
      }

      // Start walking if the entity isn't walking but wants to start.
      if (!walking && walker.wantsToGo) {
        const direction = walker.wantsToGo
        walker.lastDirection = direction
        world.set(entity, [
          new Walking(
            direction,
            tileSize,
            position.coords.clone(),
            walker.config.framesPerStep,
          ),
        ])
      }

      // If the entity is still walking, update its progress and position.
      if (walking) {
        const framesRemaining = (walking.framesRemaining -= 1)
        const progress =
          1 - framesRemaining / (walker.config.framesPerStep || 1)

        const { stepVector, initialPosition } = walking
        position.updateCoords((coords) => {
          coords
            .copyFrom(stepVector)
            .scaleEquals(progress)
            .plusEquals(initialPosition)
            .toFloor()
        })
      }
    },
  })
