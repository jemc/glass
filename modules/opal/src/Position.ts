import {
  registerComponent,
  MutableVector2,
  ReadVector2,
  World,
  Entity,
  Matrix3,
} from "@glass/core"

export class PositionWithin {
  static readonly componentId = registerComponent(this)

  constructor(readonly collectionEntity: Entity) {}
}

export class Position {
  static readonly componentId = registerComponent(this)

  private _dirty = true
  private _coords: MutableVector2
  private _scale: MutableVector2
  private _transformMatrix = Matrix3.create()

  get x(): number {
    return this._coords.x
  }
  set x(x: number) {
    this._coords.x = x
    this._dirty = true
  }
  get y(): number {
    return this._coords.y
  }
  set y(y: number) {
    this._coords.y = y
    this._dirty = true
  }

  get coords(): ReadVector2 {
    return this._coords
  }
  set coords(coords: ReadVector2) {
    this._coords.copyFrom(coords)
    this._dirty = true
  }
  updateCoords(updater: (coords: MutableVector2) => void) {
    updater(this._coords)
    this._dirty = true
  }

  get scale(): ReadVector2 {
    return this._scale
  }
  set scale(scale: ReadVector2) {
    this._scale.copyFrom(scale)
    this._dirty = true
  }

  private _rotationComponents = new MutableVector2().setUnitRotationDegrees(0)
  get rotationDegrees(): number {
    return this._rotationComponents.getUnitRotationDegrees()
  }
  set rotationDegrees(degrees: number) {
    this._rotationComponents.setUnitRotationDegrees(degrees)
    this._dirty = true
  }
  get rotationRadians(): number {
    return this._rotationComponents.getUnitRotationRadians()
  }
  set rotationRadians(radians: number) {
    this._rotationComponents.setUnitRotationRadians(radians)
    this._dirty = true
  }

  get localTransformMatrix() {
    if (!this._dirty) return this._transformMatrix

    Matrix3.setTransformRows(
      this._transformMatrix,
      this._coords,
      this._scale,
      this._rotationComponents.x,
      this._rotationComponents.y,
    )
    this._dirty = false
    return this._transformMatrix
  }

  constructor(
    x: number,
    y: number,
    xdir: number = 1,
    ydir: number = 1,
    rotationDegrees = 0,
  ) {
    this._coords = new MutableVector2(x, y)
    this._scale = new MutableVector2(xdir, ydir)
    this._rotationComponents = new MutableVector2().setUnitRotationDegrees(
      rotationDegrees,
    )
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
      const halfWidth = size.x / 2
      const halfHeight = size.y / 2

      while (position.x < center.x - halfWidth) position.x += size.x
      while (position.x > center.x + halfWidth) position.x -= size.x
      while (position.y < center.y - halfHeight) position.y += size.y
      while (position.y > center.y + halfHeight) position.y -= size.y
    },
  })
