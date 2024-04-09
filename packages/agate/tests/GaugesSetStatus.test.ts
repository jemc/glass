import { describe, expect, test } from "vitest"
import { World } from "@glass/core"
import { Agate } from "@glass/agate"

describe("GaugesSetStatus", () => {
  test("sets and/or stops status based on gauge value being in a range", () => {
    const world = new World()
    const agate = new Agate.Context(world)
    const entity = agate.create(
      new Agate.Status(),
      new Agate.Gauges({
        distance: { min: 0, max: 100, value: 100 },
      }),
      new Agate.GaugesSetStatus({
        distance: [
          { atLeast: 80, sets: ["approach"], stops: ["wave", "leave"] },
          { atLeast: 40, atMost: 60, sets: ["wave"] },
          { atMost: 20, sets: ["leave"], stops: ["wave", "approach"] },
        ],
      }),
    )

    function tick() {
      world.clock.tick(world.clock.timestamp + 1)
    }
    function status() {
      return [...world.get(entity, Agate.Status)!.values()]
    }
    function gauges() {
      return world.get(entity, Agate.Gauges)!
    }

    tick()
    expect(status()).toEqual(["approach"])

    gauges().set("distance", 61)
    tick()
    expect(status()).toEqual(["approach"])

    gauges().set("distance", 60)
    tick()
    expect(status()).toEqual(["approach", "wave"])

    gauges().set("distance", 21)
    tick()
    expect(status()).toEqual(["approach", "wave"])

    gauges().set("distance", 20)
    tick()
    expect(status()).toEqual(["leave"])

    gauges().set("distance", 39)
    tick()
    expect(status()).toEqual(["leave"])

    gauges().set("distance", 40)
    tick()
    expect(status()).toEqual(["leave", "wave"])

    gauges().set("distance", 79)
    tick()
    expect(status()).toEqual(["leave", "wave"])

    gauges().set("distance", 80)
    tick()
    expect(status()).toEqual(["approach"])
  })
})
