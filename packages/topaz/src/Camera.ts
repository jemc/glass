import {
  registerComponent,
  World,
  Box2,
  MutableBox2,
  ReadVector2,
  MutableVector2,
  System,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"
import { Topaz } from "."

export class Camera {
  static readonly componentId = registerComponent(this)

  readonly viewport = new MutableBox2()
  private position = new MutableVector2()

  rooms: [string, Box2][] = []

  disableSmoothingNextFrame = true

  public focus(follow: ReadVector2, output: MutableVector2) {
    var { x, y } = follow

    const roomInfo = this.rooms.find(([name, box]) => box.doesContain(follow))
    if (!roomInfo) return
    const [roomName, roomBox] = roomInfo

    const minX = roomBox.x0 + this.viewport.radii.x
    const maxX = roomBox.x1 - this.viewport.radii.x
    const minY = roomBox.y0 + this.viewport.radii.y
    const maxY = roomBox.y1 - this.viewport.radii.y

    if (x < minX) x = minX
    if (x > maxX) x = maxX
    if (y < minY) y = minY
    if (y > maxY) y = maxY

    var positionx = this.viewport.radii.x - x
    var positiony = this.viewport.radii.y - y

    const diffX = positionx - this.position.x
    const diffY = positiony - this.position.y

    if (this.disableSmoothingNextFrame) {
      this.position.x += diffX
      this.position.y += diffY
    } else {
      this.disableSmoothingNextFrame = false
      if (diffX) this.position.x += Math.round(Math.cbrt(2 * diffX))
      if (diffY) this.position.y += Math.round(Math.cbrt(2 * diffY))
    }

    this.viewport.center.setTo(
      this.position.x + this.viewport.radii.x,
      this.position.y + this.viewport.radii.y,
    )

    output.copyFrom(this.position)
  }

  resize(width: number, height: number) {
    this.viewport.radii.setTo(width / 2, height / 2)
  }
}

export const CameraFocusSystem = (topaz: Topaz.Context) => {
  return System.for(topaz, [Camera, Opal.Renderable, Opal.Position], {
    shouldMatchAll: [Camera],

    runEach(entity, camera, renderable, position) {
      camera.resize(topaz.opal.render.width, topaz.opal.render.height)
      position.updateCoords((coords) => {
        camera.focus(topaz.playerPosition.coords, coords)
      })
    },
  })
}
