import { registerComponent, System, World } from "@glass/core"
import { Context } from "./Context"
import { Position } from "./Position"
import { Renderable } from "./Renderable"

export class Sprite {
  static readonly componentId = registerComponent(this)

  animationId: string
  framesElapsed = 0

  animation?: SpriteAnimation

  constructor(animationId: string) {
    this.animationId = animationId
    this.use(animationId)
  }

  use(animationId: string, opts?: { shouldNotResetTime?: boolean }) {
    if (this.animationId === animationId) return

    delete this.animation
    this.animationId = animationId

    if (!opts?.shouldNotResetTime) this.framesElapsed = 0
  }
}

export class SpriteAnimation {
  frameIndices: number[] = []

  constructor(
    public id: string,
    public frames: string[],
    frameCounts?: number[],
  ) {
    if (frameCounts) {
      frameCounts.forEach((count, index) => {
        for (let i = 0; i < count; i++) {
          if (index >= frames.length) continue

          if (i === 0) this.frameIndices.push(index)
          else this.frameIndices.push(-1)
        }
      })
    } else {
      frames.forEach((frame, index) => {
        this.frameIndices.push(index)
      })
    }
  }

  get length() {
    return this.frameIndices.length
  }
}

export const SpriteAnimationSystem = (opal: Context) =>
  System.for(opal, [Position, Renderable, Sprite], {
    shouldMatchAll: [Sprite],

    runEach(entity, position, renderable, sprite) {
      if (!sprite.animation) {
        sprite.animation = opal.animations?.get(sprite.animationId)
      }

      const { animation } = sprite
      if (animation) {
        const framesElapsed = sprite.framesElapsed % animation.length
        const frameIndex = animation.frameIndices[framesElapsed] ?? 0
        sprite.framesElapsed = framesElapsed + 1

        if (frameIndex >= 0) {
          const frame = animation.frames[frameIndex]

          if (frame) {
            const texture = opal.textures.get(frame)

            if (texture) {
              renderable.texture = texture
              renderable.pivot.copyFrom(texture.pivot)
            }
          }
        }
      }
    },
  })
