import { System } from "@glass/core"
import { Context } from "./Context"

export const RenderBeginSystem = (opal: Context) => {
  return System.for(opal, [], {
    run() {
      opal.render.gl.clearColor(0, 0, 0, 1)
      opal.render.gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT)
      opal.render.gl.colorMask(true, true, true, true)
      opal.render.gl.blendFunc(
        WebGLRenderingContext.SRC_ALPHA,
        WebGLRenderingContext.ONE_MINUS_SRC_ALPHA,
      )
    },
  })
}
