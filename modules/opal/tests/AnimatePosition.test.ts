import { describe, expect, test } from "vitest"
import { World, Vector2 } from "@glass/core"
import { AnimatePosition, AnimatePositionSystem, Position } from "../src"

describe("AnimatePosition", () => {
  test("it animates the position of an entity", () => {
    const world = new World()
    world.addSystem(AnimatePositionSystem)
    const entity = world.create([
      new Position(5, -3),
      new AnimatePosition({ delta: new Vector2(-8, 10), frames: 10 }),
    ])

    function pos() {
      return world.get(entity, Position)?.coords?.toArray()
    }

    expect(pos()).toEqual([5, -3])

    world.clock.tick(0)
    expect(pos()).toEqual([4, -2])
    world.clock.tick(1)
    expect(pos()).toEqual([3, -1])
    world.clock.tick(2)
    expect(pos()).toEqual([3, 0])
    world.clock.tick(3)
    expect(pos()).toEqual([2, 1])
    world.clock.tick(4)
    expect(pos()).toEqual([1, 2])
    world.clock.tick(5)
    expect(pos()).toEqual([0, 3])
    world.clock.tick(6)
    expect(pos()).toEqual([-1, 4])
    world.clock.tick(7)
    expect(pos()).toEqual([-1, 5])
    world.clock.tick(8)
    expect(pos()).toEqual([-2, 6])
    world.clock.tick(9)
    expect(pos()).toEqual([-3, 7])
    world.clock.tick(10)
    expect(pos()).toEqual([-3, 7])
    world.clock.tick(11)
    expect(pos()).toEqual([-3, 7])
  })
})
