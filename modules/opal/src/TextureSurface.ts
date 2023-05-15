import { Vector2, isPowerOfTwo, Uint32Array2D } from "@glass/core"
import { Render } from "./Render"

export class TextureSurface {
  glTexture: WebGLTexture

  static readonly ColorModeRGBA = WebGLRenderingContext.RGBA
  static readonly ColorModeIndexed = WebGLRenderingContext.LUMINANCE

  get width() {
    return this.size.x
  }

  get height() {
    return this.size.y
  }

  constructor(
    protected render: Render,
    readonly size: Vector2,
    pixels?: Uint32Array2D,
    colorMode: number = TextureSurface.ColorModeRGBA,
  ) {
    const { gl } = this.render
    this.glTexture = this.render.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.glTexture)

    if (pixels) {
      // If the pixels have an offset, we need to clone them without that,
      // and adjust the size accordingly.
      if (pixels.offset.x > 0 || pixels.offset.y > 0) {
        pixels = pixels.cloneWithoutOffset()
        this.size = pixels.size
      }
    }

    // Use nearest neighbor sampling for true pixel fidelity.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)

    // Set wrapping behavior for each dimension based on whether or not the
    // size for that dimension is a power of two.
    if (isPowerOfTwo(this.size.x)) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    }
    if (isPowerOfTwo(this.size.y)) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      colorMode,
      this.width,
      this.height,
      0,
      colorMode,
      gl.UNSIGNED_BYTE,
      pixels?.rawBytes ?? null,
    )
  }

  static fromImage(render: Render, imageData: ImageData) {
    const { gl } = render
    const colorMode = this.ColorModeRGBA
    const size = new Vector2(imageData.width, imageData.height)
    const surface = new TextureSurface(render, size, undefined, colorMode)

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      colorMode,
      colorMode,
      gl.UNSIGNED_BYTE,
      imageData,
    )

    return surface
  }

  static fromIndexedPixels(render: Render, size: Vector2, pixels: Uint8Array) {
    const { gl } = render
    const colorMode = this.ColorModeIndexed
    const surface = new TextureSurface(render, size, undefined, colorMode)

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      colorMode,
      size.x,
      size.y,
      0,
      colorMode,
      gl.UNSIGNED_BYTE,
      pixels,
    )

    return surface
  }
}
