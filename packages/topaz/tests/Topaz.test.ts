import { describe, expect, test } from "vitest"
import { World, Phase, StatusSystem } from "@glass/core"
import { Opal } from "@glass/opal"
import { Topaz } from "@glass/topaz"

describe("Topaz", () => {
  test("it sets up Topaz systems in the correct order", () => {
    const world = new World()
    Topaz.setup(world)

    expect([...world.phasesAndSystemFactories()]).toEqual([
      [Phase.Load, Opal.LoadSpriteSheetAssetsSystem],
      [Phase.Load, Opal.LoadTileMapAssetsSystem],
      [Phase.Load, Opal.LoadTileMapSlicesSystem],
      [Phase.Load, Topaz.LoadTileMapSpawnsSystem],
      [Phase.Action, StatusSystem],
      [Phase.Action, Topaz.WalkSystem],
      [Phase.Action, Topaz.WarpPlayerSystem],
      [Phase.Reaction, Topaz.CameraFocusSystem],
      [Phase.Correction, Opal.PositionWrapsAtEdgesSystem],
      [Phase.PreRender, Opal.SpriteSetFromStatusSystem],
      [Phase.PreRender, Opal.SpriteAnimationSystem],
      [Phase.PreRender, Opal.AnimatePositionSystem],
      [Phase.PreRender, Opal.ColorPaletteAnimationSystem],
      [Phase.PreRender, Topaz.SetBodyDepthSystem],
      [Phase.Render, Opal.RenderBeginSystem],
      [Phase.Render, Opal.RenderRenderablesSystem],
      [Phase.Render, Opal.RenderTileMapSystem],
    ])
  })
})
