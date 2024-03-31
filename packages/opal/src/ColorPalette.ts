import Aseprite from "ase-parser"
import { Render } from "./Render"
import { TextureSurface } from "./TextureSurface"

export class ColorPalette {
  private _render: Render
  private _colors: ReadonlyArray<Aseprite.Color>
  private _surface: TextureSurface

  get surface() {
    return this._surface
  }

  get colors() {
    return this._colors
  }

  set colors(colors: ReadonlyArray<Aseprite.Color>) {
    this._colors = colors
    this._surface = surfaceFromColors(this._render, colors)
  }

  constructor(render: Render, colors: Aseprite.Color[]) {
    this._render = render
    this._colors = colors
    this._surface = surfaceFromColors(render, colors)
  }
}

function surfaceFromColors(
  render: Render,
  colors: ReadonlyArray<Aseprite.Color>,
): TextureSurface {
  const imageData = new ImageData(256, 1)
  colors.forEach((color, index) => {
    imageData.data[index * 4 + 0] = color.red
    imageData.data[index * 4 + 1] = color.green
    imageData.data[index * 4 + 2] = color.blue
    imageData.data[index * 4 + 3] = color.alpha
  })

  return TextureSurface.fromImage(render, imageData)
}
