import { World, registerComponent, Vector2 } from "@glass/core"
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

export const WarpPlayerSystem = (world: World) => {
  return world.systemFor([Context, WarpPlayerTo], {
    runEach(entity, context, warp) {
      const tileMap = context.opal.tileMaps.get(warp.tileMapName)
      if (!tileMap) return

      // TODO: context.currentTileMap = tileMap

      const room = tileMap.slice(warp.roomName)
      if (!room) return

      context.playerPosition.coords
        .setTo(warp.roomTileX, warp.roomTileY)
        .plusScalarEquals(0.5)
        .scaleEquals(context.config.tileSize)
        .plusEquals(new Vector2(room.x0, room.y0))

      context.camera.disableSmoothingNextFrame = true

      world.remove(entity, [WarpPlayerTo, Walking])

      if (warp.callback) warp.callback()
    },
  })
}
