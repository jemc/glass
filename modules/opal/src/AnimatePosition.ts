import { MutableVector2, registerComponent, Vector2, World } from "@glass/core"
import { Position } from "./Position"

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
    runEach(entity, animate, position) {
      if (animate._state.progressFrames === 0)
        animate._state.initialPosition.copyFrom(position.coords)

      const progress = animate._state.progressFrames / animate.config.frames

      position.coords
        .copyFrom(animate.config.delta)
        .scaleEquals(progress)
        .plusEquals(animate._state.initialPosition)

      if (progress >= 1) world.remove(entity, [AnimatePosition])
      else animate._state.progressFrames += 1
    },
  })
