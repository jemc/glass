import { registerComponent, World, Vector2, System } from "@glass/core"
import { Context } from "./Context"
import { Walking } from "./Walk"

export class WarpPlayerTo {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly tileMapName: string,
    readonly roomName: string,
    readonly roomTileX: number,
    readonly roomTileY: number,
    readonly callback?: () => void,
  ) {}
}

export const WarpPlayerSystem = (topaz: Context) => {
  return System.for(topaz, [WarpPlayerTo], {
    shouldMatchAll: [WarpPlayerTo],

    runEach(entity, warp) {
      const tileMap = topaz.opal.tileMaps.get(warp.tileMapName)
      if (!tileMap) return

      // TODO: context.currentTileMap = tileMap

      const room = tileMap.slice(warp.roomName)
      if (!room) return

      topaz.playerPosition.updateCoords((coords) => {
        coords
          .setTo(warp.roomTileX, warp.roomTileY)
          .plusScalarEquals(0.5)
          .scaleEquals(topaz.config.tileSize)
          .plusEquals(new Vector2(room.x0, room.y0))
      })

      topaz.camera.disableSmoothingNextFrame = true

      topaz.world.remove(entity, [WarpPlayerTo, Walking])

      if (warp.callback) warp.callback()
    },
  })
}
