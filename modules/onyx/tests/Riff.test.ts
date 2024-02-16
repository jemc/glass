import { describe, expect, test } from "@jest/globals"
import { Key } from "../src/Key"
import {
  riffCharCodeToOctave,
  riffCharCodeToScaleNumber,
  riffComputeStepSizes,
  riffSeqToVoiceNotes,
} from "../src/Riff"

describe("riffComputeStepSizes", () => {
  test("decides how much each character step is worth", () => {
    expect(riffComputeStepSizes("|   |  | || |  |   ")).toEqual([
      ...[1 / 4, 1 / 4, 1 / 4, 1 / 4],
      ...[1 / 3, 1 / 3, 1 / 3],
      ...[1 / 2, 1 / 2],
      ...[1],
      ...[1 / 2, 1 / 2],
      ...[1 / 3, 1 / 3, 1 / 3],
      ...[1 / 4, 1 / 4, 1 / 4, 1 / 4],
    ])
  })
})

describe("riffCharCodeToScaleNumber", () => {
  test("converts a char code to a scale number", () => {
    expect(riffCharCodeToScaleNumber("l".charCodeAt(0))).toEqual(-0.8)
    expect(riffCharCodeToScaleNumber("o".charCodeAt(0))).toEqual(-0.6)
    expect(riffCharCodeToScaleNumber("O".charCodeAt(0))).toEqual(-0.4)
    expect(riffCharCodeToScaleNumber("L".charCodeAt(0))).toEqual(-0.2)
    expect(riffCharCodeToScaleNumber("0".charCodeAt(0))).toEqual(0)
    expect(riffCharCodeToScaleNumber(";".charCodeAt(0))).toEqual(0.2)
    expect(riffCharCodeToScaleNumber("p".charCodeAt(0))).toEqual(0.4)
    expect(riffCharCodeToScaleNumber("P".charCodeAt(0))).toEqual(0.6)
    expect(riffCharCodeToScaleNumber(":".charCodeAt(0))).toEqual(0.8)
    expect(riffCharCodeToScaleNumber("1".charCodeAt(0))).toEqual(1)
    expect(riffCharCodeToScaleNumber("a".charCodeAt(0))).toEqual(1.2)
    expect(riffCharCodeToScaleNumber("q".charCodeAt(0))).toEqual(1.4)
    expect(riffCharCodeToScaleNumber("Q".charCodeAt(0))).toEqual(1.6)
    expect(riffCharCodeToScaleNumber("A".charCodeAt(0))).toEqual(1.8)
    expect(riffCharCodeToScaleNumber("2".charCodeAt(0))).toEqual(2)
    expect(riffCharCodeToScaleNumber("s".charCodeAt(0))).toEqual(2.2)
    expect(riffCharCodeToScaleNumber("w".charCodeAt(0))).toEqual(2.4)
    expect(riffCharCodeToScaleNumber("W".charCodeAt(0))).toEqual(2.6)
    expect(riffCharCodeToScaleNumber("S".charCodeAt(0))).toEqual(2.8)
    expect(riffCharCodeToScaleNumber("3".charCodeAt(0))).toEqual(3)
    expect(riffCharCodeToScaleNumber("d".charCodeAt(0))).toEqual(3.2)
    expect(riffCharCodeToScaleNumber("e".charCodeAt(0))).toEqual(3.4)
    expect(riffCharCodeToScaleNumber("E".charCodeAt(0))).toEqual(3.6)
    expect(riffCharCodeToScaleNumber("D".charCodeAt(0))).toEqual(3.8)
    expect(riffCharCodeToScaleNumber("4".charCodeAt(0))).toEqual(4)
    expect(riffCharCodeToScaleNumber("f".charCodeAt(0))).toEqual(4.2)
    expect(riffCharCodeToScaleNumber("r".charCodeAt(0))).toEqual(4.4)
    expect(riffCharCodeToScaleNumber("R".charCodeAt(0))).toEqual(4.6)
    expect(riffCharCodeToScaleNumber("F".charCodeAt(0))).toEqual(4.8)
    expect(riffCharCodeToScaleNumber("5".charCodeAt(0))).toEqual(5)
    expect(riffCharCodeToScaleNumber("g".charCodeAt(0))).toEqual(5.2)
    expect(riffCharCodeToScaleNumber("t".charCodeAt(0))).toEqual(5.4)
    expect(riffCharCodeToScaleNumber("T".charCodeAt(0))).toEqual(5.6)
    expect(riffCharCodeToScaleNumber("G".charCodeAt(0))).toEqual(5.8)
    expect(riffCharCodeToScaleNumber("6".charCodeAt(0))).toEqual(6)
    expect(riffCharCodeToScaleNumber("h".charCodeAt(0))).toEqual(6.2)
    expect(riffCharCodeToScaleNumber("y".charCodeAt(0))).toEqual(6.4)
    expect(riffCharCodeToScaleNumber("Y".charCodeAt(0))).toEqual(6.6)
    expect(riffCharCodeToScaleNumber("H".charCodeAt(0))).toEqual(6.8)
    expect(riffCharCodeToScaleNumber("7".charCodeAt(0))).toEqual(7)
    expect(riffCharCodeToScaleNumber("j".charCodeAt(0))).toEqual(7.2)
    expect(riffCharCodeToScaleNumber("u".charCodeAt(0))).toEqual(7.4)
    expect(riffCharCodeToScaleNumber("U".charCodeAt(0))).toEqual(7.6)
    expect(riffCharCodeToScaleNumber("J".charCodeAt(0))).toEqual(7.8)
    expect(riffCharCodeToScaleNumber("8".charCodeAt(0))).toEqual(8)
    expect(riffCharCodeToScaleNumber("k".charCodeAt(0))).toEqual(8.2)
    expect(riffCharCodeToScaleNumber("i".charCodeAt(0))).toEqual(8.4)
    expect(riffCharCodeToScaleNumber("I".charCodeAt(0))).toEqual(8.6)
    expect(riffCharCodeToScaleNumber("K".charCodeAt(0))).toEqual(8.8)
    expect(riffCharCodeToScaleNumber("9".charCodeAt(0))).toEqual(9)
  })
})

