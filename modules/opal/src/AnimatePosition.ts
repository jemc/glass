import { registerComponent, World, Vector2, MutableVector2 } from "@glass/core"
import { Position } from "./Position"
import { Context } from "./Context"

interface Config {
  delta: Vector2
  frames: number
}

class _State {
  initialPosition = new MutableVector2()
  progressFrames: number = 0
  constructor() {}
}

export class AnimatePosition {
  static readonly componentId = registerComponent(this)

  readonly _state: _State

  constructor(readonly config: Config) {
    this._state = new _State()
  }
}

export const AnimatePositionSystem = (world: World) =>
  world.systemFor([AnimatePosition, Position], {
    shouldMatchAll: [AnimatePosition],

    runEach(entity, animate, position) {
      if (animate._state.progressFrames === 0)
        animate._state.initialPosition.copyFrom(position.coords)

      animate._state.progressFrames += 1
      const progress = animate._state.progressFrames / animate.config.frames

      position.updateCoords((coords) => {
        coords
          .copyFrom(animate.config.delta)
          .scaleEquals(progress)
          .plusEquals(animate._state.initialPosition)
          .toRounded()
      })

      if (progress >= 1) world.remove(entity, [AnimatePosition])
    },
  })
