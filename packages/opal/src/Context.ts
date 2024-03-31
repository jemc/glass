import { registerComponent } from "@glass/core"
import { Render } from "./Render"
import { ColorPalette } from "./ColorPalette"
import { SpriteAnimation } from "./Sprite"
import { Texture } from "./Texture"
import { TileMap } from "./TileMap"
import { SpriteRendering } from "./SpriteRendering"
import { TileMapShader } from "./TileMapShader"

const allContexts = new Set<Context>()

export class Context {
  static readonly componentId = registerComponent(this)

  readonly colorPalettes = new Map<string, ColorPalette>()
  readonly textures = new Map<string, Texture>()
  readonly tileMaps = new Map<string, TileMap>()
  readonly animations = new Map<string, SpriteAnimation>()

  readonly _spriteRendering: SpriteRendering
  readonly _tileMapShader: TileMapShader

  constructor(readonly render: Render) {
    this._spriteRendering = new SpriteRendering(this.render, 1000) // TODO: which number is most appropriate?
    this._tileMapShader = new TileMapShader(this.render)

    allContexts.add(this)
  }
  static forEach(callback: (context: Context) => void) {
    allContexts.forEach(callback)
  }
}
