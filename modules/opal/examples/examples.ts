import {
  World,
  Vector2,
  ButtonSourceSystem,
  StatusSystem,
  ReadVector2,
} from "@glass/core"
import { Opal } from "../src"

const TEST_NAME = window.location.hash.slice(1)
const CANVAS_RESOLUTION = new Vector2(240, 160) // GBA resolution

setup(document.getElementById("view") as HTMLCanvasElement)

function setup(canvas: HTMLCanvasElement) {
  canvas.width = CANVAS_RESOLUTION.x
  canvas.height = CANVAS_RESOLUTION.y
  canvas.style.backgroundColor = "black"

  const world = new World()
  const opal = new Opal.Context(new Opal.Render(canvas))

  setupSystems(world, opal)
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
}

function setupSystems(world: World, opal: Opal.Context) {
  world.addSystems([
    // Load phase
    Opal.LoadSpriteSheetAssetsSystem(world),
    Opal.LoadTileMapAssetsSystem(world),
    Opal.LoadTileMapSlicesSystem(world),
    // Action phase
    ButtonSourceSystem(world, document),
    // Reaction phase
    StatusSystem(world),
    Opal.PositionWrapsAtEdgesSystem(world),
    // Pre-render phase
    Opal.SpriteSetFromStatusSystem(world),
    Opal.SpriteAnimationSystem(world),
    Opal.AnimatePositionSystem(world),
    Opal.ColorPaletteAnimationSystem(world, opal),
    // Render phase
    Opal.RenderBeginSystem(world, opal),
    Opal.RenderTileMapSystem(world, opal),
    Opal.RenderRenderablesSystem(world, opal),
  ])
}

function setupTestSprites(world: World, opal: Opal.Context) {
  world.create([
    opal,
    new Opal.LoadSpriteSheetAsset("data/TestBackground.aseprite"),
  ])

  world.create([
    opal,
    new Opal.LoadSpriteSheetAsset("data/TestSprites.aseprite"),
  ])

  world.create([
    opal,
    new Opal.Position(CANVAS_RESOLUTION.x / 2, CANVAS_RESOLUTION.y / 2),
    new Opal.Renderable({ depth: 0.999 }),
    new Opal.Sprite("test-background-1"),
  ])

  const ballFront = world.create([
    opal,
    new Opal.Position(16 + 8, 16 + 8),
    new Opal.Renderable(),
    new Opal.Sprite("ball-front-idle"),
  ])

  const ballFrontCool = world.create([
    opal,
    new Opal.Position(32 + 16 + 8, 16 + 8),
    new Opal.Renderable(),
    new Opal.Sprite("ball-front-idle"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballFrontCool),
    new Opal.Position(0, -2),
    new Opal.Renderable(),
    new Opal.Sprite("sunglasses-front"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballFrontCool),
    new Opal.Position(0, -6),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  ])

  const ballRight = world.create([
    opal,
    new Opal.Position(16 + 8, 32 + 16 + 8),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  ])

  const ballRightCool = world.create([
    opal,
    new Opal.Position(32 + 16 + 8, 32 + 16 + 8),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballRightCool),
    new Opal.Position(3, -2),
    new Opal.Renderable(),
    new Opal.Sprite("sunglasses-side"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballRightCool),
    new Opal.Position(0, -6),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  ])

  const ballLeft = world.create([
    opal,
    new Opal.Position(16 + 8, 64 + 16 + 8, -1),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballLeft),
    new Opal.Position(0, -6),
    new Opal.Renderable({ depth: 0.5 }), // places it behind the ball
    new Opal.Sprite("top-hat"),
  ])

  const ballLeftCool = world.create([
    opal,
    new Opal.Position(32 + 16 + 8, 64 + 16 + 8, -1),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballLeftCool),
    new Opal.Position(3, -2),
    new Opal.Renderable(),
    new Opal.Sprite("sunglasses-side"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballLeftCool),
    new Opal.Position(0, -6),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  ])

  const ballRightSmall = world.create([
    opal,
    new Opal.Position(5.5 * 16, 1.5 * 16, 0.75, 0.75),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  ])

  const ballLeftSmallCool = world.create([
    opal,
    new Opal.Position(9.5 * 16, 1.5 * 16, -0.75, 0.75),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballLeftSmallCool),
    new Opal.Position(3, -2),
    new Opal.Renderable(),
    new Opal.Sprite("sunglasses-side"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballLeftSmallCool),
    new Opal.Position(0, -6),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  ])

  const ballHuge = world.create([
    opal,
    new Opal.Position(7.5 * 16, 3.5 * 16, 5, 5),
    new Opal.Renderable(),
    new Opal.Sprite("ball-front-idle"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballHuge),
    new Opal.Position(0, -1, 1, 0.4),
    new Opal.Renderable(),
    new Opal.Sprite("sunglasses-front"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballHuge),
    new Opal.Position(0, -7, 0.4, 0.2),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  ])

  const ballBigCoolUpsideDownGhostly = world.create([
    opal,
    new Opal.Position(12.5 * 16, 2.5 * 16, -3, -3),
    new Opal.Renderable({ alpha: 0.5 }),
    new Opal.Sprite("ball-side-idle"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballBigCoolUpsideDownGhostly),
    new Opal.Position(3, -2),
    new Opal.Renderable({ alpha: 2 }), // cancels out the half-transparency of the parent
    new Opal.Sprite("sunglasses-side"),
  ])
  world.create([
    opal,
    new Opal.PositionWithin(ballBigCoolUpsideDownGhostly),
    new Opal.Position(0, -6),
    new Opal.Renderable(),
    new Opal.Sprite("top-hat"),
  ])

  let ballChain = world.create([
    opal,
    new Opal.Position(16 + 8, 96 + 16 + 8),
    new Opal.Renderable(),
    new Opal.Sprite("ball-side-idle"),
  ])
  for (let i = 0; i < 8; i += 1) {
    ballChain = world.create([
      opal,
      new Opal.PositionWithin(ballChain),
      new Opal.Position(8, 2),
      new Opal.Renderable({ alpha: 0.8 }),
      new Opal.Sprite("ball-side-idle"),
    ])
  }
}

function setupTestTileMap(
  world: World,
  opal: Opal.Context,
  options?: { offset?: ReadVector2 },
) {
  const url = "data/TestLevel.aseprite"
  const offset = new Vector2(options?.offset?.x ?? 0, options?.offset?.y ?? 0)

  world.create([opal, new Opal.LoadTileMapAsset(url)])

  world.create([
    opal,
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
  ])
}
