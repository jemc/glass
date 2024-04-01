import { Vector2 } from "@glass/core"

export class Render {
  readonly gl: WebGL2RenderingContext // TODO: private

  readonly size: Vector2

  get width() {
    return this.size.x
  }

  get height() {
    return this.size.y
  }

  constructor(
    canvas: HTMLCanvasElement,
    attrs: WebGLContextAttributes & {
      width?: number
      height?: number
      magnify?: number
    } = {},
  ) {
    attrs.alpha ??= false
    attrs.width ??= 256 // NES Resolution
    attrs.height ??= 240 // NES Resolution
    attrs.magnify ??= 1

    canvas.width = attrs.width
    canvas.height = attrs.height
    canvas.style.width = `${attrs.width * attrs.magnify}px`
    canvas.style.height = `${attrs.height * attrs.magnify}px`
    canvas.style.imageRendering = "pixelated"

    const gl = canvas.getContext("webgl2", attrs) ?? undefined
    if (!gl) throw new Error("Failed to initialize a WebGL2 context")
    this.gl = gl

    this.size = new Vector2(canvas.width, canvas.height)

    this.gl.viewport(0, 0, this.width, this.height)
    this.gl.scissor(0, 0, this.width, this.height)
    this.gl.depthRange(0, 1) // TODO: make this range bigger?
    this.gl.enable(gl.DEPTH_TEST)
    this.gl.disable(gl.CULL_FACE) // TODO: enable after fixing vertex order
    this.gl.enable(gl.BLEND)
  }

  get glViewport() {
    return this.gl.getParameter(this.gl.VIEWPORT) as Int32Array
  }

  set glViewport(value: Int32Array) {
    this.gl.viewport(value[0] ?? 0, value[1] ?? 0, value[2] ?? 0, value[3] ?? 0)
  }

  createBuffer() {
    const buffer = this.gl.createBuffer()
    if (!buffer) throw new Error("Failed to create a WebGL2 buffer")

    return buffer
  }

  createTexture() {
    const texture = this.gl.createTexture()
    if (!texture) throw new Error("Failed to create a WebGL2 texture")

    return texture
  }

  createFramebuffer() {
    const buffer = this.gl.createFramebuffer()
    if (!buffer) throw new Error("Failed to create a WebGL2 framebuffer")

    return buffer
  }

  createRenderbuffer() {
    const buffer = this.gl.createRenderbuffer()
    if (!buffer) throw new Error("Failed to create a WebGL2 renderbuffer")

    return buffer
  }

  private createShader(shaderType: number, source: string) {
    const shader = this.gl.createShader(shaderType)
    if (!shader)
      throw new Error(`Failed to create a shader of type: ${shaderType}`)

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(
        this.gl.getShaderInfoLog(shader) ??
          `Failed to compile a shader from source: ${source}`,
      )
    }

    return shader
  }

  createVertexShader(source: string) {
    return this.createShader(this.gl.VERTEX_SHADER, source)
  }

  createFragmentShader(source: string) {
    return this.createShader(this.gl.FRAGMENT_SHADER, source)
  }

  // prettier-ignore
  private static quadXYUV = new Float32Array([
    // Triangle 1
    -1, 1, 0, 1, // X, Y, U, V for top-left
    1, 1, 1, 1,  // X, Y, U, V for top-right
    1, -1, 1, 0,   // X, Y, U, V for bottom-right
    // Triangle 2
    -1, 1, 0, 1, // X, Y, U, V for top-left
    1, -1, 1, 0,   // X, Y, U, V for bottom-right
    -1, -1, 0, 0,  // X, Y, U, V for bottom-left
  ])

  createQuadXYUVBuffer() {
    const { ARRAY_BUFFER, STATIC_DRAW } = this.gl
    const buffer = this.createBuffer()
    this.gl.bindBuffer(ARRAY_BUFFER, buffer)
    this.gl.bufferData(ARRAY_BUFFER, Render.quadXYUV, STATIC_DRAW)
    return buffer
  }

  bindQuadXYUVBuffer(
    buffer: WebGLBuffer,
    attributes: {
      position: number
      texture: number
    },
  ) {
    const { gl } = this
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(attributes.position)
    gl.enableVertexAttribArray(attributes.texture)
    gl.vertexAttribPointer(attributes.position, 2, gl.FLOAT, false, 16, 0)
    gl.vertexAttribPointer(attributes.texture, 2, gl.FLOAT, false, 16, 8)
  }
}
