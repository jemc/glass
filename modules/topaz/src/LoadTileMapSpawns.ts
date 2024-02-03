import { World, registerComponent } from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"

export class LoadTileMapSpawns {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly url: string,
    readonly layerName: string,
    readonly spawnFactory: (
      world: World,
      kind: string,
      position: Opal.Position,
    ) => void,
  ) {}
}

export const LoadTileMapSpawnsSystem = (world: World) =>
  world.systemFor([Context, LoadTileMapSpawns], {
    runEach(entity, context, load) {
      const tileMap = context.opal.tileMaps.get(load.url)
      if (!tileMap) return
      const tileMapLayer = tileMap.layer(load.layerName)

      world.remove(entity, [LoadTileMapSpawns])

      const { specialTiles } = tileMapLayer.userData
      tileMapLayer.tileIds.forEach((tileId, x, y) => {
        const special = specialTiles[tileId]
        if (!special) return

        const { tileWidth, tileHeight } = tileMapLayer.tileset

        if (special.category === "spawn") {
          load.spawnFactory(
            world,
            special.kind,
            new Opal.Position(
              x * tileWidth + tileWidth / 2,
              y * tileHeight + tileHeight / 2,
            ),
          )
        } else if (!special.category) {
          if (special.kind === "start") {
            context.playerPosition.coords.setTo(
              x * tileWidth + tileWidth / 2,
              y * tileHeight + tileHeight / 2,
            )
          }
        }
      })
    },
  })