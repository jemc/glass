import { describe, expect, test } from "vitest"
import { World, Phase } from "@glass/core"
import { Agate } from "@glass/agate"
import { Onyx } from "@glass/onyx"

describe("Onyx", () => {
  test("it sets up Onyx systems in the correct order", () => {
    const world = new World()
    Onyx.setup(world)

    expect([...world.phasesAndSystemFactories()]).toEqual([
      [Phase.Action, Agate.StatusSystem],
      [Phase.PreRender, Onyx.ArrangementPlaySystem],
    ])
  })
})
