import { TextureSurface } from "./TextureSurface"

export class TextureSurfaceDrawable extends TextureSurface {
  framebuffer: WebGLFramebuffer
  renderbuffer: WebGLRenderbuffer

  constructor(...args: ConstructorParameters<typeof TextureSurface>) {
    const render = args[0]
    super(...args)
    this.framebuffer = render.createFramebuffer()
    this.renderbuffer = render.createRenderbuffer()
  }

  drawToSurface(callback: () => void) {
    this.render.gl.bindFramebuffer(
      WebGLRenderingContext.FRAMEBUFFER,
      this.framebuffer,
    )
    this.render.gl.bindRenderbuffer(
      WebGLRenderingContext.RENDERBUFFER,
      this.renderbuffer,
    )
    if (
      this.width != (this.renderbuffer as any).width ||
      this.height != (this.renderbuffer as any).height
    ) {
      ;(this.renderbuffer as any).width = this.width
      ;(this.renderbuffer as any).height = this.height
      this.render.gl.renderbufferStorage(
        WebGLRenderingContext.RENDERBUFFER,
        WebGLRenderingContext.DEPTH_COMPONENT16,
        this.width,
        this.height,
      )
      this.render.gl.framebufferTexture2D(
        WebGLRenderingContext.FRAMEBUFFER,
        WebGLRenderingContext.COLOR_ATTACHMENT0,
        WebGLRenderingContext.TEXTURE_2D,
        this.glTexture,
        0,
      )
      this.render.gl.framebufferRenderbuffer(
        WebGLRenderingContext.FRAMEBUFFER,
        WebGLRenderingContext.DEPTH_ATTACHMENT,
        WebGLRenderingContext.RENDERBUFFER,
        this.renderbuffer,
      )
    }

    const prevViewport = this.render.glViewport
    this.render.glViewport = new Int32Array([0, 0, this.width, this.height])

    callback()

    this.render.glViewport = prevViewport
    this.render.gl.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null)
    this.render.gl.bindRenderbuffer(WebGLRenderingContext.RENDERBUFFER, null)
  }
}