describe("riffCharCodeToOctave", () => {
  const toOct = riffCharCodeToOctave
  test("converts a char code to an octave", () => {
    expect(toOct("0".charCodeAt(0), 4)).toEqual(0)
    expect(toOct("1".charCodeAt(0), 4)).toEqual(1)
    expect(toOct("2".charCodeAt(0), 4)).toEqual(2)
    expect(toOct("3".charCodeAt(0), 4)).toEqual(3)
    expect(toOct("4".charCodeAt(0), 3)).toEqual(4)
    expect(toOct("5".charCodeAt(0), 3)).toEqual(5)
    expect(toOct("6".charCodeAt(0), 3)).toEqual(6)
    expect(toOct("7".charCodeAt(0), 3)).toEqual(7)
    expect(toOct("8".charCodeAt(0), 3)).toEqual(8)
    expect(toOct("9".charCodeAt(0), 3)).toEqual(9)
    expect(toOct("@".charCodeAt(0), 3)).toEqual(10)
    expect(toOct("+".charCodeAt(0), 3)).toEqual(4)
    expect(toOct("-".charCodeAt(0), 4)).toEqual(3)
    expect(toOct(" ".charCodeAt(0), 4)).toEqual(4)
  })
})

describe("riffSeqToVoiceNotes", () => {
  const toNotes = riffSeqToVoiceNotes

  const C4 = 261.6255653005986
  const D4 = 293.6647679174076
  const E4 = 329.6275569128699
  const F4 = 349.2282314330039
  const G4 = 391.99543598174927
  const A4 = 440
  const B4 = 493.8833012561241
  const C5 = C4 * 2
  const D5 = D4 * 2
  const E5 = E4 * 2

  const C6 = C5 * 2
  const C7 = C6 * 2
  const C8 = C7 * 2
  const C9 = C8 * 2
  const C10 = C9 * 2

  const C3 = C4 / 2
  const C2 = C3 / 2
  const C1 = C2 / 2
  const C0 = C1 / 2

  const A5 = A4 * 2
  const A6 = A5 * 2

  const A3 = A4 / 2
  const A2 = A3 / 2
  const A1 = A2 / 2
  const A0 = A1 / 2

  test("plays a major scale with some basic rhythmic variation", () => {
    expect(
      toNotes({
        bpm: 120,
        key: Key.of("C4").major,
        div: "|   |   |   |   |   |   |   |   ",
        seq: "1-  2-  3---4-    5   6-7-  8-- ",
      }),
    ).toEqual([
      [0.0, { duration: 0.25, freqBase: C4 }],
      [0.5, { duration: 0.25, freqBase: D4 }],
      [1.0, { duration: 0.5, freqBase: E4 }],
      [1.5, { duration: 0.25, freqBase: F4 }],
      [2.25, { duration: 0.125, freqBase: G4 }],
      [2.75, { duration: 0.25, freqBase: A4 }],
      [3.0, { duration: 0.25, freqBase: B4 }],
      [3.5, { duration: 0.375, freqBase: C5 }],
    ])
  })

  test("uses specified octaves", () => {
    expect(
      toNotes({
        bpm: 120,
        key: Key.of("C4").major,
        div: "| | | | | | | | | | | | | | | ",
        seq: "1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 ",
        oct: "0   1 + 3 4 5 607 8 9 @ -   + ",
      }),
    ).toEqual([
      [0.0, { duration: 0.25, freqBase: C0 }],
      [0.5, { duration: 0.25, freqBase: C0 }],
      [1.0, { duration: 0.25, freqBase: C1 }],
      [1.5, { duration: 0.25, freqBase: C2 }],
      [2.0, { duration: 0.25, freqBase: C3 }],
      [2.5, { duration: 0.25, freqBase: C4 }],
      [3.0, { duration: 0.25, freqBase: C5 }],
      [3.5, { duration: 0.25, freqBase: C6 }],
      [4.0, { duration: 0.25, freqBase: C7 }],
      [4.5, { duration: 0.25, freqBase: C8 }],
      [5.0, { duration: 0.25, freqBase: C9 }],
      [5.5, { duration: 0.25, freqBase: C10 }],
      [6.0, { duration: 0.25, freqBase: C9 }],
      [6.5, { duration: 0.25, freqBase: C9 }],
      [7.0, { duration: 0.25, freqBase: C10 }],
    ])
  })

  test("uses specified glissando toward target notes", () => {
    expect(
      toNotes({
        bpm: 120,
        key: Key.of("A").minor,
        div: "|   |   |   |   |   |   |   |   |   |   ",
        seq: "1---3---5---1---8---1---5---3---1---1---",
        oct: "            +           -           0   ",
        gls: "    ^  ^-  ^--  ^       ^   ^-^-----^---",
      }),
    ).toEqual([
      [
        0,
        {
          duration: 2.5,
          freqBase: A4,
          freqSlides: [
            {
              timeStart: 0.5,
              timeEnd: 0.625,
              deltaStart: 0,
              deltaEnd: C5 - A4,
            },
            {
              timeStart: 0.875,
              timeEnd: 1.125,
              deltaStart: C5 - A4,
              deltaEnd: E5 - A4,
            },
            {
              timeStart: 1.375,
              timeEnd: 1.75,
              deltaStart: E5 - A4,
              deltaEnd: A5 - A4,
            },
            {
              timeStart: 2.0,
              timeEnd: 2.125,
              deltaStart: A5 - A4,
              deltaEnd: A6 - A4,
            },
          ],
        },
      ],
      [
        2.5,
        {
          duration: 2.5,
          freqBase: A5,
          freqSlides: [
            {
              timeStart: 0.5,
              timeEnd: 0.625,
              deltaStart: 0,
              deltaEnd: E5 - A5,
            },
            {
              timeStart: 1.0,
              timeEnd: 1.25,
              deltaStart: E5 - A5,
              deltaEnd: C5 - A5,
            },
            {
              timeStart: 1.25,
              timeEnd: 2.0,
              deltaStart: C5 - A5,
              deltaEnd: A4 - A5,
            },
            {
              timeStart: 2.0,
              timeEnd: 2.5,
              deltaStart: A4 - A5,
              deltaEnd: A0 - A5,
            },
          ],
        },
      ],
    ])
  })

  test("uses specified glissando from below", () => {
    expect(
      toNotes({
        bpm: 120,
        key: Key.of("A").minor,
        div: "|   |   |   |",
        seq: "1---1---1--- ",
        gls: ",1,1,,,2  ,,3",
      }),
    ).toEqual([
      [
        0.0,
        {
          duration: 0.5,
          freqBase: A4,
          freqSlides: [
            { timeStart: 0, timeEnd: 0.125, deltaStart: G4 - A4, deltaEnd: 0 },
            {
              timeStart: 0.25,
              timeEnd: 0.375,
              deltaStart: G4 - A4,
              deltaEnd: 0,
            },
          ],
        },
      ],
      [
        0.5,
        {
          duration: 0.5,
          freqBase: A4,
          freqSlides: [
            { timeStart: 0, timeEnd: 0.375, deltaStart: F4 - A4, deltaEnd: 0 },
          ],
        },
      ],
      [
        1.0,
        {
          duration: 0.5,
          freqBase: A4,
          freqSlides: [
            { timeStart: 0.25, timeEnd: 0.5, deltaStart: E4 - A4, deltaEnd: 0 },
          ],
        },
      ],
    ])
  })

  test("uses specified glissando from above", () => {
    expect(
      toNotes({
        bpm: 120,
        key: Key.of("A").minor,
        div: "|   |   |   |",
        seq: "1---1---1--- ",
        gls: "`1`1```2  ``3",
      }),
    ).toEqual([
      [
        0.0,
        {
          duration: 0.5,
          freqBase: A4,
          freqSlides: [
            { timeStart: 0, timeEnd: 0.125, deltaStart: B4 - A4, deltaEnd: 0 },
            {
              timeStart: 0.25,
              timeEnd: 0.375,
              deltaStart: B4 - A4,
              deltaEnd: 0,
            },
          ],
        },
      ],
      [
        0.5,
        {
          duration: 0.5,
          freqBase: A4,
          freqSlides: [
            { timeStart: 0, timeEnd: 0.375, deltaStart: C5 - A4, deltaEnd: 0 },
          ],
        },
      ],
      [
        1.0,
        {
          duration: 0.5,
          freqBase: A4,
          freqSlides: [
            { timeStart: 0.25, timeEnd: 0.5, deltaStart: D5 - A4, deltaEnd: 0 },
          ],
        },
      ],
    ])
  })

  test("uses volume events with decimal scale", () => {
    expect(
      toNotes({
        bpm: 120,
        key: Key.of("A").minor,
        div: "|   |   |   |   |   |   ",
        seq: "    1---1---1---1---1---",
        vol: "9    864 9752 0@ 31",
      }),
    ).toEqual([
      [
        0.5,
        {
          duration: 0.5,
          freqBase: A4,
          gainEvents: [
            { time: 0.0, gain: 0.9 },
            { time: 0.125, gain: 0.8 },
            { time: 0.25, gain: 0.6 },
            { time: 0.375, gain: 0.4 },
          ],
        },
      ],
      [
        1.0,
        {
          duration: 0.5,
          freqBase: A4,
          gainEvents: [
            { time: 0.0, gain: 0.4 },
            { time: 0.125, gain: 0.9 },
            { time: 0.25, gain: 0.7 },
            { time: 0.375, gain: 0.5 },
          ],
        },
      ],
      [
        1.5,
        {
          duration: 0.5,
          freqBase: A4,
          gainEvents: [
            { time: 0.0, gain: 0.2 },
            { time: 0.25, gain: 0.0 },
            { time: 0.375, gain: 1.0 },
          ],
        },
      ],
      [
        2.0,
        {
          duration: 0.5,
          freqBase: A4,
          gainEvents: [
            { time: 0.125, gain: 0.3 },
            { time: 0.25, gain: 0.1 },
          ],
        },
      ],
      [
        2.5,
        {
          duration: 0.5,
          freqBase: A4,
          gainEvents: [{ time: 0.0, gain: 0.1 }],
        },
      ],
    ])
  })
})
