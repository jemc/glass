import { Vector2, Box2 } from "@glass/core"
import { TextureSurface } from "./TextureSurface"
import { ColorPalette } from "./ColorPalette"

export class Texture<S extends TextureSurface = TextureSurface> {
  uvs = new Float32Array(8)

  get width() {
    return this.frame.width
  }

  get height() {
    return this.frame.height
  }

  constructor(
    readonly name: string,
    readonly frame: Box2,
    readonly pivot: Vector2,
    readonly surface: S,
    readonly colorPalette?: ColorPalette,
  ) {
    const u0 = this.frame.x0 / this.surface.width
    const u1 = this.frame.x1 / this.surface.width
    const v0 = this.frame.y0 / this.surface.height
    const v1 = this.frame.y1 / this.surface.height

    // prettier-ignore
    this.uvs = new Float32Array([
      u0, v0, // Upper-left
      u1, v0, // Upper-right
      u1, v1, // Lower-right
      u0, v1, // Lower-left
    ])
  }
}
