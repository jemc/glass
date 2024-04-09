import { World, Vector2, ReadVector2 } from "@glass/core"
import { Agate } from "@glass/agate"
import { Opal } from "@glass/opal"
import { Zircon } from "../src"

const TEST_NAME = window.location.hash.slice(1)
const CANVAS_RESOLUTION = new Vector2(144, 128)

setup(document.getElementById("view") as HTMLCanvasElement)

function setup(canvas: HTMLCanvasElement) {
  const world = new World()
  const agate = new Agate.Context(world)
  const opal = new Opal.Context(agate, {
    canvas,
    width: CANVAS_RESOLUTION.x,
    height: CANVAS_RESOLUTION.y,
  })
  const zircon = new Zircon.Context(opal)
  switch (TEST_NAME) {
    case "test-gauges":
      setupTestGauges(zircon)
      break
    default:
      throw new Error(`Unknown test name: "${TEST_NAME}"`)
  }

  // Run for about 100 frames.
  // This gives plenty of time for loading assets and fully stabilizing it all.
  let i = 0
  const runFrame = () => {
    world.clock.tick(performance.now())
    if (i < 100) requestAnimationFrame(runFrame)
    i += 1
  }
  runFrame()

  // Check for warnings at the end to surface any issues during tests.
  const warnings = world.debugScanForWarnings()
  if (warnings.length > 0) {
    warnings.forEach((warning) => console.warn(warning))
    throw new Error("Warnings were found.")
  }
}

function setupTestGauges(zircon: Zircon.Context) {
  zircon.create(new Opal.LoadSpriteSheetAsset("data/TestBackground.aseprite"))

  zircon.create(new Opal.LoadSpriteSheetAsset("data/TestSprites.aseprite"))

  zircon.create(
    new Opal.Position(CANVAS_RESOLUTION.x / 2, CANVAS_RESOLUTION.y / 2),
    new Opal.Renderable({ depth: 0.999 }),
    new Opal.Sprite("test-background-1"),
  )

  const data = zircon.create(
    new Agate.Gauges({
      progress0: { value: 0.0 },
      progress1: { value: 0.01 },
      progress10: { value: 0.1 },
      progress11: { value: 0.11 },
      progress12: { value: 0.12 },
      health0: { min: 0, max: 32, value: 0 },
      health1: { min: 0, max: 32, value: 1 },
      health10: { min: 0, max: 32, value: 10 },
      health21: { min: 0, max: 32, value: 21 },
      health40: { min: 0, max: 40, value: 40 },
      stars0: { min: 0, max: 100, value: 0 },
      stars20: { min: 0, max: 100, value: 20 },
      stars50: { min: 0, max: 100, value: 50 },
      stars75: { min: 0, max: 100, value: 75 },
      stars100: { min: 0, max: 100, value: 100 },
      hearts15: { max: 1000, value: 15 },
      hearts10: { max: 1000, value: 10 },
      hearts4: { max: 1000, value: 4 },
      hearts1: { max: 1000, value: 1 },
      hearts0: { max: 1000, value: 0 },
    }),
  )

  ;["progress0", "progress1", "progress10", "progress11", "progress12"].forEach(
    (name, index) => {
      zircon.create(
        new Opal.Position(8 + 8 * index, 8),
        new Opal.Renderable(),
        new Zircon.RenderChunkedGaugeOf(data, name, {
          spritePrefix: "gauge-ball-track-",
          spriteSuffixMax: 4,
          chunkCount: 25,
          chunkPlacementDelta: new Vector2(0, 4),
          hideTrailingZeros: true,
        }),
      )
    },
  )
  ;["health0", "health1", "health10", "health21", "health40"].forEach(
    (name, index) => {
      zircon.create(
        new Opal.Position(8 + 8 * index, 64 + 8),
        new Opal.Renderable(),
        new Zircon.RenderChunkedGaugeOf(data, name, {
          spritePrefix: "gauge-mega-",
          spriteSuffixMax: 8,
          chunkCount: 5,
          chunkPlacementDelta: new Vector2(0, -8),
        }),
      )
    },
  )
  ;["stars0", "stars20", "stars50", "stars75", "stars100"].forEach(
    (name, index) => {
      zircon.create(
        new Opal.Position(8 + 32 + 16, 8 + 16 * index),
        new Opal.Renderable(),
        new Zircon.RenderChunkedGaugeOf(data, name, {
          spritePrefix: "gauge-star-",
          spriteSuffixMax: 6,
          chunkCount: 5,
          chunkPlacementDelta: new Vector2(8, 0),
        }),
      )
    },
  )
  ;["hearts15", "hearts10", "hearts4", "hearts1", "hearts0"].forEach(
    (name, index) => {
      zircon.create(
        new Opal.Position(8 + 64 + 16 * index, 8 + 16 + 16 * index),
        new Opal.Renderable(),
        new Zircon.RenderChunkedGaugeOf(data, name, {
          spritePrefix: "gauge-heart-",
          spriteSuffixMax: 4,
          chunkCount: 10,
          maxDisplayValue: 40,
          chunkPlacementDelta: new Vector2(15, 0),
        }),
      )
    },
  )
}
