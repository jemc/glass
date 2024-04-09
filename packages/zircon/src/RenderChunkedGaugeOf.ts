import { registerComponent, Entity, System, Vector2 } from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"
import { Agate } from "@glass/agate"

const LAST_RENDERED_VALUE = Symbol("lastRenderedValue") // private property

interface RenderChunkedGaugeConfig {
  // The string prefix to use for finding the sprite to show for each chunk.
  //
  // See the `spriteSuffixMax` option for more information on how this works.
  readonly spritePrefix: string

  // The total number of variations that the chunk sprite has.
  //
  // In other words, raising this number (and preparing multiple sprites)
  // allows for more granularity of value to be depicted per chunk.
  //
  // For example, if the `spritePrefix` is `heart-` and this value is 4, then
  // the sprite names will be `heart-0`, `heart-1`, `heart-2`, and `heart-3`.
  // Note that if you wanted the `heart-0` sprite to be invisible, you could
  // skip it in your sprite sheet and start at `heart-1` instead.
  //
  // You can get a variety of interesting visual effects from this mechanism.
  // See the `test-gauges` example in `examples.ts` file for some ideas.
  readonly spriteSuffixMax: number

  // The total number of chunks that the gauge will be divided into.
  //
  // The percentage value of the gauge will be shown as a percentage of
  // the given number of chunks.
  readonly chunkCount: number

  // The position offset of each subsequent chunk sprite from the prior chunk.
  //
  // Basically, this is the configuration option that controls the orientation
  // in which the gauge will fill as its value goes changes, as well as the
  // spacing between chunks, for different visual effects.
  //
  // See the `test-gauges` example in `examples.ts` file for some ideas.
  readonly chunkPlacementDelta: Vector2

  // If given, this overrides (for display) the maximum value of the gauge.
  //
  // Sometimes the gauge's actual max value may vary across time (e.g. if
  // the game lets you collect more heart containers as items during play),
  // but we don't want the gauge to change its appearance when that happens.
  // In those cases, setting the `maxDisplayValue` to the maximum number of
  // heart containers that it is possible to have will ensure that the gauge
  // always looks the same, even as the underlying gauge max changes.
  readonly maxDisplayValue?: number

  // If true, only the first chunk will be show a chunk value of zero.
  //
  // All trailing zero-valued chunks will be hidden (not rendered).
  readonly hideTrailingZeros?: boolean
}

export class RenderChunkedGaugeOf {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly collectionEntity: Entity,
    readonly name: string,
    readonly config: RenderChunkedGaugeConfig,
  ) {}

  [LAST_RENDERED_VALUE]?: number
}

// Keep this component private, so that only RenderGaugeOfSystem can create it.
class FromRenderChunkedGauge {
  static readonly componentId = registerComponent(this)

  constructor(readonly collectionEntity: Entity) {}
}

export const RenderChunkedGaugeOfSystem = (zircon: Context) =>
  System.for(zircon, [RenderChunkedGaugeOf, Opal.Renderable], {
    shouldMatchAll: [RenderChunkedGaugeOf],

    runEach(entity, renderGaugeOf, renderable) {
      const { collectionEntity: gaugeEntity, name, config } = renderGaugeOf

      const gauges = zircon.world.get(gaugeEntity, Agate.Gauges)
      if (!gauges) return

      const percentValue =
        config.maxDisplayValue === undefined
          ? gauges.getPercent(name)
          : (gauges.get(name) - gauges.getMin(name)) / config.maxDisplayValue

      // Skip out early if the value hasn't changed.
      if (percentValue === renderGaugeOf[LAST_RENDERED_VALUE]) return
      renderGaugeOf[LAST_RENDERED_VALUE] = percentValue

      // Build an array where each value is the value of the chunk at that index.
      const maxValue = config.chunkCount * config.spriteSuffixMax
      const value = percentValue * maxValue
      const chunkValues = Array.from({ length: config.chunkCount }, (_, i) => {
        const chunkStart = i * config.spriteSuffixMax
        const chunkEnd = chunkStart + config.spriteSuffixMax
        if (value <= chunkStart) return 0
        if (value >= chunkEnd) return config.spriteSuffixMax

        return Math.round(value - chunkStart)
      })

      // Make sure all the chunk entities are created and ready to render.
      const chunkEntities = zircon.world.getCollected(
        entity,
        FromRenderChunkedGauge,
      )
      while (chunkEntities.size < config.chunkCount) {
        const i = config.chunkCount - chunkEntities.size - 1
        const pos = config.chunkPlacementDelta.scale(i)

        zircon.create(
          new Opal.PositionWithin(entity),
          new Opal.Position(pos.x, pos.y),
          new Opal.Renderable({ depth: renderable.depth }),
          new FromRenderChunkedGauge(entity),
        )
      }

      // Set the chunks to have the appropriate sprite based on chunk value.
      let i = chunkEntities.size
      chunkEntities.forEach((chunkEntity) => {
        i--
        const chunkValue = chunkValues[i]
        if (config.hideTrailingZeros && chunkValue === 0 && i !== 0) {
          zircon.world.remove(chunkEntity, [Opal.Sprite])
        } else {
          const spriteName = `${config.spritePrefix}${chunkValue}`
          zircon.world.set(chunkEntity, [new Opal.Sprite(spriteName)])
        }
      })
    },
  })
