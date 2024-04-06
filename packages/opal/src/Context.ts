import {
  Component,
  Phase,
  SystemContext,
  World,
  registerComponent,
} from "@glass/core"
import { Agate } from "@glass/agate"
import { Render, RenderOptions } from "./Render"
import { ColorPalette } from "./ColorPalette"
import { SpriteAnimation } from "./Sprite"
import { Texture } from "./Texture"
import { TileMap } from "./TileMap"
import { SpriteRendering } from "./SpriteRendering"
import { TileMapShader } from "./TileMapShader"
import {
  LoadSpriteSheetAssetsSystem,
  LoadTileMapAssetsSystem,
  LoadTileMapSlicesSystem,
  PositionWrapsAtEdgesSystem,
  SpriteSetFromStatusSystem,
  SpriteAnimationSystem,
  AnimatePositionSystem,
  ColorPaletteAnimationSystem,
  RenderBeginSystem,
  RenderRenderablesSystem,
  RenderTileMapSystem,
} from "."

export class Context extends SystemContext {
  static readonly componentId = registerComponent(this)

  readonly colorPalettes = new Map<string, ColorPalette>()
  readonly textures = new Map<string, Texture>()
  readonly tileMaps = new Map<string, TileMap>()
  readonly animations = new Map<string, SpriteAnimation>()

  readonly _spriteRendering: SpriteRendering
  readonly _tileMapShader: TileMapShader

  readonly world: World = this.agate.world
  readonly render: Render

  constructor(
    readonly agate: Agate.Context,
    opts: RenderOptions,
  ) {
    super()

    this.render = new Render(opts)

    this._spriteRendering = new SpriteRendering(this.render, 1000) // TODO: which number is most appropriate?
    this._tileMapShader = new TileMapShader(this.render)

    this.world.addSystem(Phase.Load, LoadSpriteSheetAssetsSystem, this)
    this.world.addSystem(Phase.Load, LoadTileMapAssetsSystem, this)
    this.world.addSystem(Phase.Load, LoadTileMapSlicesSystem, this)

    this.world.addSystem(Phase.Correction, PositionWrapsAtEdgesSystem, this)

    this.world.addSystem(Phase.PreRender, SpriteSetFromStatusSystem, this)
    this.world.addSystem(Phase.PreRender, SpriteAnimationSystem, this)
    this.world.addSystem(Phase.PreRender, AnimatePositionSystem, this)
    this.world.addSystem(Phase.PreRender, ColorPaletteAnimationSystem, this)

    this.world.addSystem(Phase.Render, RenderBeginSystem, this)
    this.world.addSystem(Phase.Render, RenderRenderablesSystem, this)
    this.world.addSystem(Phase.Render, RenderTileMapSystem, this)
  }

  create(...components: Component[]): number {
    return this.world.create(this.agate, this, ...components)
  }
}
