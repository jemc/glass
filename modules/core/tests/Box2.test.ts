import { describe, expect, test } from "@jest/globals"
import { Box2, ReadBox2, MutableBox2 } from "../src/Box2"
import { Vector2, MutableVector2 } from "../src/Vector2"

expect.addEqualityTesters([
  function (a, b) {
    if (!(a instanceof Box2 || a instanceof MutableBox2)) return false
    if (!(b instanceof Box2 || b instanceof MutableBox2)) return false
    return a.isEqualTo(b)
  },
])

describe("Box2", () => {
  test("has distinct mutable/immutable variants, but both are readable", () => {
    const immutableIsReadable: ReadBox2 = new Box2()
    const mutableIsReadable: ReadBox2 = new MutableBox2()

    // @ts-expect-error
    const immutableIsNotMutable: MutableBox2 = new Box2()
    // @ts-expect-error
    const mutableIsNotImmutable: Box2 = new MutableBox2()
  })

  test("can't be created with wrong mutability of inner vectors", () => {
    // Box2 is immutable, and can only be created with immutable vectors.
    new Box2(new Vector2(0, 0), new Vector2(0, 0))
    // @ts-expect-error
    new Box2(new MutableVector2(0, 0), new Vector2(0, 0))
    // @ts-expect-error
    new Box2(new Vector2(0, 0), new MutableVector2(0, 0))

    // MutableBox2 is mutable, and can only be created with mutable vectors.
    new MutableBox2(new MutableVector2(0, 0), new MutableVector2(0, 0))
    // @ts-expect-error
    new MutableBox2(new MutableVector2(0, 0), new Vector2(0, 0))
    // @ts-expect-error
    new MutableBox2(new Vector2(0, 0), new MutableVector2(0, 0))
  })

  test("compares equality among readable boxes", () => {
    const a = new Box2(new Vector2(3, 4), new Vector2(5, 6))
    const b = new MutableBox2(
      new MutableVector2(3, 4),
      new MutableVector2(5, 6),
    )
    const c = new Box2(new Vector2(30, 4), new Vector2(5, 6))
    const d = new Box2(new Vector2(3, 40), new Vector2(5, 6))
    const e = new Box2(new Vector2(3, 4), new Vector2(50, 6))
    const f = new Box2(new Vector2(3, 4), new Vector2(5, 60))

    expect(a.isEqualTo(b)).toBe(true)
    expect(b.isEqualTo(a)).toBe(true)

    expect(a.isEqualTo(c)).toBe(false)
    expect(a.isEqualTo(d)).toBe(false)
    expect(a.isEqualTo(e)).toBe(false)
    expect(a.isEqualTo(f)).toBe(false)
    expect(c.isEqualTo(a)).toBe(false)
    expect(d.isEqualTo(a)).toBe(false)
    expect(e.isEqualTo(a)).toBe(false)
    expect(f.isEqualTo(a)).toBe(false)

    expect(b.isEqualTo(c)).toBe(false)
    expect(b.isEqualTo(d)).toBe(false)
    expect(b.isEqualTo(e)).toBe(false)
    expect(b.isEqualTo(f)).toBe(false)
    expect(c.isEqualTo(b)).toBe(false)
    expect(d.isEqualTo(b)).toBe(false)
    expect(e.isEqualTo(b)).toBe(false)
    expect(f.isEqualTo(b)).toBe(false)
  })

  test("calculates x and y coordinates of its defining points", () => {
    const a: ReadBox2 = new Box2(new Vector2(3, 4), new Vector2(5, 7))

    expect(a.center.x).toBe(3)
    expect(a.center.y).toBe(4)
    expect(a.radii.x).toBe(5)
    expect(a.radii.y).toBe(7)

    expect(a.x).toBe(3)
    expect(a.y).toBe(4)

    expect(a.x0).toBe(-2)
    expect(a.x1).toBe(8)
    expect(a.y0).toBe(-3)
    expect(a.y1).toBe(11)

    expect(a.width).toBe(10)
    expect(a.height).toBe(14)
  })

  test("checks if it contains a given point", () => {
    const a: ReadBox2 = new Box2(new Vector2(3, 4), new Vector2(5, 7))

    expect(a.doesContain(new Vector2(a.center.x, a.center.y))).toBe(true)

    expect(a.doesContain(new Vector2(a.x0, a.y0))).toBe(true) // top-left
    expect(a.doesContain(new Vector2(a.x0, a.y1))).toBe(true) // bottom-left
    expect(a.doesContain(new Vector2(a.x1, a.y0))).toBe(true) // top-right
    expect(a.doesContain(new Vector2(a.x1, a.y1))).toBe(true) // bottom-right

    expect(a.doesContain(new Vector2(a.x0 - 1, a.y))).toBe(false) // beyond left
    expect(a.doesContain(new Vector2(a.x1 + 1, a.y))).toBe(false) // beyond right
    expect(a.doesContain(new Vector2(a.x, a.y0 - 1))).toBe(false) // beyond top
    expect(a.doesContain(new Vector2(a.x, a.y1 + 1))).toBe(false) // beyond bottom
  })

  test("can be created from left, top, width, and height", () => {
    const a = Box2.fromLeftTopWidthHeight(-2, -3, 10, 14)

    expect(a.x).toBe(3)
    expect(a.y).toBe(4)
    expect(a.width).toBe(10)
    expect(a.height).toBe(14)

    expect(a).toEqual(new Box2(new Vector2(3, 4), new Vector2(5, 7)))
  })

  describe("when immutable", () => {
    test("cannot be modified in place", () => {
      const a = new Box2(new Vector2(3, 4), new Vector2(5, 7))

      // @ts-expect-error
      a.center = new Vector2(1, 2)
      // @ts-expect-error
      a.radii = new Vector2(8, 9)

      // @ts-expect-error
      a.center.x = 1
      // @ts-expect-error
      a.center.y = 2
      // @ts-expect-error
      a.radii.x = 8
      // @ts-expect-error
      a.radii.y = 9
    })
  })

  describe("when mutable", () => {
    test("can be modified in place", () => {
      const a = new MutableBox2()

      a.center = new MutableVector2(1, 2)
      a.radii = new MutableVector2(8, 9)

      expect(a).toEqual(new Box2(new Vector2(1, 2), new Vector2(8, 9)))

      a.center.x = 10
      a.center.y = 11
      a.radii.x = 12
      a.radii.y = 13

      expect(a).toEqual(new Box2(new Vector2(10, 11), new Vector2(12, 13)))

      const copySource = new Box2(new Vector2(14, 15), new Vector2(16, 17))
      expect(a.copyFrom(copySource)).toEqual(copySource)
      expect(a).toEqual(copySource)
    })
  })
})
