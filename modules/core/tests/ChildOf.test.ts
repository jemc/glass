import { describe, expect, test } from "@jest/globals"
import { ChildOf } from "../src/ChildOf"
import { World } from "../src/World"

describe("ChildOf", () => {
  test("tracks a parent entity", () => {
    const world = new World()

    const parent = world.create()
    const child = world.create([new ChildOf(parent)])

    expect(world.get(child, ChildOf)?.parent).toBe(parent)
  })
})
