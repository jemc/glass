import { Render } from "./Render"

export class Shader<A extends string, U extends string> {
  public program: WebGLProgram
  public attribute: { [key in A]: number }
  public uniform: { [key in U]: WebGLUniformLocation }

  constructor(render: Render, vertexSource: string, fragmentSource: string) {
    const { gl } = render
    const vertexShader = render.createVertexShader(vertexSource)
    const fragmentShader = render.createFragmentShader(fragmentSource)

    const program = gl.createProgram()
    if (!program) throw new Error("Failed to create a shader program")

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, WebGLRenderingContext.LINK_STATUS))
      throw new Error("Failed to link a shader program")

    this.program = program
    this.attribute = {} as any
    this.uniform = {} as any

    gl.useProgram(this.program)

    let attributeCount = gl.getProgramParameter(
      program,
      WebGLRenderingContext.ACTIVE_ATTRIBUTES,
    )
    for (let i = 0; i < attributeCount; i++) {
      const attrib = gl.getActiveAttrib(program, i)
      if (attrib)
        this.attribute[attrib.name as A] = gl.getAttribLocation(
          program,
          attrib.name,
        )
    }

    const uniformCount = gl.getProgramParameter(
      program,
      WebGLRenderingContext.ACTIVE_UNIFORMS,
    )
    for (let i = 0; i < uniformCount; i++) {
      const attrib = gl.getActiveUniform(program, i)
      if (attrib) {
        const loc = gl.getUniformLocation(program, attrib.name)
        if (loc) this.uniform[attrib.name as U] = loc
      }
    }
  }
}
