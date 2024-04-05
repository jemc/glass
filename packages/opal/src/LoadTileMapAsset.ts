import { registerComponent, System } from "@glass/core"
import { Context } from "./Context"
import { TileMap } from "./TileMap"
import { LoadAsepriteAsset } from "./LoadAsepriteAsset"

export class LoadTileMapAsset extends LoadAsepriteAsset {
  static readonly componentId = registerComponent(this)
}

export const LoadTileMapAssetsSystem = (opal: Context) =>
  System.for(opal, [LoadTileMapAsset], {
    shouldMatchAll: [LoadTileMapAsset],

    runEach(entity, asset) {
      const ase = asset.result
      if (!ase) return
      opal.world.destroy(entity)

      opal.tileMaps.set(asset.url, new TileMap(asset.url, ase))
    },
  })
