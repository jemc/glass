import { describe, expect, test } from "vitest"
import { World, Phase, StatusSystem } from "@glass/core"
import { Opal } from "@glass/opal"
import { Zircon } from "@glass/zircon"

describe("Zircon", () => {
  test("it sets up Zircon systems in the correct order", () => {
    const world = new World()
    Zircon.setup(world)

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
      [Phase.PreRender, Zircon.RenderTextSystem],
      [Phase.Render, Opal.RenderBeginSystem],
      [Phase.Render, Opal.RenderRenderablesSystem],
      [Phase.Render, Opal.RenderTileMapSystem],
    ])
  })
})
