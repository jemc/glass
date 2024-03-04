import { describe, expect, test } from "@jest/globals"
import { BitMask } from "../src/BitMask"

describe("BitMask", () => {
  test("allows setting bits and checking for subsets", () => {
    const foo = new BitMask()
    const bar = new BitMask()

    foo.set(0, true)
    foo.set(1, true)
    foo.set(2, true)
    foo.set(100, true)
    foo.set(101, true)

    bar.set(0, true)
    bar.set(1, true)
    bar.set(2, true)
    bar.set(100, true)
    bar.set(101, true)

    expect(foo.isSuperSetOf(bar)).toBe(true)
    expect(bar.isSuperSetOf(foo)).toBe(true)

    foo.set(100, false)

    expect(foo.isSuperSetOf(bar)).toBe(false)
    expect(bar.isSuperSetOf(foo)).toBe(true)

    bar.set(101, false)

    expect(foo.isSuperSetOf(bar)).toBe(false)
    expect(bar.isSuperSetOf(foo)).toBe(false)

    bar.clear()

    expect(foo.isSuperSetOf(bar)).toBe(true)
    expect(bar.isSuperSetOf(foo)).toBe(false)
  })

  test("can iterate over the bits in the mask", () => {
    const bits = new BitMask()

    bits.set(0, true)
    bits.set(3, true)
    bits.set(6, true)
    bits.set(18, true)

    expect([...bits.bits(1, 20)]).toEqual([
      [false, 1],
      [false, 2],
      [true, 3],
      [false, 4],
      [false, 5],
      [true, 6],
      [false, 7],
      [false, 8],
      [false, 9],
      [false, 10],
      [false, 11],
      [false, 12],
      [false, 13],
      [false, 14],
      [false, 15],
      [false, 16],
      [false, 17],
      [true, 18],
      [false, 19],
    ])

    expect([...bits.oneBits(1, 20)]).toEqual([3, 6, 18])
  })

  test("can count the active bits in the mask", () => {
    const bits = new BitMask()

    bits.set(0, true)
    bits.set(3, true)
    bits.set(6, true)
    bits.set(18, true)

    expect(bits.countOneBits()).toBe(4)
  })

  test("can express the bits as a number", () => {
    const bits = new BitMask()

    bits.set(0, true)
    bits.set(3, true)

    expect(bits.toNumber()).toBe(9)

    bits.set(18, true)
    bits.set(19, true)
    bits.set(61, true)
    bits.set(62, true)

    expect(bits.toNumber()).toBe(
      Math.pow(2, 0) +
        Math.pow(2, 3) +
        Math.pow(2, 18) +
        Math.pow(2, 19) +
        Math.pow(2, 61) +
        Math.pow(2, 62),
    )
  })

  test("allows rotating bits (either all bits or a subset of them)", () => {
    const nine = new BitMask()

    nine.set(0, true)
    nine.set(3, true)
    expect(nine.rotatedRight(1, 0, 5).toNumber()).toBe(0b10100)
    expect(nine.rotatedRight(1, 0, 15).toNumber()).toBe(0b100000000000100)
    expect(nine.rotatedRight(1, 0, 16).toNumber()).toBe(0b1000000000000100)
    expect(nine.rotatedRight(1, 0, 17).toNumber()).toBe(0b10000000000000100)
    expect(nine.rotatedRight(1, 0, 20).toNumber()).toBe(0b10000000000000000100)
    expect(nine.rotatedRight(1, 1, 3).toNumber()).toBe(0b1001)
    expect(nine.rotatedRight(1, 1, 4).toNumber()).toBe(0b0101)
    expect(nine.rotatedRight(1, 3, 4).toNumber()).toBe(0b1001)
    expect(nine.rotatedRight(1, 3, 5).toNumber()).toBe(0b10001)
  })
})
