import { describe, expect, test } from "vitest"
import { World, Phase } from "@glass/core"
import { Agate } from "@glass/agate"
import { Opal } from "@glass/opal"
import { Coral } from "@glass/coral"

describe("Context", () => {
  test("it sets up Coral systems in the correct order", () => {
    const world = new World()
    const agate = new Agate.Context(world)
    const opal = new Opal.Context(agate, {
      canvas: document.createElement("canvas"),
    })
    const coral = new Coral.Context(opal)

    expect([...world.phasesAndSystemFactories()]).toEqual([
      [Phase.Load, Opal.LoadSpriteSheetAssetsSystem],
      [Phase.Load, Opal.LoadTileMapAssetsSystem],
      [Phase.Load, Opal.LoadTileMapSlicesSystem],
      [Phase.Impetus, Coral.StatusOnContactSystem],
      [Phase.Action, Agate.StatusBringsComponentsSystem],
      [Phase.Action, Agate.StatusRemovesComponentsSystem],
      [Phase.Action, Agate.StatusAffectsGaugesSystem],
      [Phase.Action, Agate.GaugesSetStatusSystem],
      [Phase.Action, Agate.DestroyOnStatusSystem],
      [Phase.Reaction, Coral.ResetBlockedBySystem],
      [Phase.Reaction, Coral.StatusSetsBoundsSystem],
      [Phase.Reaction, Coral.VelocitySystem],
      [Phase.Reaction, Coral.SensorSystem],
      [Phase.Correction, Opal.PositionWrapsAtEdgesSystem],
      [Phase.Correction, Opal.GaugesWatchPositionOfNearestSystem],
      [Phase.PreRender, Opal.StatusSetsSpriteSystem],
      [Phase.PreRender, Opal.SpriteAnimationSystem],
      [Phase.PreRender, Opal.AnimatePositionSystem],
      [Phase.PreRender, Opal.AnimateAlphaOnStatusSystem],
      [Phase.PreRender, Opal.ColorPaletteAnimationSystem],
      [Phase.Render, Opal.RenderBeginSystem],
      [Phase.Render, Opal.RenderRenderablesSystem],
      [Phase.Render, Opal.RenderTileMapSystem],
      [Phase.Advance, Agate.StatusAdvanceSystem],
    ])
  })
})
