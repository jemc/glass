import { Shader } from "./Shader"
import { Render } from "./Render"
import { TextureSurface } from "./TextureSurface"
import { Renderable } from "./Renderable"
import vertexShader from "./SpriteShader.vert.glsl"
import fragmentShader from "./SpriteShader.frag.glsl"
import fragmentShaderIndexedColor from "./SpriteShaderIndexedColor.frag.glsl"
import { ColorPalette } from "./ColorPalette"

type OurShader = Shader<
  // Attributes
  "position" | "textureUV" | "alpha",
  // Uniforms
  "projectionVector" | "spriteSheet" | "colorPalette"
>

export class SpriteRendering {
  private shader: OurShader
  private shaderIndexedColor: OurShader
  private spriteCount = 0

  private dataBuffer: WebGLBuffer
  private data = new Float32Array()

  private indicesBuffer: WebGLBuffer
  private indices = new Uint16Array()

  private currentBatchSize = 0
  private currentBatchSurface: TextureSurface | undefined = undefined
  private currentBatchPalette: ColorPalette | undefined = undefined

  constructor(render: Render, initialSpriteCount = 1000) {
    this.shader = new Shader(render, vertexShader, fragmentShader)
    this.shaderIndexedColor = new Shader(
      render,
      vertexShader,
      fragmentShaderIndexedColor,
    )

    this.dataBuffer = render.createBuffer()
    this.indicesBuffer = render.createBuffer()

    this.resizeForMaxCount(render, initialSpriteCount)
  }

  static readonly VERTEX_DATA_POSITION_BYTE_OFFSET = 0
  static readonly VERTEX_DATA_TEXTURE_UV_BYTE_OFFSET = 12
  static readonly VERTEX_DATA_COLOR_BYTE_OFFSET = 20
  static readonly VERTEX_DATA_BYTES = 24

  resizeForMaxCount(render: Render, count: number) {
    if (this.spriteCount === count) return
    this.spriteCount = count

    const { ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, DYNAMIC_DRAW, STATIC_DRAW } =
      WebGLRenderingContext

    this.data = new Float32Array(count * SpriteRendering.VERTEX_DATA_BYTES)
    render.gl.bindBuffer(ARRAY_BUFFER, this.dataBuffer)
    render.gl.bufferData(ARRAY_BUFFER, this.data, DYNAMIC_DRAW)

    this.indices = new Uint16Array(count * 6)
    for (let i = 0; i < count; i++) {
      const useIndex = i * 6
      const dataIndex = i * 4

      this.indices[useIndex + 0] = dataIndex + 0 // upper-left
      this.indices[useIndex + 1] = dataIndex + 1 // upper-right
      this.indices[useIndex + 2] = dataIndex + 2 // lower-right

      this.indices[useIndex + 3] = dataIndex + 0 // upper-left
      this.indices[useIndex + 4] = dataIndex + 2 // lower-right
      this.indices[useIndex + 5] = dataIndex + 3 // lower-left
    }

    render.gl.bindBuffer(ELEMENT_ARRAY_BUFFER, this.indicesBuffer)
    render.gl.bufferData(ELEMENT_ARRAY_BUFFER, this.indices, STATIC_DRAW)
  }

  beginRender(render: Render) {
    this.currentBatchSize = 0
    this.currentBatchSurface = undefined
  }

  addSpriteToRender(render: Render, sprite: Renderable) {
    const { visible, texture } = sprite
    if (!visible || !texture) return

    if (texture.surface !== this.currentBatchSurface) {
      this.drawBatch(render)

      const shader = texture.colorPalette
        ? this.shaderIndexedColor
        : this.shader
      render.gl.useProgram(shader.program)
      render.gl.uniform2f(
        shader.uniform.projectionVector,
        render.width / 2,
        render.height / 2,
      )

      this.currentBatchSize = 0
      this.currentBatchSurface = texture.surface
      this.currentBatchPalette = texture.colorPalette
    }

    // TODO: If this.currentBatchSize is larger than the buffer, resize the buffer.

    if (
      this.writeVerticesFor(
        sprite,
        this.currentBatchSize * SpriteRendering.VERTEX_DATA_BYTES,
      )
    )
      this.currentBatchSize++
  }

  finishRender(render: Render) {
    this.drawBatch(render)
  }

