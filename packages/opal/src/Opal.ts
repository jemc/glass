export * from "./AnimatePosition"
export * from "./Context"
export * from "./ColorPalette"
export * from "./ColorPaletteAnimation"
export * from "./LoadAsepriteAsset"
export * from "./LoadSpriteSheetAsset"
export * from "./LoadTileMapAsset"
export * from "./LoadTileMapSlices"
export * from "./Position"
export * from "./Render"
export * from "./Renderable"
export * from "./RenderBeginSystem"
export * from "./RenderRenderablesSystem"
export * from "./RenderTileMap"
export * from "./Shader"
export * from "./Sprite"
export * from "./SpriteSetFromStatus"
export * from "./Texture"
export * from "./TextureSurface"
export * from "./TextureSurfaceDrawable"
export * from "./TileMap"
export * from "./TileMapLayer"
export * from "./TileMapShader"
export * from "./TileMapTileSet"

import { World, Phase } from "@glass/core"
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

export function setup(world: World) {
  world.addSystem(Phase.Load, LoadSpriteSheetAssetsSystem)
  world.addSystem(Phase.Load, LoadTileMapAssetsSystem)
  world.addSystem(Phase.Load, LoadTileMapSlicesSystem)

  world.addSystem(Phase.Correction, PositionWrapsAtEdgesSystem)

  world.addSystem(Phase.PreRender, SpriteSetFromStatusSystem)
  world.addSystem(Phase.PreRender, SpriteAnimationSystem)
  world.addSystem(Phase.PreRender, AnimatePositionSystem)
  world.addSystem(Phase.PreRender, ColorPaletteAnimationSystem)

  world.addSystem(Phase.Render, RenderBeginSystem)
  world.addSystem(Phase.Render, RenderRenderablesSystem)
  world.addSystem(Phase.Render, RenderTileMapSystem)
}
