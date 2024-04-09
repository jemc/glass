import { describe, expect, test } from "vitest"
import { World, Phase } from "@glass/core"
import { Agate } from "@glass/agate"
import { Opal } from "@glass/opal"
import { Zircon } from "@glass/zircon"

describe("Context", () => {
  test("it sets up Zircon systems in the correct order", () => {
    const world = new World()
    const agate = new Agate.Context(world)
    const opal = new Opal.Context(agate, {
      canvas: document.createElement("canvas"),
    })
    const zircon = new Zircon.Context(opal)

    expect([...world.phasesAndSystemFactories()]).toEqual([
      [Phase.Load, Opal.LoadSpriteSheetAssetsSystem],
      [Phase.Load, Opal.LoadTileMapAssetsSystem],
      [Phase.Load, Opal.LoadTileMapSlicesSystem],
      [Phase.Impetus, Zircon.MenuNavigateSystem],
      [Phase.Impetus, Zircon.MenuSetsStatusSystem],
      [Phase.Action, Agate.StatusAffectsGaugesSystem],
      [Phase.Correction, Opal.PositionWrapsAtEdgesSystem],
      [Phase.PreRender, Opal.SpriteSetFromStatusSystem],
      [Phase.PreRender, Opal.SpriteAnimationSystem],
      [Phase.PreRender, Opal.AnimatePositionSystem],
      [Phase.PreRender, Opal.ColorPaletteAnimationSystem],
      [Phase.PreRender, Zircon.RenderTextSystem],
      [Phase.PreRender, Zircon.RenderChunkedGaugeOfSystem],
      [Phase.Render, Opal.RenderBeginSystem],
      [Phase.Render, Opal.RenderRenderablesSystem],
      [Phase.Render, Opal.RenderTileMapSystem],
      [Phase.Advance, Agate.StatusAdvanceSystem],
    ])
  })
})
