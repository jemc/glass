import { System } from "@glass/core"
import { Opal } from "@glass/opal"
import { Body } from "./Body"
import { Context } from "./Context"

// Manage the z-order of Body-attached sprites (objects in the Topaz view),
// such that sprites with higher y coordinates (lower on the screen) are
// on top of sprites with lower y coordinates (higher on the screen), with
// all these depth values being in the range (-0.5, 0] - which leaves room
// for overlay elements with depth values in the range (-1, -0.5),
// and for the background elemets with depth value in the range (0, 1).
export const SetBodyDepthSystem = (topaz: Context) => {
  // We need to scale down the y coordinates to generate the depth values,
  // so that they end up in the desired range. But if we scale them too far,
  // they won't be discernable by the depth tests. So we have experimented
  // a bit and found a factor that makes room for very large tile maps but
  // does not cause depth values to be too small/indiscernable.
  const maxTileMapHeight = 2 ** 23 // ~8 million tiles should be plenty
  const depthFactor = -0.5 / maxTileMapHeight

  return System.for(topaz, [Body, Opal.Position, Opal.Renderable], {
    shouldMatchAll: [Body],

    runEach(entity, body, position, renderable) {
      renderable.depth =
        (position.coords.y * depthFactor) / topaz.config.tileSize
    },
  })
}
