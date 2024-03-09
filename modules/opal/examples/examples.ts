import { World, Vector2, ButtonSourceSystem, StatusSystem } from "@glass/core"
import { Opal } from "../src"

const TEST_NAME = window.location.hash.slice(1)
const CANVAS_RESOLUTION = new Vector2(240, 160) // GBA resolution

setup(document.getElementById("view") as HTMLCanvasElement)

function setup(canvas: HTMLCanvasElement) {
  canvas.width = CANVAS_RESOLUTION.x
  canvas.height = CANVAS_RESOLUTION.y

  const world = new World()
  const opal = new Opal.Context(new Opal.Render(canvas))

  setupSystems(world, opal)
  switch (TEST_NAME) {
    case "test-tile-map":
      setupTestTileMap(world, opal)
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
    // TODO: Move the UpdateTransformsSystem system to the pre-render phase
    // once doing so no longer breaks tile map rendering above when walking.
    Opal.UpdateTransformsSystem(world),
    Opal.RenderRenderablesSystem(world, opal),
  ])
}

function setupTestTileMap(world: World, opal: Opal.Context) {
  const url = "data/TestLevel.aseprite"

  world.create([opal, new Opal.LoadTileMapAsset(url)])

  world.create([
    opal,
    new Opal.Position(0, 0),
    new Opal.Renderable({ depth: 0.999 }),
    new Opal.RenderTileMap(
      url,
      "Background",
      new Vector2(CANVAS_RESOLUTION.x / 2, CANVAS_RESOLUTION.y / 2),
    ),
  ])
}
