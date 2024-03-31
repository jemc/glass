import { Vector2, ReadVector2, MutableVector2 } from "./Vector2"

abstract class BaseBox2 {
  constructor(
    readonly center: ReadVector2,
    readonly radii: ReadVector2,
  ) {}

  isEqualTo(other: ReadBox2) {
    return (
      this.center.isEqualTo(other.center) && this.radii.isEqualTo(other.radii)
    )
  }

  doesContain(point: ReadVector2) {
    if (Math.abs(point.x - this.center.x) > this.radii.x) return false
    if (Math.abs(point.y - this.center.y) > this.radii.y) return false

    return true
  }

  get x() {
    return this.center.x
  }

  get y() {
    return this.center.y
  }

  get x0() {
    return this.center.x - this.radii.x
  }

  get y0() {
    return this.center.y - this.radii.y
  }

  get x1() {
    return this.center.x + this.radii.x
  }

  get y1() {
    return this.center.y + this.radii.y
  }

  get width() {
    return this.radii.x + this.radii.x
  }

  get height() {
    return this.radii.y + this.radii.y
  }
}

export type ReadBox2 = Omit<BaseBox2, "">

export class Box2 extends BaseBox2 {
  constructor(
    readonly center = new Vector2(),
    readonly radii = new Vector2(),
  ) {
    super(center, radii)
  }

  static fromLeftTopWidthHeight(
    left: number,
    top: number,
    width: number,
    height: number,
  ) {
    const radii = new Vector2(width / 2, height / 2)
    return new Box2(new Vector2(left + radii.x, top + radii.y), radii)
  }

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

export class MutableBox2 extends BaseBox2 {
  constructor(
    public center = new MutableVector2(),
    public radii = new MutableVector2(),
  ) {
    super(center, radii)
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

  copyFrom(other: ReadBox2) {
    this.center.copyFrom(other.center)
    this.radii.copyFrom(other.radii)
    return this
  }
}
