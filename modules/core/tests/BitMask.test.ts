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
})
