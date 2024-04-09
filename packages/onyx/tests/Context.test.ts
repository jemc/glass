import { describe, expect, test } from "vitest"
import { World, Phase } from "@glass/core"
import { Agate } from "@glass/agate"
import { Onyx } from "@glass/onyx"

describe("Context", () => {
  test("it sets up Onyx systems in the correct order", async () => {
    const world = new World()
    const agate = new Agate.Context(world)
    const onyx = await Onyx.Context.setup(agate)

    expect([...world.phasesAndSystemFactories()]).toEqual([
      [Phase.Action, Agate.StatusAffectsGaugesSystem],
      [Phase.Action, Agate.GaugesSetStatusSystem],
      [Phase.PreRender, Onyx.ArrangementPlaySystem],
      [Phase.Advance, Agate.StatusAdvanceSystem],
    ])
  })
})
