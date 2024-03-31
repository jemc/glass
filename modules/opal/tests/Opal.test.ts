import { describe, expect, test } from "vitest"
import { World, Phase, StatusSystem } from "@glass/core"
import { Opal } from "@glass/opal"

describe("Opal", () => {
  test("it sets up Opal systems in the correct order", () => {
    const world = new World()
    Opal.setup(world)

    expect([...world.phasesAndSystemFactories()]).toEqual([
      [Phase.Load, Opal.LoadSpriteSheetAssetsSystem],
      [Phase.Load, Opal.LoadTileMapAssetsSystem],
      [Phase.Load, Opal.LoadTileMapSlicesSystem],
      [Phase.Action, StatusSystem],
      [Phase.Correction, Opal.PositionWrapsAtEdgesSystem],
      [Phase.PreRender, Opal.SpriteSetFromStatusSystem],
      [Phase.PreRender, Opal.SpriteAnimationSystem],
      [Phase.PreRender, Opal.AnimatePositionSystem],
      [Phase.PreRender, Opal.ColorPaletteAnimationSystem],
      [Phase.Render, Opal.RenderBeginSystem],
      [Phase.Render, Opal.RenderRenderablesSystem],
      [Phase.Render, Opal.RenderTileMapSystem],
    ])
  })
})
