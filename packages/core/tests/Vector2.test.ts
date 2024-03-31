import { describe, expect, test } from "vitest"
import { Vector2, ReadVector2, MutableVector2 } from "../src/Vector2"

expect.addEqualityTesters([
  function (a, b) {
    if (!(a instanceof Vector2 || a instanceof MutableVector2)) return false
    if (!(b instanceof Vector2 || b instanceof MutableVector2)) return false
    return a.isEqualTo(b)
  },
])

describe("Vector2", () => {
  test("has distinct mutable/immutable variants, but both are readable", () => {
    const immutableIsReadable: ReadVector2 = new Vector2(0, 0)
    const mutableIsReadable: ReadVector2 = new MutableVector2(0, 0)

    // @ts-expect-error
    const immutableIsNotMutable: MutableVector2 = new Vector2(0, 0)
    // @ts-expect-error
    const mutableIsNotImmutable: Vector2 = new MutableVector2(0, 0)
  })

  test("compares equality among readable vectors", () => {
    const a = new Vector2(1, 2)
    const b = new MutableVector2(1, 2)
    const c = new Vector2(1, 4)
    const d = new Vector2(3, 2)

    expect(a.isEqualTo(b)).toBe(true)
    expect(b.isEqualTo(a)).toBe(true)

    expect(a.isEqualTo(c)).toBe(false)
    expect(a.isEqualTo(d)).toBe(false)
    expect(c.isEqualTo(a)).toBe(false)
    expect(d.isEqualTo(a)).toBe(false)

    expect(b.isEqualTo(c)).toBe(false)
    expect(b.isEqualTo(d)).toBe(false)
    expect(c.isEqualTo(b)).toBe(false)
    expect(d.isEqualTo(b)).toBe(false)
  })

  test("can be cloned as either immutable or mutable", () => {
    const a: ReadVector2 = new Vector2(1, 2)
    const b: Vector2 = a.clone()
    const c: MutableVector2 = a.cloneMutable()

    expect(a).toEqual(b)
    expect(a).toEqual(c)
  })

  test("calculates magnitude", () => {
    const a: ReadVector2 = new Vector2(3, 4)

    expect(a.magnitude()).toBe(5)
    expect(a.magnitudeSquared()).toBe(25)
  })

  test("calculates dot or cross product", () => {
    const a: ReadVector2 = new Vector2(3, 4)
    const b: ReadVector2 = new Vector2(5, 6)

    expect(a.dot(b)).toBe(39)
    expect(a.cross(b)).toBe(-2)
  })

  test("can be added or subtracted", () => {
    const a: ReadVector2 = new Vector2(3, 4)
    const b: ReadVector2 = new Vector2(5, 6)

    expect(a.plus(b)).toEqual(new Vector2(8, 10))
    expect(a.minus(b)).toEqual(new Vector2(-2, -2))
  })

  test("can be scaled", () => {
    const a: ReadVector2 = new Vector2(3, 4)

    expect(a.scale(2).isEqualTo(new Vector2(6, 8))).toBe(true)
  })

  describe("when immutable", () => {
    test("cannot be modified in place", () => {
      const a = new Vector2(3, 4)

      // @ts-expect-error
      a.x = 5
      // @ts-expect-error
      a.y = 6
    })
  })

  describe("when mutable", () => {
    test("can be modified in place", () => {
      const a = new MutableVector2(3, 4)

      a.x = 5
      a.y = 6
      expect(a).toEqual(new Vector2(5, 6))

      expect(a.setTo(7, 8)).toEqual(new Vector2(7, 8))
      expect(a).toEqual(new Vector2(7, 8))

      expect(a.copyFrom(new Vector2(9, 10))).toEqual(new Vector2(9, 10))
      expect(a).toEqual(new Vector2(9, 10))
    })

    test("can be pointed in the direction of a given angle", () => {
      const a = new MutableVector2()

      expect(a.setUnitRotationDegrees(0)).toEqual(new Vector2(1, 0))
      expect(a).toEqual(new Vector2(1, 0))
      expect(a.getUnitRotationDegrees()).toBeCloseTo(0)

      a.setUnitRotationDegrees(90)
      expect(a.getUnitRotationDegrees()).toBeCloseTo(90)
      expect(a.x).toBeCloseTo(0)
      expect(a.y).toBeCloseTo(1)
      a.setUnitRotationRadians(Math.PI / 2)
      expect(a.getUnitRotationRadians()).toBeCloseTo(Math.PI / 2)
      expect(a.x).toBeCloseTo(0)
      expect(a.y).toBeCloseTo(1)

      a.setUnitRotationDegrees(180)
      expect(a.getUnitRotationDegrees()).toBeCloseTo(180)
      expect(a.x).toBeCloseTo(-1)
      expect(a.y).toBeCloseTo(0)
      a.setUnitRotationRadians(Math.PI)
      expect(a.getUnitRotationRadians()).toBeCloseTo(Math.PI)
      expect(a.x).toBeCloseTo(-1)
      expect(a.y).toBeCloseTo(0)

      a.setUnitRotationDegrees(270)
      expect(a.getUnitRotationDegrees()).toBeCloseTo(-90)
      expect(a.x).toBeCloseTo(0)
      expect(a.y).toBeCloseTo(-1)
      a.setUnitRotationRadians((3 * Math.PI) / 2)
      expect(a.getUnitRotationRadians()).toBeCloseTo(-Math.PI / 2)
      expect(a.x).toBeCloseTo(0)
      expect(a.y).toBeCloseTo(-1)

      a.setUnitRotationDegrees(360)
      expect(a.getUnitRotationDegrees()).toBeCloseTo(0)
      expect(a.x).toBeCloseTo(1)
      expect(a.y).toBeCloseTo(0)
      a.setUnitRotationRadians(2 * Math.PI)
      expect(a.getUnitRotationRadians()).toBeCloseTo(0)
      expect(a.x).toBeCloseTo(1)
      expect(a.y).toBeCloseTo(0)

      a.setUnitRotationDegrees(450)
      expect(a.getUnitRotationDegrees()).toBeCloseTo(90)
      expect(a.x).toBeCloseTo(0)
      expect(a.y).toBeCloseTo(1)
      a.setUnitRotationRadians((5 * Math.PI) / 2)
      expect(a.getUnitRotationRadians()).toBeCloseTo(Math.PI / 2)
      expect(a.x).toBeCloseTo(0)
      expect(a.y).toBeCloseTo(1)

      a.setUnitRotationDegrees(-90)
      expect(a.getUnitRotationDegrees()).toBeCloseTo(-90)
      expect(a.x).toBeCloseTo(0)
      expect(a.y).toBeCloseTo(-1)
      a.setUnitRotationRadians(-Math.PI / 2)
      expect(a.getUnitRotationRadians()).toBeCloseTo(-Math.PI / 2)
      expect(a.x).toBeCloseTo(0)
      expect(a.y).toBeCloseTo(-1)
    })

    test("can round down to the nearest lower integer (floored)", () => {
      const a = new MutableVector2(3.5, 4.5)

      expect(a.toFloor()).toEqual(new Vector2(3, 4))
      expect(a).toEqual(new Vector2(3, 4))

      expect(a.setTo(3.9, 4.9).toFloor()).toEqual(new Vector2(3, 4))
      expect(a.setTo(-3.1, -4.1).toFloor()).toEqual(new Vector2(-4, -5))
    })

    test("can round to the nearest integer, capturing residuals", () => {
      const a = new MutableVector2(3.2, 4.7)
      const residuals = new MutableVector2()

      expect(a.toRoundedCapturingResiduals(residuals)).toEqual(
        new Vector2(3, 5),
      )
      expect(a).toEqual(new Vector2(3, 5))
      expect(residuals.x).toBeCloseTo(0.2)
      expect(residuals.y).toBeCloseTo(-0.3)
    })

    test("can be added, subtracted, or multiplied in place", () => {
      const a = new MutableVector2(3, 4)
      const b: ReadVector2 = new Vector2(5, 6)

      expect(a.plusEquals(b)).toEqual(new Vector2(8, 10))
      expect(a).toEqual(new Vector2(8, 10))

      expect(a.minusEquals(b)).toEqual(new Vector2(3, 4))
      expect(a).toEqual(new Vector2(3, 4))

      expect(a.multiplyEquals(b)).toEqual(new Vector2(15, 24))
      expect(a).toEqual(new Vector2(15, 24))
    })

    test("can be scaled or inversely scaled in place", () => {
      const a = new MutableVector2(3, 4)

      expect(a.scaleEquals(2)).toEqual(new Vector2(6, 8))
      expect(a).toEqual(new Vector2(6, 8))

      expect(a.inverseScaleEquals(2)).toEqual(new Vector2(3, 4))
      expect(a).toEqual(new Vector2(3, 4))
    })

    test("can add a scaled vector in place", () => {
      const a = new MutableVector2(3, 4)
      const b: ReadVector2 = new Vector2(5, 6)

      expect(a.plusScaledEquals(b, 2)).toEqual(new Vector2(13, 16))
      expect(a).toEqual(new Vector2(13, 16))
    })
  })
})
