import { World, registerComponent } from "@glass/core"
import { Context } from "./Context"
import { TileMap } from "./TileMap"
import { LoadAsepriteAsset } from "./LoadAsepriteAsset"

export class LoadTileMapAsset extends LoadAsepriteAsset {
  static readonly componentId = registerComponent(this)
}

export const LoadTileMapAssetsSystem = (world: World) =>
  world.systemFor([Context, LoadTileMapAsset], {
    runEach(entity, context, asset) {
      const ase = asset.result
      if (!ase) return
      world.destroy(entity)

      context.tileMaps.set(asset.url, new TileMap(asset.url, ase))
    },
  })
