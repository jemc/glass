import { System, World } from "@glass/core"
import { Context } from "./Context"

export const RenderBeginSystem = (world: World) => {
  return System.for([Context], {
    shouldMatchAll: [Context],

    run() {
      Context.forEach((context) => {
        context.render.gl.clearColor(0, 0, 0, 1)
        context.render.gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT)
        context.render.gl.colorMask(true, true, true, true)
        context.render.gl.blendFunc(
          WebGLRenderingContext.SRC_ALPHA,
          WebGLRenderingContext.ONE_MINUS_SRC_ALPHA,
        )
      })
    },
  })
}
