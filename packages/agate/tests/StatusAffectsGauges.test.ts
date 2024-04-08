import { describe, expect, test } from "vitest"
import { World } from "@glass/core"
import { Agate } from "@glass/agate"

describe("StatusAffectsGauges", () => {
  test("sets, gets, and modifies values", () => {
    const world = new World()
    const agate = new Agate.Context(world)
    const entity = agate.create(
      new Agate.Gauges({
        health: { min: 0, max: 100, value: 100 },
      }),
      new Agate.Status({
        poisoned: { maxFrames: 30 },
        healing: { maxFrames: 10, stops: ["poisoned"] },
        instantFullHeal: { maxFrames: 1, stops: ["poisoned"] },
      }),
      new Agate.StatusAffectsGauges({
        poisoned: [
          {
            name: "health",
            type: "add",
            value: -2,
            repeatIntervalFrames: 3,
          },
        ],
        healing: [
          {
            name: "health",
            type: "add",
            value: 5,
            initialDelayFrames: 1,
            repeatIntervalFrames: 2,
          },
        ],
        instantFullHeal: [
          {
            name: "health",
            type: "setPercent",
            value: 1,
          },
        ],
      }),
    )

    function tick() {
      world.clock.tick(world.clock.timestamp + 1)
    }
    function tickMany(n: number) {
      for (let i = 0; i < n; i++) tick()
    }
    function currentHealth() {
      return world.get(entity, Agate.Gauges)!.get("health")
    }

    expect(currentHealth()).toBe(100)

    tick()
    expect(currentHealth()).toBe(100)

    world.get(entity, Agate.Status)!.set("poisoned")
    tick()
    expect(currentHealth()).toBe(98)
    tick()
    expect(currentHealth()).toBe(98)
    tick()
    expect(currentHealth()).toBe(98)

    tick()
    expect(currentHealth()).toBe(96)
    tick()
    expect(currentHealth()).toBe(96)
    tick()
    expect(currentHealth()).toBe(96)

    tick()
    expect(currentHealth()).toBe(94)
    tickMany(3)
    expect(currentHealth()).toBe(92)
    tickMany(3)
    expect(currentHealth()).toBe(90)
    tickMany(3)
    expect(currentHealth()).toBe(88)
    tickMany(3)
    expect(currentHealth()).toBe(86)
    tickMany(3)
    expect(currentHealth()).toBe(84)
    tickMany(3)
    expect(currentHealth()).toBe(82)
    tickMany(3)
    expect(currentHealth()).toBe(80)
    tickMany(3)
    expect(currentHealth()).toBe(78)

    tickMany(3) // poisoned status has expired
    expect(world.get(entity, Agate.Status)!.is("poisoned")).toBe(false)
    expect(currentHealth()).toBe(78)

    world.get(entity, Agate.Status)!.set("poisoned")
    tickMany(10)
    expect(currentHealth()).toBe(70)

    world.get(entity, Agate.Status)!.set("healing")
    tick()
    expect(currentHealth()).toBe(70)
    expect(world.get(entity, Agate.Status)!.is("poisoned")).toBe(false)

    tick()
    expect(currentHealth()).toBe(75)
    tick()
    expect(currentHealth()).toBe(75)
    tick()
    expect(currentHealth()).toBe(80)
    tick()
    expect(currentHealth()).toBe(80)
    tick()
    expect(currentHealth()).toBe(85)
    tick()
    expect(currentHealth()).toBe(85)
    tick()
    expect(currentHealth()).toBe(90)
    tick()
    expect(currentHealth()).toBe(90)
    tick()
    expect(currentHealth()).toBe(95)
    expect(world.get(entity, Agate.Status)!.is("healing")).toBe(true)
    tick() // healing status has just expired
    expect(currentHealth()).toBe(95)
    expect(world.get(entity, Agate.Status)!.is("healing")).toBe(false)

    tick()
    expect(currentHealth()).toBe(95) // no more healing

    world.get(entity, Agate.Status)!.set("poisoned")
    tick()
    expect(currentHealth()).toBe(93)

    world.get(entity, Agate.Status)!.set("instantFullHeal")
    tick()
    expect(world.get(entity, Agate.Status)!.is("poisoned")).toBe(false)
    expect(world.get(entity, Agate.Status)!.is("instantFullHeal")).toBe(true)
    expect(currentHealth()).toBe(100)
  })
})
