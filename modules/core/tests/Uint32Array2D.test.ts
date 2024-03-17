import { describe, expect, test } from "vitest"
import { Uint32Array2D } from "../src/Uint32Array2D"
import { Vector2 } from "../src/Vector2"

describe("Uint32Array2D", () => {
  test("can get elements at specific x/y indices", () => {
    const a = Uint32Array2D.fromArrayLiterals([
      [1, 2, 3],
      [4, 5, 6],
    ])

    expect(a.get(0, 0)).toBe(1)
    expect(a.get(1, 0)).toBe(2)
    expect(a.get(2, 0)).toBe(3)
    expect(a.get(0, 1)).toBe(4)
    expect(a.get(1, 1)).toBe(5)
    expect(a.get(2, 1)).toBe(6)

    // Out-of-bounds access implicitly gives zero.
    expect(a.get(3, 0)).toBe(0)
    expect(a.get(0, 2)).toBe(0)
  })

  test("can use a given offset for indices", () => {
    const a = Uint32Array2D.fromArrayLiterals(
      [
        [1, 2, 3],
        [4, 5, 6],
      ],
      new Vector2(1, 2),
    )

    expect(a.get(1, 2)).toBe(1)
    expect(a.get(2, 2)).toBe(2)
    expect(a.get(3, 2)).toBe(3)
    expect(a.get(1, 3)).toBe(4)
    expect(a.get(2, 3)).toBe(5)
    expect(a.get(3, 3)).toBe(6)

    // Out-of-bounds access implicitly gives zero.
    expect(a.get(0, 0)).toBe(0)
    expect(a.get(4, 0)).toBe(0)
    expect(a.get(0, 4)).toBe(0)
  })

  test("can set elements at specific x/y indices", () => {
    const a = new Uint32Array2D(new Vector2(3, 2), new Vector2(1, 2))

    a.set(1, 2, 7)
    a.set(2, 2, 8)
    a.set(3, 2, 9)
    a.set(1, 3, 10)
    a.set(2, 3, 11)
    // skip setting the last element - leaving it as zero

    expect(a.get(1, 2)).toBe(7)
    expect(a.get(2, 2)).toBe(8)
    expect(a.get(3, 2)).toBe(9)
    expect(a.get(1, 3)).toBe(10)
    expect(a.get(2, 3)).toBe(11)
    expect(a.get(3, 3)).toBe(0)

    // Out-of-bounds setting throws an error.
    expect(() => a.set(0, 0, 12)).toThrowError()
    expect(() => a.set(4, 0, 13)).toThrowError()
    expect(() => a.set(0, 4, 14)).toThrowError()
  })

  test("can iterate over all elements", () => {
    const a = Uint32Array2D.fromArrayLiterals(
      [
        [7, 8, 9],
        [10, 11, 12],
      ],
      new Vector2(1, 2),
    )

    const result: [number, number, number][] = []
    a.forEach((value, x, y) => result.push([value, x, y]))

    expect(result).toEqual([
      [7, 1, 2],
      [8, 2, 2],
      [9, 3, 2],
      [10, 1, 3],
      [11, 2, 3],
      [12, 3, 3],
    ])
  })

  test("can be cloned without offset (filling in top-left with zeros)", () => {
    const a = Uint32Array2D.fromArrayLiterals(
      [
        [10, 11, 12],
        [13, 14, 15],
        [16, 17, 18],
      ],
      new Vector2(1, 2),
    ).cloneWithoutOffset()

    expect(a.size).toEqual(new Vector2(4, 5))
    expect(a.offset).toEqual(new Vector2(0, 0))

    expect(a.get(0, 0)).toBe(0)
    expect(a.get(1, 0)).toBe(0)
    expect(a.get(2, 0)).toBe(0)
    expect(a.get(3, 0)).toBe(0)
    expect(a.get(0, 1)).toBe(0)
    expect(a.get(1, 1)).toBe(0)
    expect(a.get(2, 1)).toBe(0)
    expect(a.get(3, 1)).toBe(0)
    expect(a.get(0, 2)).toBe(0)
    expect(a.get(1, 2)).toBe(10)
    expect(a.get(2, 2)).toBe(11)
    expect(a.get(3, 2)).toBe(12)
    expect(a.get(0, 3)).toBe(0)
    expect(a.get(1, 3)).toBe(13)
    expect(a.get(2, 3)).toBe(14)
    expect(a.get(3, 3)).toBe(15)
    expect(a.get(0, 4)).toBe(0)
    expect(a.get(1, 4)).toBe(16)
    expect(a.get(2, 4)).toBe(17)
    expect(a.get(3, 4)).toBe(18)
  })
})
