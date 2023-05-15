import { registerComponent } from "@glass/core"
import { Render } from "./Render"
import { ColorPalette } from "./ColorPalette"
import { SpriteAnimation } from "./Sprite"
import { Texture } from "./Texture"
import { TileMap } from "./TileMap"

export class Context {
  static readonly componentId = registerComponent(this)

  colorPalettes = new Map<string, ColorPalette>()
  textures = new Map<string, Texture>()
  tileMaps = new Map<string, TileMap>()
  animations = new Map<string, SpriteAnimation>()
  constructor(public render: Render) {}
}
