import { describe, expect, test } from "vitest"
import { World, Vector2 } from "@glass/core"
import { Agate } from "@glass/agate"
import { Opal } from "../src"

describe("AnimatePosition", () => {
  test("it animates the position of an entity", () => {
    const world = new World()
    const agate = new Agate.Context(world)
    const opal = new Opal.Context(agate, {
      canvas: document.createElement("canvas"),
    })

    const entity = opal.create(
      new Opal.Position(5, -3),
      new Opal.AnimatePosition({ delta: new Vector2(-8, 10), frames: 10 }),
    )
    function tick() {
      world.clock.tick(world.clock.timestamp + 20)
    }
    function pos() {
      return world.get(entity, Opal.Position)?.coords?.toArray()
    }

    expect(pos()).toEqual([5, -3])

    tick()
    expect(pos()).toEqual([4, -2])
    tick()
    expect(pos()).toEqual([3, -1])
    tick()
    expect(pos()).toEqual([3, 0])
    tick()
    expect(pos()).toEqual([2, 1])
    tick()
    expect(pos()).toEqual([1, 2])
    tick()
    expect(pos()).toEqual([0, 3])
    tick()
    expect(pos()).toEqual([-1, 4])
    tick()
    expect(pos()).toEqual([-1, 5])
    tick()
    expect(pos()).toEqual([-2, 6])
    tick()
    expect(pos()).toEqual([-3, 7])
    tick()
    expect(pos()).toEqual([-3, 7])
    tick()
    expect(pos()).toEqual([-3, 7])
  })
})
