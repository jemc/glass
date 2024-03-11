import {
  Matrix3,
  MutableVector2,
  registerComponent,
  Vector2,
} from "@glass/core"
import { Texture } from "./Texture"
import { Position } from "./Position"

export class Renderable {
  static readonly componentId = registerComponent(this)

  // These two are only applicable for sprites - maybe move to another component?
  texture?: Texture
  pivot = new MutableVector2(0, 0)

  alpha = 1
  depth = 0
  visible = true

  constructor(opts?: { visible?: boolean; depth?: number; alpha?: number }) {
    this.alpha = opts?.alpha ?? 1
    this.depth = opts?.depth ?? 0
    this.visible = opts?.visible ?? true
  }

  private transformUpdatedAt = 0
  private localTransform = Matrix3.create()
  private worldTransform = Matrix3.create()
  worldAlpha = 1 // TODO: private?

  _rotationDegrees = 0
  _rotationComponents = new MutableVector2().setUnitRotationDegrees(0)

  get rotationDegrees(): number {
    return this._rotationDegrees
  }

  set rotationDegrees(degrees: number) {
    this._rotationDegrees = degrees
    this._rotationComponents.setUnitRotationDegrees(degrees)
  }

  updateTransforms(position: Position, parent?: Renderable) {
    Matrix3.setTransformRows(
      this.localTransform,
      position.coords,
      position.direction,
      this._rotationComponents.x,
      this._rotationComponents.y,
    )

    const parentTransform = parent?.worldTransform
    if (parentTransform) {
      Matrix3.multiply(
        this.localTransform,
        parentTransform,
        this.worldTransform,
      )
    } else {
      this.worldTransform.set(this.localTransform)
    }

    this.worldAlpha = this.alpha * (parent?.worldAlpha ?? 1)
  }

  get worldTransformedUpperLeft() {
    return Matrix3.applyToVector2(
      this.worldTransform,
      new Vector2(-this.pivot.x, -this.pivot.y),
    )
  }

  get worldTransformedUpperRight() {
    return Matrix3.applyToVector2(
      this.worldTransform,
      new Vector2((this.texture?.width ?? 0) - this.pivot.x, -this.pivot.y),
    )
  }

  get worldTransformedLowerRight() {
    return Matrix3.applyToVector2(
      this.worldTransform,
      new Vector2(
        (this.texture?.width ?? 0) - this.pivot.x,
        (this.texture?.height ?? 0) - this.pivot.y,
      ),
    )
  }

  get worldTransformedLowerLeft() {
    return Matrix3.applyToVector2(
      this.worldTransform,
      new Vector2(-this.pivot.x, (this.texture?.height ?? 0) - this.pivot.y),
    )
  }
}
