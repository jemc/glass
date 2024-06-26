import { World, Vector2, ReadVector2 } from "@glass/core"
import { Agate } from "@glass/agate"
import { Opal } from "../src"

const TEST_NAME = window.location.hash.slice(1)
const CANVAS_RESOLUTION = new Vector2(240, 160) // GBA resolution

setup(document.getElementById("view") as HTMLCanvasElement)

function setup(canvas: HTMLCanvasElement) {
  const world = new World()
  const agate = new Agate.Context(world)
  const opal = new Opal.Context(agate, {
    canvas,
    width: CANVAS_RESOLUTION.x,
    height: CANVAS_RESOLUTION.y,
  })
  switch (TEST_NAME) {
    case "test-sprites":
      setupTestSprites(world, opal)
      break
    case "test-tile-map":
      setupTestTileMap(world, opal)
      break
    case "test-tile-map-offset":
      setupTestTileMap(world, opal, { offset: new Vector2(53, 62) })
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

function setupTestSprites(world: World, opal: Opal.Context) {
  opal.create(new Opal.LoadSpriteSheetAsset("data/TestBackground.aseprite"))

  opal.create(new Opal.LoadSpriteSheetAsset("data/TestSprites.aseprite"))

  opal.create(
    new Opal.Position(CANVAS_RESOLUTION.x / 2, CANVAS_RESOLUTION.y / 2),
    new Opal.Renderable({ depth: 0.999 }),
    new Opal.Sprite("test-background-1"),
  )

  const ballFront = opal.create(
    new Opal.Position(16 + 8, 16 + 8),
    new Opal.Renderable(),
    new Opal.Sprite("ball-front-idle"),
  )

  const ballFrontCool = opal.create(
    new Opal.Position(32 + 16 + 8, 16 + 8),
    new Opal.Renderable(),
    new Opal.Sprite("ball-front-idle"),
  )
  opal.create(
    new Opal.PositionWithin(ballFrontCool),
    new Opal.Position(0, -2),
    new Opal.Renderable(),
    new Opal.Sprite("sunglasses-front"),
  )
  opal.create(
    new Opal.PositionWithin(ballFrontCool),
    new Opal.Position(0, -6),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  )

  const ballRight = opal.create(
    new Opal.Position(16 + 8, 32 + 16 + 8),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  )

  const ballRightCool = opal.create(
    new Opal.Position(32 + 16 + 8, 32 + 16 + 8),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  )
  opal.create(
    new Opal.PositionWithin(ballRightCool),
    new Opal.Position(3, -2),
    new Opal.Renderable(),
    new Opal.Sprite("sunglasses-side"),
  )
  opal.create(
    new Opal.PositionWithin(ballRightCool),
    new Opal.Position(0, -6),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  )

  const ballLeft = opal.create(
    new Opal.Position(16 + 8, 64 + 16 + 8, -1),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  )
  opal.create(
    new Opal.PositionWithin(ballLeft),
    new Opal.Position(0, -6),
    new Opal.Renderable({ depth: 0.5 }), // places it behind the ball
    new Opal.Sprite("top-hat"),
  )

  const ballLeftCool = opal.create(
    new Opal.Position(32 + 16 + 8, 64 + 16 + 8, -1),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  )
  opal.create(
    new Opal.PositionWithin(ballLeftCool),
    new Opal.Position(3, -2),
    new Opal.Renderable(),
    new Opal.Sprite("sunglasses-side"),
  )
  opal.create(
    new Opal.PositionWithin(ballLeftCool),
    new Opal.Position(0, -6),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  )

  const ballLeftRotated = opal.create(
    new Opal.Position(16 + 8, 64 + 32 + 16 + 8, -1, 1, 90),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  )

  const ballRightRotatedCool = opal.create(
    new Opal.Position(32 + 16 + 8, 64 + 32 + 16 + 8, 1, 1, -90),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  )
  opal.create(
    new Opal.PositionWithin(ballRightRotatedCool),
    new Opal.Position(3, -2),
    new Opal.Renderable(),
    new Opal.Sprite("sunglasses-side"),
  )
  opal.create(
    new Opal.PositionWithin(ballRightRotatedCool),
    new Opal.Position(0, -6),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  )

  const ballRightSmall = opal.create(
    new Opal.Position(5.5 * 16, 1.5 * 16, 0.75, 0.75),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  )

  const ballLeftSmallCool = opal.create(
    new Opal.Position(9.5 * 16, 1.5 * 16, -0.75, 0.75),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  )
  opal.create(
    new Opal.PositionWithin(ballLeftSmallCool),
    new Opal.Position(3, -2),
    new Opal.Renderable(),
    new Opal.Sprite("sunglasses-side"),
  )
  opal.create(
    new Opal.PositionWithin(ballLeftSmallCool),
    new Opal.Position(0, -6),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  )

  const ballHuge = opal.create(
    new Opal.Position(7.5 * 16, 3.5 * 16, 5, 5),
    new Opal.Renderable(),
    new Opal.Sprite("ball-front-idle"),
  )
  opal.create(
    new Opal.PositionWithin(ballHuge),
    new Opal.Position(0, -1, 1, 0.4),
    new Opal.Renderable(),
    new Opal.Sprite("sunglasses-front"),
  )
  opal.create(
    new Opal.PositionWithin(ballHuge),
    new Opal.Position(0, -7, 0.4, 0.2),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  )

  const ballBigCoolUpsideDownGhostly = opal.create(
    new Opal.Position(12.5 * 16, 2.5 * 16, -3, -3),
    new Opal.Renderable({ alpha: 0.5 }),
    new Opal.Sprite("ball-side-idle"),
  )
  opal.create(
    new Opal.PositionWithin(ballBigCoolUpsideDownGhostly),
    new Opal.Position(3, -2),
    new Opal.Renderable({ alpha: 2 }), // cancels out the half-transparency of the parent
    new Opal.Sprite("sunglasses-side"),
  )
  opal.create(
    new Opal.PositionWithin(ballBigCoolUpsideDownGhostly),
    new Opal.Position(0, -6),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  )

  let ballChain = opal.create(
    new Opal.Position(96 - 8, 96 + 16 + 8),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  )
  for (let i = 0; i < 8; i += 1) {
    ballChain = opal.create(
      new Opal.PositionWithin(ballChain),
      new Opal.Position(8, 2),
      new Opal.Renderable({ alpha: 0.8 }),
      new Opal.Sprite("ball-side-idle"),
    )
  }
}

function setupTestTileMap(
  world: World,
  opal: Opal.Context,
  options?: { offset?: ReadVector2 },
) {
  const url = "data/TestLevel.aseprite"
  const offset = new Vector2(options?.offset?.x ?? 0, options?.offset?.y ?? 0)

  opal.create(new Opal.LoadTileMapAsset(url))

  opal.create(
    new Opal.Position(-offset.x, -offset.y),
    new Opal.Renderable({ depth: 0.999 }),
    new Opal.RenderTileMap(
      url,
      "Background",
      new Vector2(
        CANVAS_RESOLUTION.x / 2 - offset.x,
        CANVAS_RESOLUTION.y / 2 - offset.y,
      ),
    ),
  )
}
