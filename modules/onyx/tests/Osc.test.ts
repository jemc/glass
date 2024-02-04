import { describe, expect, test } from "@jest/globals"
import { OscAudioWorkletProcessor } from "../src/Osc"

describe("OscAudioWorkletProcessor", () => {
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
    vibrato: number[],
    vibratoFreq: number[],
  ) {
    const processor = new OscAudioWorkletProcessor()
    const output = new Float32Array(count)
    const result = processor.process([[]], [[output]], {
      freq: new Float32Array(freq),
      gain: new Float32Array(gain),
      timbre: new Float32Array(timbre),
      vibrato: new Float32Array(vibrato),
      vibratoFreq: new Float32Array(vibratoFreq),
    })
    expect(result).toBe(true)

    return showWaveform(output)
  }

  function timbreTest(timbre: number) {
    const WAVELENGTH = 32 // samples to capture

    return generalTest(
      WAVELENGTH,
      [SAMPLE_RATE / WAVELENGTH],
      [1],
      [timbre],
      [0],
      [0],
    )
  }

  test("generates a sine wave with timbre of 0.0", () => {
    expect(timbreTest(0)).toEqual(
      [
        "|                                |     X                          |",
        "|                                |           X                    |",
        "|                                |                 X              |",
        "|                                |                      X         |",
        "|                                |                          X     |",
        "|                                |                             X  |",
        "|                                |                              X |",
        "|                                |                               X|",
        "|                                |                              X |",
        "|                                |                             X  |",
        "|                                |                          X     |",
        "|                                |                      X         |",
        "|                                |                 X              |",
        "|                                |           X                    |",
        "|                                |     X                          |",
        "|                                X                                |",
        "|                          X     |                                |",
        "|                    X           |                                |",
        "|              X                 |                                |",
        "|         X                      |                                |",
        "|     X                          |                                |",
        "|  X                             |                                |",
        "| X                              |                                |",
        "|X                               |                                |",
        "| X                              |                                |",
        "|  X                             |                                |",
        "|     X                          |                                |",
        "|         X                      |                                |",
        "|              X                 |                                |",
        "|                    X           |                                |",
        "|                          X     |                                |",
        "|                                X                                |",
      ].join("\n"),
    )
  })

  test("generates a slightly triangular sine wave with timbre of 0.33", () => {
    expect(timbreTest(0.33)).toEqual(
      [
        "|                                |     X                          |",
        "|                                |          X                     |",
        "|                                |               X                |",
        "|                                |                   X            |",
        "|                                |                       X        |",
        "|                                |                           X    |",
        "|                                |                             X  |",
        "|                                |                               X|",
        "|                                |                             X  |",
        "|                                |                           X    |",
        "|                                |                       X        |",
        "|                                |                   X            |",
        "|                                |               X                |",
        "|                                |          X                     |",
        "|                                |     X                          |",
        "|                                X                                |",
        "|                          X     |                                |",
        "|                     X          |                                |",
        "|                X               |                                |",
        "|            X                   |                                |",
        "|        X                       |                                |",
        "|    X                           |                                |",
        "|  X                             |                                |",
        "|X                               |                                |",
        "|  X                             |                                |",
        "|    X                           |                                |",
        "|        X                       |                                |",
        "|            X                   |                                |",
        "|                X               |                                |",
        "|                     X          |                                |",
        "|                          X     |                                |",
        "|                                X                                |",
      ].join("\n"),
    )
  })

  test("generates a slightly rounded triangle wave with timbre of 0.66", () => {
    expect(timbreTest(0.66)).toEqual(
      [
        "|                                |    X                           |",
        "|                                |        X                       |",
        "|                                |             X                  |",
        "|                                |                 X              |",
        "|                                |                     X          |",
        "|                                |                         X      |",
        "|                                |                            X   |",
        "|                                |                               X|",
        "|                                |                            X   |",
        "|                                |                         X      |",
        "|                                |                     X          |",
        "|                                |                 X              |",
        "|                                |             X                  |",
        "|                                |        X                       |",
        "|                                |    X                           |",
        "|                                X                                |",
        "|                           X    |                                |",
        "|                       X        |                                |",
        "|                  X             |                                |",
        "|              X                 |                                |",
        "|          X                     |                                |",
        "|      X                         |                                |",
        "|   X                            |                                |",
        "|X                               |                                |",
        "|   X                            |                                |",
        "|      X                         |                                |",
        "|          X                     |                                |",
        "|              X                 |                                |",
        "|                  X             |                                |",
        "|                       X        |                                |",
        "|                           X    |                                |",
        "|                                X                                |",
      ].join("\n"),
    )
  })

  test("generates a triangle wave with timbre of 1.0", () => {
    expect(timbreTest(1)).toEqual(
      [
        "|                                |   X                            |",
        "|                                |       X                        |",
        "|                                |           X                    |",
        "|                                |               X                |",
        "|                                |                   X            |",
        "|                                |                       X        |",
        "|                                |                           X    |",
        "|                                |                               X|",
        "|                                |                           X    |",
        "|                                |                       X        |",
        "|                                |                   X            |",
        "|                                |               X                |",
        "|                                |           X                    |",
        "|                                |       X                        |",
        "|                                |   X                            |",
        "|                                X                                |",
        "|                            X   |                                |",
        "|                        X       |                                |",
        "|                    X           |                                |",
        "|                X               |                                |",
        "|            X                   |                                |",
        "|        X                       |                                |",
        "|    X                           |                                |",
        "|X                               |                                |",
        "|    X                           |                                |",
        "|        X                       |                                |",
        "|            X                   |                                |",
        "|                X               |                                |",
        "|                    X           |                                |",
        "|                        X       |                                |",
        "|                            X   |                                |",
        "|                                X                                |",
      ].join("\n"),
    )
  })

  test("generates a slightly saw-y triangle wave with timbre of 1.25", () => {
    expect(timbreTest(1.25)).toEqual(
      [
        "|                                |    X                           |",
        "|                                |          X                     |",
        "|                                |               X                |",
        "|                                |                    X           |",
        "|                                |                          X     |",
        "|                                |                               X|",
        "|                                |                            X   |",
        "|                                |                         X      |",
        "|                                |                     X          |",
        "|                                |                  X             |",
        "|                                |               X                |",
        "|                                |            X                   |",
        "|                                |         X                      |",
        "|                                |     X                          |",
        "|                                |  X                             |",
        "|                                X                                |",
        "|                             X  |                                |",
        "|                          X     |                                |",
        "|                      X         |                                |",
        "|                   X            |                                |",
        "|                X               |                                |",
        "|             X                  |                                |",
        "|          X                     |                                |",
        "|      X                         |                                |",
        "|   X                            |                                |",
        "|X                               |                                |",
        "|     X                          |                                |",
        "|           X                    |                                |",
        "|                X               |                                |",
        "|                     X          |                                |",
        "|                           X    |                                |",
        "|                                X                                |",
      ].join("\n"),
    )
  })

  test("generates a slightly triangular saw wave with timbre of 1.75", () => {
    expect(timbreTest(1.75)).toEqual(
      [
        "|                                |               X                |",
        "|                                |                               X|",
        "|                                |                             X  |",
        "|                                |                          X     |",
        "|                                |                        X       |",
        "|                                |                      X         |",
        "|                                |                    X           |",
        "|                                |                 X              |",
        "|                                |               X                |",
        "|                                |             X                  |",
        "|                                |          X                     |",
        "|                                |        X                       |",
        "|                                |      X                         |",
        "|                                |    X                           |",
        "|                                | X                              |",
        "|                                X                                |",
        "|                              X |                                |",
        "|                           X    |                                |",
        "|                         X      |                                |",
        "|                       X        |                                |",
        "|                     X          |                                |",
        "|                  X             |                                |",
        "|                X               |                                |",
        "|              X                 |                                |",
        "|           X                    |                                |",
        "|         X                      |                                |",
        "|       X                        |                                |",
        "|     X                          |                                |",
        "|  X                             |                                |",
        "|X                               |                                |",
        "|                X               |                                |",
        "|                                X                                |",
      ].join("\n"),
    )
  })

  test("generates a sawtooth wave with timbre of 2.0", () => {
    expect(timbreTest(2.0)).toEqual(
      [
        "|                                |                             X  |",
        "|                                |                           X    |",
        "|                                |                         X      |",
        "|                                |                       X        |",
        "|                                |                     X          |",
        "|                                |                   X            |",
        "|                                |                 X              |",
        "|                                |               X                |",
        "|                                |             X                  |",
        "|                                |           X                    |",
        "|                                |         X                      |",
        "|                                |       X                        |",
        "|                                |     X                          |",
        "|                                |   X                            |",
        "|                                | X                              |",
        "|                                X                                |",
        "|                              X |                                |",
        "|                            X   |                                |",
        "|                          X     |                                |",
        "|                        X       |                                |",
        "|                      X         |                                |",
        "|                    X           |                                |",
        "|                  X             |                                |",
        "|                X               |                                |",
        "|              X                 |                                |",
        "|            X                   |                                |",
        "|          X                     |                                |",
        "|        X                       |                                |",
        "|      X                         |                                |",
        "|    X                           |                                |",
        "|  X                             |                                |",
        "|X                               |                                |",
      ].join("\n"),
    )
  })

  test("generates a slightly squarey sawtooth wave with timbre of 2.25", () => {
    expect(timbreTest(2.25)).toEqual(
      [
        "|                                |                              X |",
        "|                                |                            X   |",
        "|                                |                           X    |",
        "|                                |                         X      |",
        "|                                |                        X       |",
        "|                                |                      X         |",
        "|                                |                     X          |",
        "|                                |                   X            |",
        "|                                |                  X             |",
        "|                                |                X               |",
        "|                                |               X                |",
        "|                                |             X                  |",
        "|                                |            X                   |",
        "|                                |          X                     |",
        "|                                |         X                      |",
        "|                                |       X                        |",
        "|                       X        |                                |",
        "|                     X          |                                |",
        "|                    X           |                                |",
        "|                  X             |                                |",
        "|                 X              |                                |",
        "|               X                |                                |",
        "|              X                 |                                |",
        "|            X                   |                                |",
        "|           X                    |                                |",
        "|         X                      |                                |",
        "|        X                       |                                |",
        "|      X                         |                                |",
        "|     X                          |                                |",
        "|   X                            |                                |",
        "|  X                             |                                |",
        "|X                               |                                |",
      ].join("\n"),
    )
  })

  test("generates a slightly saw-y square wave with timbre of 2.75", () => {
    expect(timbreTest(2.75)).toEqual(
      [
        "|                                |                               X|",
        "|                                |                              X |",
        "|                                |                              X |",
        "|                                |                             X  |",
        "|                                |                             X  |",
        "|                                |                            X   |",
        "|                                |                            X   |",
        "|                                |                           X    |",
        "|                                |                           X    |",
        "|                                |                          X     |",
        "|                                |                          X     |",
        "|                                |                         X      |",
        "|                                |                         X      |",
        "|                                |                        X       |",
        "|                                |                        X       |",
        "|                                |                       X        |",
        "|        X                       |                                |",
        "|       X                        |                                |",
        "|       X                        |                                |",
        "|      X                         |                                |",
        "|      X                         |                                |",
        "|     X                          |                                |",
        "|     X                          |                                |",
        "|    X                           |                                |",
        "|    X                           |                                |",
        "|   X                            |                                |",
        "|   X                            |                                |",
        "|  X                             |                                |",
        "|  X                             |                                |",
        "| X                              |                                |",
        "| X                              |                                |",
        "|X                               |                                |",
      ].join("\n"),
    )
  })

  test("generates a square wave with timbre of 3.0", () => {
    expect(timbreTest(3.0)).toEqual(
      [
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
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
      ].join("\n"),
    )
  })

  test("generates a 25% duty cycle pulse wave with timbre of 3.5", () => {
    expect(timbreTest(3.5)).toEqual(
      [
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
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
      ].join("\n"),
    )
  })

  test("generates a 12.5% duty cycle pulse wave with timbre of 4.0", () => {
    expect(timbreTest(4.0)).toEqual(
      [
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
      ].join("\n"),
    )
  })

  test("changes gain or timbre only at waveform boundaries", () => {
    expect(
      generalTest(
        32 + 9,
        [SAMPLE_RATE / 8],
        [
          ...[0, 0, 0],
          ...[1, 1, 1, 1, 1, 1, 1, 1],
          ...[0.5, 1, 1, 1, 1, 1, 1, 1],
          ...[0.75, 0, 0, 0, 0, 0, 0, 0],
          ...[0, 0, 0],
          ...[1, 1, 1, 1, 1, 1, 1, 1],
          ...[0, 0, 0],
        ],
        [
          ...[0, 0, 0],
          ...[0, 1, 1, 1, 1, 1, 1, 1],
          ...[3, 0, 0, 0, 0, 0, 0, 3],
          ...[1, 0, 0, 0, 0, 0, 0, 0],
          ...[0, 0, 0],
          ...[4, 0, 0, 0, 0, 0, 0, 4],
          ...[0, 0, 0],
        ],
        [0],
        [0],
      ),
    ).toEqual(
      [
        "|                                X                                |",
        "|                                X                                |",
        "|                                X                                |",
        "|                                |                      X         |",
        "|                                |                               X|",
        "|                                |                      X         |",
        "|                                X                                |",
        "|         X                      |                                |",
        "|X                               |                                |",
        "|         X                      |                                |",
        "|                                X                                |",
        "|                                |               X                |",
        "|                                |               X                |",
        "|                                |               X                |",
        "|                                |               X                |",
        "|                X               |                                |",
        "|                X               |                                |",
        "|                X               |                                |",
        "|                X               |                                |",
        "|                                |           X                    |",
        "|                                |                       X        |",
        "|                                |           X                    |",
        "|                                X                                |",
        "|                    X           |                                |",
        "|        X                       |                                |",
        "|                    X           |                                |",
        "|                                X                                |",
        "|                                X                                |",
        "|                                X                                |",
        "|                                X                                |",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                X                                |",
        "|                                X                                |",
        "|                                X                                |",
      ].join("\n"),
    )
  })

  test("generates a vibrato-modulated frequency", () => {
    const samples = 64
    const vibratoPerWindow = 2
    const baseWavesPerWindow = 8
    const baseFreq = (SAMPLE_RATE / samples) * baseWavesPerWindow
    const vibratoFreq = (SAMPLE_RATE / samples) * vibratoPerWindow
    expect(
      generalTest(samples, [baseFreq], [1], [3], [12], [vibratoFreq]),
    ).toEqual(
      [
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
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
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
        "|X                               |                                |",
        "|X                               |                                |",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|                                |                               X|",
        "|X                               |                                |",
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
        "|X                               |                                |",
      ].join("\n"),
    )
  })
})
