import { describe, expect, test } from "vitest"
import { World } from "@glass/core"
import { Agate } from "@glass/agate"

describe("Gauges", () => {
  test("sets, gets, and modifies values", () => {
    const world = new World()
    const gauges = new Agate.Gauges({
      opacity: {},
      health: { min: 0, max: 100, value: 100 },
      charge: { min: -1 },
    })

    expect(gauges.get("opacity")).toBeCloseTo(0)
    expect(gauges.get("health")).toBeCloseTo(100)
    expect(gauges.get("charge")).toBeCloseTo(0)

    gauges.set("opacity", 0.75)
    expect(gauges.get("opacity")).toBeCloseTo(0.75)
    gauges.set("opacity", 2) // beyond max
    expect(gauges.get("opacity")).toBeCloseTo(1)
    gauges.set("opacity", -1) // beyond min
    expect(gauges.get("opacity")).toBeCloseTo(0)

    gauges.set("health", 50)
    expect(gauges.get("health")).toBeCloseTo(50)
    gauges.set("health", 150) // beyond max
    expect(gauges.get("health")).toBeCloseTo(100)
    gauges.set("health", -50) // beyond min
    expect(gauges.get("health")).toBeCloseTo(0)

    gauges.set("charge", -0.5)
    expect(gauges.get("charge")).toBeCloseTo(-0.5)
    gauges.set("charge", 1.5) // beyond max
    expect(gauges.get("charge")).toBeCloseTo(1)
    gauges.set("charge", -2) // beyond min
    expect(gauges.get("charge")).toBeCloseTo(-1)

    gauges.setPercent("charge", 0.8)
    expect(gauges.get("charge")).toBeCloseTo(0.6)
    gauges.setPercent("charge", 1.2) // beyond max
    expect(gauges.get("charge")).toBeCloseTo(1)
    gauges.setPercent("charge", -0.2) // beyond min
    expect(gauges.get("charge")).toBeCloseTo(-1)

    gauges.add("charge", 0.2)
    expect(gauges.get("charge")).toBeCloseTo(-0.8)
    gauges.add("charge", -0.5) // beyond min
    expect(gauges.get("charge")).toBeCloseTo(-1)
    gauges.add("charge", 1.8)
    expect(gauges.get("charge")).toBeCloseTo(0.8)
    gauges.add("charge", 0.5) // beyond max
    expect(gauges.get("charge")).toBeCloseTo(1)

    gauges.addPercent("charge", -0.2)
    expect(gauges.get("charge")).toBeCloseTo(0.6)
    gauges.addPercent("charge", -1.5) // beyond min
    expect(gauges.get("charge")).toBeCloseTo(-1)
    gauges.addPercent("charge", 0.2)
    expect(gauges.get("charge")).toBeCloseTo(-0.6)
    gauges.addPercent("charge", 1.5) // beyond max
    expect(gauges.get("charge")).toBeCloseTo(1)
  })

  test("complains when creating a gauge with invalid bounds", () => {
    const world = new World()
    expect(() => new Agate.Gauges({ bad: { min: 10, max: 5 } })).toThrow()
    expect(() => new Agate.Gauges({ bad: { min: -Infinity } })).toThrow()
    expect(() => new Agate.Gauges({ bad: { max: Infinity } })).toThrow()
  })

  test("clamps the initial value if its out of bounds", () => {
    const world = new World()
    const gauges = new Agate.Gauges({
      aboveMax: { max: 1, value: 2 },
      belowMin: { min: -1, value: -2 },
    })

    expect(gauges.get("aboveMax")).toBeCloseTo(1)
    expect(gauges.get("belowMin")).toBeCloseTo(-1)
  })
})
