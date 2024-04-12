import { registerComponent, MutableBox2 } from "@glass/core"

export class Bounds {
  static readonly componentId = registerComponent(this)

  private box = new MutableBox2()
  constructor(
    width: number = 0,
    height: number = 0,
    offsetX: number = 0,
    offsetY: number = 0,
  ) {
    this.box.radii.setTo(width, height).scaleEquals(0.5)
    this.box.center.setTo(offsetX, offsetY)
  }

  update(
    width: number = 0,
    height: number = 0,
    offsetX: number = 0,
    offsetY: number = 0,
  ) {
    this.box.radii.setTo(width, height).scaleEquals(0.5)
    this.box.center.setTo(offsetX, offsetY)
  }

  get width() {
    return this.box.width
  }
  get height() {
    return this.box.height
  }
  get radii() {
    return this.box.radii
  }
  get offset() {
    return this.box.center
  }
  get offsetX() {
    return this.box.x
  }
  get offsetY() {
    return this.box.y
  }
  get relativeX0() {
    return this.box.x0
  }
  get relativeX1() {
    return this.box.x1
  }
  get relativeY0() {
    return this.box.y0
  }
  get relativeY1() {
    return this.box.y1
  }
}
