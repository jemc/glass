import { ReadVector2 } from "@glass/core"
import { Render } from "./Render"
import { Shader } from "./Shader"

import vertexShader from "./TileMapShader.vert.glsl"
import fragmentShader from "./TileMapShader.frag.glsl"
import { TextureSurface } from "./TextureSurface"

export class TileMapShader extends Shader<
  // Attributes
  "position" | "texture",
  // Uniforms
  | "viewportSize"
  | "tileSize"
  | "inverseTileSize"
  | "tileSet"
  | "tileData"
  | "viewOffset"
  | "inverseTileSetSize"
  | "inverseTileDataSize"
> {
  private quadXYUVBuffer: WebGLBuffer

  constructor(render: Render) {
    super(render, vertexShader, fragmentShader)
    this.quadXYUVBuffer = render.createQuadXYUVBuffer()
  }

  drawTilesToDrawSurface(
    render: Render,
    opts: {
      tileSetSurface: { glTexture: WebGLTexture }
      tileDataSurface: { glTexture: WebGLTexture }
      tileSize: Float32Array
      inverseTileSize: Float32Array
      inverseTileSetSize: Float32Array
      inverseTileDataSize: Float32Array
      snappedPosition: ReadVector2
      drawSurface: TextureSurface
    },
  ) {
    const { gl } = render
    const {
      tileSetSurface,
      tileDataSurface,
      tileSize,
      inverseTileSize,
      inverseTileSetSize,
      inverseTileDataSize,
      snappedPosition,
      drawSurface: drawSurface,
    } = opts

    // Temporarily disable depth testing.
    const origDepthTest = gl.isEnabled(gl.DEPTH_TEST)
    gl.disable(gl.DEPTH_TEST)

    // Reset some state.
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.colorMask(true, true, true, true)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Use the tile map shader program.
    gl.useProgram(this.program)

    // The shader uses the tile size to knows what stride to use.
    gl.uniform2fv(this.uniform.tileSize, tileSize)
    gl.uniform2fv(this.uniform.inverseTileSize, inverseTileSize)

    // The shader uses the tile sheet by sampling tiles in it, by tile id.
    gl.uniform1i(this.uniform.tileSet, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, tileSetSurface.glTexture)
    gl.uniform2fv(this.uniform.inverseTileSetSize, inverseTileSetSize)

    // The shader uses the tile data by sampling tile ids from it.
    gl.uniform1i(this.uniform.tileData, 1)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, tileDataSurface.glTexture)
    gl.uniform2fv(this.uniform.inverseTileDataSize, inverseTileDataSize)

    // The shader uses the viewport size to know how much space to render.
    gl.uniform2f(
      this.uniform.viewportSize,
      drawSurface.width,
      drawSurface.height,
    )

    gl.uniform2f(
      this.uniform.viewOffset, // TODO: unify names and document this.
      snappedPosition.x,
      snappedPosition.y,
    )

    // Draw the single quad, which renders all the tiles in the tile map
    // that are visible within the current viewport.
    // The shader will place the tiles within the texture of the quad.
    render.bindQuadXYUVBuffer(this.quadXYUVBuffer, this.attribute)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    // Re-enable depth testing (if it was enabled before).
    if (origDepthTest) gl.enable(gl.DEPTH_TEST)
  }
}
