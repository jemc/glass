import {
  registerComponent,
  MutableVector2,
  ReadVector2,
  World,
} from "@glass/core"

export class Position {
  static readonly componentId = registerComponent(this)

  coords: MutableVector2
  direction: MutableVector2

  constructor(x: number, y: number, xdir: number = 1, ydir: number = 1) {
    this.coords = new MutableVector2(x, y)
    this.direction = new MutableVector2(xdir, ydir)
  }

  clone(): Position {
    const clone = new Position(this.coords.x, this.coords.y)
    clone.direction.copyFrom(this.direction)
    return clone
  }
}

export class PositionWrapsAtEdges {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly config: {
      readonly center: ReadVector2
      readonly size: ReadVector2
    },
  ) {}
}

export const PositionWrapsAtEdgesSystem = (world: World) =>
  world.systemFor([Position, PositionWrapsAtEdges], {
    runEach(entity, position, positionWrapsAtEdges) {
      const { center, size } = positionWrapsAtEdges.config
      const { coords } = position
      const halfWidth = size.x / 2
      const halfHeight = size.y / 2

      while (coords.x < center.x - halfWidth) coords.x += size.x
      while (coords.x > center.x + halfWidth) coords.x -= size.x
      while (coords.y < center.y - halfHeight) coords.y += size.y
      while (coords.y > center.y + halfHeight) coords.y -= size.y
    },
  })
