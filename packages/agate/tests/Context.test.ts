import { describe, expect, test } from "vitest"
import { World, Phase } from "@glass/core"
import { Agate } from "@glass/agate"

describe("Context", () => {
  test("it sets up Agate systems in the correct order", () => {
    const world = new World()
    const agate = new Agate.Context(world)

    expect([...world.phasesAndSystemFactories()]).toEqual([
      [Phase.Action, Agate.StatusSystem],
    ])
  })
})