  private writeVerticesFor(sprite: Renderable, startIndex: number): boolean {
    const { texture } = sprite
    if (!texture) return false

    const { worldTransformedUpperLeft, worldTransformedLowerRight } = sprite
    const x0 = worldTransformedUpperLeft.x
    const y0 = worldTransformedUpperLeft.y
    const x1 = worldTransformedLowerRight.x
    const y1 = worldTransformedLowerRight.y

    this.data[startIndex + 0] = x0
    this.data[startIndex + 1] = y0
    this.data[startIndex + 2] = sprite.depth
    this.data[startIndex + 3] = texture.uvs[0]!
    this.data[startIndex + 4] = texture.uvs[1]!
    this.data[startIndex + 5] = sprite.worldAlpha

    this.data[startIndex + 6] = x1
    this.data[startIndex + 7] = y0
    this.data[startIndex + 8] = sprite.depth
    this.data[startIndex + 9] = texture.uvs[2]!
    this.data[startIndex + 10] = texture.uvs[3]!
    this.data[startIndex + 11] = sprite.worldAlpha

    this.data[startIndex + 12] = x1
    this.data[startIndex + 13] = y1
    this.data[startIndex + 14] = sprite.depth
    this.data[startIndex + 15] = texture.uvs[4]!
    this.data[startIndex + 16] = texture.uvs[5]!
    this.data[startIndex + 17] = sprite.worldAlpha

    this.data[startIndex + 18] = x0
    this.data[startIndex + 19] = y1
    this.data[startIndex + 20] = sprite.depth
    this.data[startIndex + 21] = texture.uvs[6]!
    this.data[startIndex + 22] = texture.uvs[7]!
    this.data[startIndex + 23] = sprite.worldAlpha

    return true
  }

  private drawBatch(render: Render) {
    const surface = this.currentBatchSurface
    const palette = this.currentBatchPalette
    const count = this.currentBatchSize
    if (!surface || !count) return

    const {
      ARRAY_BUFFER,
      DYNAMIC_DRAW,
      FLOAT,
      TEXTURE0,
      TEXTURE1,
      TEXTURE_2D,
      TRIANGLES,
      UNSIGNED_SHORT,
    } = WebGLRenderingContext

    const shader = palette ? this.shaderIndexedColor : this.shader
    // const shader = this.shader

    render.gl.useProgram(shader.program)

    render.gl.bindBuffer(ARRAY_BUFFER, this.dataBuffer)
    render.gl.bufferData(ARRAY_BUFFER, this.data, DYNAMIC_DRAW)

    render.gl.enableVertexAttribArray(shader.attribute.position)
    render.gl.vertexAttribPointer(
      shader.attribute.position,
      3,
      FLOAT,
      false,
      SpriteRendering.VERTEX_DATA_BYTES,
      SpriteRendering.VERTEX_DATA_POSITION_BYTE_OFFSET,
    )
    render.gl.enableVertexAttribArray(shader.attribute.textureUV)
    render.gl.vertexAttribPointer(
      shader.attribute.textureUV,
      2,
      FLOAT,
      false,
      SpriteRendering.VERTEX_DATA_BYTES,
      SpriteRendering.VERTEX_DATA_TEXTURE_UV_BYTE_OFFSET,
    )
    render.gl.enableVertexAttribArray(shader.attribute.alpha)
    render.gl.vertexAttribPointer(
      shader.attribute.alpha,
      1,
      FLOAT,
      false,
      SpriteRendering.VERTEX_DATA_BYTES,
      SpriteRendering.VERTEX_DATA_COLOR_BYTE_OFFSET,
    )

    // Bind the texture for the sprite sheet.
    render.gl.uniform1i(shader.uniform.spriteSheet, 0)
    render.gl.activeTexture(TEXTURE0)
    render.gl.bindTexture(TEXTURE_2D, surface.glTexture)

    // Bind the texture for the indexed color palette (if applicable).
    if (palette) {
      render.gl.uniform1i(shader.uniform.colorPalette, 1)
      render.gl.activeTexture(TEXTURE1)
      render.gl.bindTexture(render.gl.TEXTURE_2D, palette.surface.glTexture)
    }

    render.gl.drawElements(TRIANGLES, count * 6, UNSIGNED_SHORT, 0)
  }
}
