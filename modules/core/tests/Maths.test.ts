import { describe, expect, test } from "@jest/globals"
import {
  toRadians,
  toDegrees,
  roundUpToPowerOfTwo,
  isPowerOfTwo,
} from "../src/Maths"

describe("roundUpToPowerOfTwo", () => {
  test("rounds up to the nearest power of two", () => {
    const inputs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const outputs = [0, 1, 2, 4, 4, 8, 8, 8, 8, 16]

    expect(inputs.map(roundUpToPowerOfTwo)).toEqual(outputs)
  })
})

describe("isPowerOfTwo", () => {
  test("checks if the number is a power of two", () => {
    const inputs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const outputs = [
      true,
      true,
      true,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
    ]

    expect(inputs.map(isPowerOfTwo)).toEqual(outputs)
  })
})

describe("toRadians", () => {
  test("converts degrees to radians", () => {
    expect(toRadians(0)).toBe(0)
    expect(toRadians(90)).toBe(Math.PI / 2)
    expect(toRadians(180)).toBe(Math.PI)
    expect(toRadians(360)).toBe(2 * Math.PI)
    expect(toRadians(720)).toBe(4 * Math.PI)
    expect(toRadians(-360)).toBe(-2 * Math.PI)
  })
})

describe("toDegrees", () => {
  test("converts radians to degrees", () => {
    expect(toDegrees(0)).toBe(0)
    expect(toDegrees(Math.PI / 2)).toBe(90)
    expect(toDegrees(Math.PI)).toBe(180)
    expect(toDegrees(2 * Math.PI)).toBe(360)
    expect(toDegrees(4 * Math.PI)).toBe(720)
    expect(toDegrees(-2 * Math.PI)).toBe(-360)
  })
})
