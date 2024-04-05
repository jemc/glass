import { Context } from "./Context"
import { registerComponent, World, Box2, System } from "@glass/core"

export class LoadTileMapSlices {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly url: string,
    readonly callback: (name: string, box: Box2) => {},
  ) {}
}

export const LoadTileMapSlicesSystem = (opal: Context) =>
  System.for(opal, [LoadTileMapSlices], {
    shouldMatchAll: [LoadTileMapSlices],

    runEach(entity, load) {
      const tileMap = opal.tileMaps.get(load.url)
      if (!tileMap) return
      opal.world.remove(entity, [LoadTileMapSlices])

      tileMap.forEachSlice(load.callback)
    },
  })
