import { describe, expect, test } from "vitest"
import { World, Phase, StatusSystem } from "@glass/core"
import { Onyx } from "@glass/onyx"

describe("Onyx", () => {
  test("it sets up Onyx systems in the correct order", () => {
    const world = new World()
    Onyx.setup(world)

    expect([...world.phasesAndSystemFactories()]).toEqual([
      [Phase.Action, StatusSystem],
      [Phase.PreRender, Onyx.ArrangementPlaySystem],
    ])
  })
})
