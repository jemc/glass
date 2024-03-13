import { toDegrees, toRadians } from "./Maths"

abstract class BaseVector2 {
  constructor(
    readonly x = 0,
    readonly y = 0,
  ) {}

  isEqualTo(other: ReadVector2) {
    return this.x === other.x && this.y === other.y
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y)
  }

  cloneMutable(): MutableVector2 {
    return new MutableVector2(this.x, this.y)
  }

  magnitude(): number {
    return Math.sqrt(this.magnitudeSquared())
  }

  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y
  }

  dot(other: ReadVector2): number {
    return this.x * other.x + this.y * other.y
  }

  cross(other: ReadVector2): number {
    return this.x * other.y - this.y * other.x
  }

  plus(other: ReadVector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y)
  }

  minus(other: ReadVector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y)
  }

  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar)
  }
}

export type ReadVector2 = Omit<Vector2, "__preventTypeConfusion">

export class Vector2 extends BaseVector2 {
  // This method prevents TypeScript from allowing the mutable variant to be
  // subsumed into the immutable variant, as they return different types here.
  // This is essentially a hack that forces a kind of nominal typing.
  //
  // If someone tries to subsume it, they'll get a helpful error hint like this:
  //   The types returned by '__preventTypeConfusion()' are incompatible between these types.
  //     Type '"mutable"' is not assignable to type '"immutable"'.
  __preventTypeConfusion(): "immutable" {
    return "immutable"
  }
}

export class MutableVector2 extends BaseVector2 {
  constructor(
    public x = 0,
    public y = 0,
  ) {
    super(x, y)
  }

  // This method prevents TypeScript from allowing the mutable variant to be
  // subsumed into the immutable variant, as they return different types here.
  // This is essentially a hack that forces a kind of nominal typing.
  //
  // If someone tries to subsume it, they'll get a helpful error hint like this:
  //   The types returned by '__preventTypeConfusion()' are incompatible between these types.
  //     Type '"mutable"' is not assignable to type '"immutable"'.
  __preventTypeConfusion(): "mutable" {
    return "mutable"
  }

  setTo(x: number, y: number) {
    this.x = x
    this.y = y
    return this
  }

  copyFrom(v: ReadVector2) {
    this.x = v.x
    this.y = v.y
    return this
  }

  setUnitRotationRadians(radians: number) {
    this.x = Math.cos(radians)
    this.y = Math.sin(radians)
    return this
  }

  getUnitRotationRadians() {
    return Math.atan2(this.y, this.x)
  }

  setUnitRotationDegrees(degrees: number) {
    this.setUnitRotationRadians(toRadians(degrees))
    return this
  }

  getUnitRotationDegrees() {
    return toDegrees(this.getUnitRotationRadians())
  }

  toFloor() {
    this.x = Math.floor(this.x)
    this.y = Math.floor(this.y)
    return this
  }

  toRoundedCapturingResiduals(residuals: MutableVector2) {
    const { x, y } = this
    this.x = Math.round(x)
    this.y = Math.round(y)
    residuals.x = x - this.x
    residuals.y = y - this.y
    return this
  }

  plusEquals(other: ReadVector2) {
    this.x += other.x
    this.y += other.y
    return this
  }

  plusScalarEquals(scalar: number) {
    this.x += scalar
    this.y += scalar
    return this
  }

  minusEquals(other: ReadVector2) {
    this.x -= other.x
    this.y -= other.y
    return this
  }

  minusScalarEquals(scalar: number) {
    this.x -= scalar
    this.y -= scalar
    return this
  }

  multiplyEquals(other: ReadVector2) {
    this.x *= other.x
    this.y *= other.y
    return this
  }

  scaleEquals(scalar: number) {
    this.x *= scalar
    this.y *= scalar
    return this
  }

  inverseScaleEquals(scalar: number) {
    this.x /= scalar
    this.y /= scalar
    return this
  }

  plusScaledEquals(other: ReadVector2, scalar: number) {
    this.x += other.x * scalar
    this.y += other.y * scalar
    return this
  }
}
