import { describe, expect, test } from "@jest/globals"
import { NESNoiseProcessor } from "../src/NESNoise"

describe("NESNoiseProcessor", () => {
  const SAMPLE_RATE = 44100

  function showWaveform(output: Float32Array) {
    const AMPLITUDE = 32 // spaces in string output

    return [...output]
      .map((n) => {
        expect(n).toBeGreaterThanOrEqual(-1)
        expect(n).toBeLessThanOrEqual(1)

        const spaces = Math.round(n * AMPLITUDE + AMPLITUDE)
        if (spaces < AMPLITUDE) {
          return (
            "|" +
            " ".repeat(spaces) +
            "X" +
            " ".repeat(AMPLITUDE - spaces - 1) +
            "|" +
            " ".repeat(AMPLITUDE) +
            "|"
          )
        } else if (spaces > AMPLITUDE) {
          return (
            "|" +
            " ".repeat(AMPLITUDE) +
            "|" +
            " ".repeat(spaces - AMPLITUDE - 1) +
            "X" +
            " ".repeat(AMPLITUDE - (spaces - AMPLITUDE)) +
            "|"
          )
        } else {
          return "|" + " ".repeat(AMPLITUDE) + "X" + " ".repeat(AMPLITUDE) + "|"
        }
      })
      .join("\n")
  }

  function generalTest(
    count: number,
    freq: number[],
    gain: number[],
    timbre: number[],
  ) {
    const processor = new NESNoiseProcessor()
    const output = new Float32Array(count)
    const result = processor.process([[]], [[output]], {
      freq: new Float32Array(freq),
      gain: new Float32Array(gain),
      timbre: new Float32Array(timbre),
    })
    expect(result).toBe(true)

    return showWaveform(output)
  }

  function timbreTest(timbre: number) {
    const WAVELENGTH = 1 // samples to capture

    return generalTest(93 * 2, [SAMPLE_RATE / WAVELENGTH], [1], [timbre])
  }

  test("generates white-ish noise with timbre of 0.0", () => {
    expect(timbreTest(0)).toEqual(
      [
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
      ].join("\n"),
    )
  })

  test("generates rather periodic noise with timbre of 5.0", () => {
    expect(timbreTest(5)).toEqual(
      [
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|                                |                               X|",
      ].join("\n"),
    )
  })
})
