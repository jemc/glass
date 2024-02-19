import { describe, expect, test } from "@jest/globals"
import { Key, KeyNote, KeyTuning } from "../src/Key"

describe("Key", () => {
  test("encodes any root note losslessly", () => {
    ;["", "^", "v"].forEach((nudge) => {
      ;["A", "B", "C", "D", "E", "F", "G"].forEach((letter) => {
        ;["", "b", "#", "bb", "##"].forEach((accidental) => {
          ;[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((octave) => {
            const note = `${nudge}${letter}${accidental}${octave}`
            const key = Key.of(note as KeyNote).major
            expect(key.root).toBe(note)
          })
        })
      })
    })
  })

  test("encodes the 8 basic modes of the major scale", () => {
    expect(Key.of("C").mode("Ionian").ringScaleNumber).toBe(2741)
    expect(Key.of("C").mode("Dorian").ringScaleNumber).toBe(1709)
    expect(Key.of("C").mode("Phrygian").ringScaleNumber).toBe(1451)
    expect(Key.of("C").mode("Lydian").ringScaleNumber).toBe(2773)
    expect(Key.of("C").mode("Mixolydian").ringScaleNumber).toBe(1717)
    expect(Key.of("C").mode("Aeolian").ringScaleNumber).toBe(1453)
    expect(Key.of("C").mode("Locrian").ringScaleNumber).toBe(1387)
  })

  test("defines succinct onyx names for indicating keys", () => {
    expect(Key.of("F").major.onyxName).toBe("Mamam")
    expect(Key.of("F").minor.onyxName).toBe("Ninin")
    expect(Key.of("F").mode("Jazz Minor").onyxName).toBe("Nimam")
    expect(Key.of("F").mode("Bothian").onyxName).toBe("Toogad")

    expect(Key.fromOnyxName("F", "Mamam").ringScaleNumber).toBe(2741)
    ;["Mamam", "Ninin", "Nimam", "Toogad"].forEach((onyxName) => {
      expect(Key.fromOnyxName("F", "Mamam").root).toBe("F4")
      expect(Key.fromOnyxName("F", onyxName).onyxName).toBe(onyxName)
    })
  })

  test("accurately describes the basic properties of a major scale", () => {
    const key = Key.of("F").major
    expect(key.getDegreeDistance(1)).toEqual(0)
    expect(key.getDegreeDistance(2)).toEqual(2)
    expect(key.getDegreeDistance(3)).toEqual(4)
    expect(key.getDegreeDistance(4)).toEqual(5)
    expect(key.getDegreeDistance(5)).toEqual(7)
    expect(key.getDegreeDistance(6)).toEqual(9)
    expect(key.getDegreeDistance(7)).toEqual(11)
    expect(key.getDegreeDistance(8)).toEqual(12)
    expect(key.getDegreeDistance(9)).toEqual(14)
  })

  Array.from({ length: 72 }, (_, i) => i).forEach((i) => {
    const melaNumber = i + 1
    const key = Key.of("F").melakarta(melaNumber)!

    test(`has a defined onyx name for melakarta ${melaNumber} (scale ${key.ringScaleNumber})`, () => {
      expect(key.onyxName).toEqual(expect.not.stringContaining("?"))
    })

    test(`has accurate svaras for melakarta ${melaNumber} (scale ${key.ringScaleNumber})`, () => {
      expect(key.noteCount).toBe(7)

      // By construction, every possible key contains its own root ("sa").
      expect(key.hasSvara("sa")).toBe(true)

      // The 5th of every melakarta is perfect ("pa").
      expect(key.hasSvara("pa")).toBe(true)

      // The first half of the 72 melakartas have a perfect 4th ("ma"),
      // and the latter half have an augmented 4th ("mi").
      expect(key.hasSvara("ma")).toBe(i < 36)
      expect(key.hasSvara("mi")).toBe(i >= 36)

      // Of each half, the first 3 chakras have a minor 2nd ("ra"),
      // the next 2 chakras have a major 2nd ("ri"),
      // and the last chakra has an augmented 2nd ("ru").
      expect(key.hasSvara("ra")).toBe(i % 36 < 18)
      expect(key.hasSvara("ri")).toBe(i % 36 >= 18 && i % 36 < 30)
      expect(key.hasSvara("ru")).toBe(i % 36 >= 30)

      // Of each half, the first chakra has a diminished 3rd ("ga"),
      // the next chakra has a minor 3rd ("gi"),
      // the next chakra has a major 3rd ("gu"),
      // the next chakra has a minor 3rd ("gi"),
      // and the last two chakras have a major 3rd ("gu").
      expect(key.hasSvara("ga")).toBe(i % 36 < 6)
      expect(key.hasSvara("gi")).toBe(
        (i % 36 >= 6 && i % 36 < 12) || (i % 36 >= 18 && i % 36 < 24),
      )
      expect(key.hasSvara("gu")).toBe(
        (i % 36 >= 12 && i % 36 < 18) || i % 36 >= 24,
      )

      // Within each chakra, the first 3 scales have a minor 6th ("dha"),
      // the next 2 scales have a major 6th ("dhi"),
      // and the last scale has an augmented 6th ("dhu").
      expect(key.hasSvara("dha")).toBe(i % 6 < 3)
      expect(key.hasSvara("dhi")).toBe(i % 6 >= 3 && i % 6 < 5)
      expect(key.hasSvara("dhu")).toBe(i % 6 === 5)

      // Within each chakra, the first scale has a diminished 7th ("na"),
      // the next scale has a minor 7th ("ni"),
      // the next scale has a major 7th ("nu"),
      // the next scale has a minor 7th ("ni"),
      // and the last two scales have a major 7th ("nu").
      expect(key.hasSvara("na")).toBe(i % 6 === 0)
      expect(key.hasSvara("ni")).toBe(i % 6 === 1 || i % 6 === 3)
      expect(key.hasSvara("nu")).toBe(i % 6 === 2 || i % 6 > 3)
    })
  })

  describe("getDegreeDistance", () => {
    test("converts a scale number to a step distance", () => {
      const majorKey = Key.of("C").major
      const minorKey = Key.of("A").minor

      const simpleScale = [1, 2, 3, 4, 5, 6, 7, 8]
      const allFlatsNSharps = [
        ...[-0.6, -0.4, 0],
        ...[0.4, 0.6, 1],
        ...[1.4, 1.6, 2],
        ...[2.4, 2.6, 3],
        ...[3.4, 3.6, 4],
        ...[4.4, 4.6, 5],
        ...[5.4, 5.6, 6],
        ...[6.4, 6.6, 7],
        ...[7.4, 7.6, 8],
        ...[8.4, 8.6, 9],
      ]

      const majorScale = simpleScale.map((n) => majorKey.getDegreeDistance(n))
      const minorScale = simpleScale.map((n) => minorKey.getDegreeDistance(n))
      const majorAll = allFlatsNSharps.map((n) => majorKey.getDegreeDistance(n))
      const minorAll = allFlatsNSharps.map((n) => minorKey.getDegreeDistance(n))

      expect(majorScale).toEqual([0, 2, 4, 5, 7, 9, 11, 12])
      expect(minorScale).toEqual([0, 2, 3, 5, 7, 8, 10, 12])
      expect(majorAll).toEqual([
        ...[-2, -2, -1], // A#  Bb  B
        ...[-1, 0, 0], //// B   C   C
        ...[1, 1, 2], ///// C#  Db  D
        ...[3, 3, 4], ///// D#  Eb  E
        ...[4, 5, 5], ///// E   F   F
        ...[6, 6, 7], ///// F#  Gb  G
        ...[8, 8, 9], ///// G#  Ab  A
        ...[10, 10, 11], // A#  Bb  B
        ...[11, 12, 12], // B   C   C
        ...[13, 13, 14], // C#  Db  D
      ])
      expect(minorAll).toEqual([
        ...[-3, -3, -2], // F#  Gb  G
        ...[-1, -1, 0], /// G#  Ab  A
        ...[1, 1, 2], ///// A#  Bb  B
        ...[2, 3, 3], ///// B   C   C
        ...[4, 4, 5], ///// C#  Db  D
        ...[6, 6, 7], ///// D#  Eb  E
        ...[7, 8, 8], ///// E   F   F
        ...[9, 9, 10], //// F#  Gb  G
        ...[11, 11, 12], // G#  Ab  A
        ...[13, 13, 14], // A#  Bb  B
      ])
    })
  })

  describe("getDegreeFrequency", () => {
    const freq = (n: KeyNote, mode: "major" | "minor", d: number) =>
      Key.of(n)[mode].getDegreeFrequency(d)

    test("emits A4 as 440 when accessed from any key", () => {
      expect(freq("C5", "minor", -0.5)).toBeCloseTo(440)
      expect(freq("B4", "major", -0.5)).toBeCloseTo(440)
      expect(freq("B4", "minor", 0)).toBeCloseTo(440)
      expect(freq("Bb4", "major", 0)).toBeCloseTo(440)
      expect(freq("Bb4", "minor", 0.5)).toBeCloseTo(440)
      expect(freq("A#4", "major", 0)).toBeCloseTo(440)
      expect(freq("A#4", "minor", 0.5)).toBeCloseTo(440)
      expect(freq("A4", "major", 1)).toBeCloseTo(440)
      expect(freq("A4", "minor", 1)).toBeCloseTo(440)
      expect(freq("Ab4", "major", 1.5)).toBeCloseTo(440)
      expect(freq("Ab4", "minor", 1.5)).toBeCloseTo(440)
      expect(freq("G#4", "major", 1.5)).toBeCloseTo(440)
      expect(freq("G#4", "minor", 1.5)).toBeCloseTo(440)
      expect(freq("G4", "major", 2)).toBeCloseTo(440)
      expect(freq("G4", "minor", 2)).toBeCloseTo(440)
      expect(freq("Gb4", "major", 2.5)).toBeCloseTo(440)
      expect(freq("Gb4", "minor", 2.5)).toBeCloseTo(440)
      expect(freq("F#4", "major", 2.5)).toBeCloseTo(440)
      expect(freq("F#4", "minor", 2.5)).toBeCloseTo(440)
      expect(freq("F4", "major", 3)).toBeCloseTo(440)
      expect(freq("F4", "minor", 3.5)).toBeCloseTo(440)
      expect(freq("E4", "major", 4)).toBeCloseTo(440)
      expect(freq("E4", "minor", 4)).toBeCloseTo(440)
      expect(freq("Eb4", "major", 4.5)).toBeCloseTo(440)
      expect(freq("Eb4", "minor", 4.5)).toBeCloseTo(440)
      expect(freq("D#4", "major", 4.5)).toBeCloseTo(440)
      expect(freq("D#4", "minor", 4.5)).toBeCloseTo(440)
      expect(freq("D4", "major", 5)).toBeCloseTo(440)
      expect(freq("D4", "minor", 5)).toBeCloseTo(440)
      expect(freq("Db4", "major", 5.5)).toBeCloseTo(440)
      expect(freq("Db4", "minor", 5.5)).toBeCloseTo(440)
      expect(freq("C#4", "major", 5.5)).toBeCloseTo(440)
      expect(freq("C#4", "minor", 5.5)).toBeCloseTo(440)
      expect(freq("C4", "major", 6)).toBeCloseTo(440)
      expect(freq("C4", "minor", 6.5)).toBeCloseTo(440)
      expect(freq("B3", "major", 6.5)).toBeCloseTo(440)
      expect(freq("B3", "minor", 7)).toBeCloseTo(440)
      expect(freq("Bb3", "major", 7)).toBeCloseTo(440)
      expect(freq("Bb3", "minor", 7.5)).toBeCloseTo(440)
      expect(freq("A#3", "major", 7)).toBeCloseTo(440)
      expect(freq("A#3", "minor", 7.5)).toBeCloseTo(440)
      expect(freq("A3", "major", 8)).toBeCloseTo(440)
      expect(freq("A3", "minor", 8)).toBeCloseTo(440)
      expect(freq("Ab3", "major", 8.5)).toBeCloseTo(440)
      expect(freq("Ab3", "minor", 8.5)).toBeCloseTo(440)
      expect(freq("G#3", "major", 8.5)).toBeCloseTo(440)
      expect(freq("G#3", "minor", 8.5)).toBeCloseTo(440)
      expect(freq("G3", "major", 9)).toBeCloseTo(440)
      expect(freq("G3", "minor", 9)).toBeCloseTo(440)
    })
    test("emits the correct series of frequencies in a major key", () => {
      expect(freq("C5", "major", -1 /****/)).toBeCloseTo(440) ////////////// A4
      expect(freq("C5", "major", -0.5 /**/)).toBeCloseTo(466.16376151808) // A#4
      expect(freq("C5", "major", 0 /*****/)).toBeCloseTo(493.88330125612) // B4
      expect(freq("C5", "major", 0.5 /***/)).toBeCloseTo(523.25113060119) // C5
      expect(freq("C5", "major", 1 /*****/)).toBeCloseTo(523.25113060119) // C5
      expect(freq("C5", "major", 1.5 /***/)).toBeCloseTo(554.36526195374) // C#5
      expect(freq("C5", "major", 2 /*****/)).toBeCloseTo(587.32953583481) // D5
      expect(freq("C5", "major", 2.5 /***/)).toBeCloseTo(622.25396744416) // D#5
      expect(freq("C5", "major", 3 /*****/)).toBeCloseTo(659.25511382573) // E5
      expect(freq("C5", "major", 3.5 /***/)).toBeCloseTo(698.45646286601) // F5
      expect(freq("C5", "major", 4 /*****/)).toBeCloseTo(698.45646286601) // F5
      expect(freq("C5", "major", 4.5 /***/)).toBeCloseTo(739.98884542326) // F#5
      expect(freq("C5", "major", 5 /*****/)).toBeCloseTo(783.99087196349) // G5
      expect(freq("C5", "major", 5.5 /***/)).toBeCloseTo(830.60939515989) // G#5
      expect(freq("C5", "major", 6 /*****/)).toBeCloseTo(880) ////////////// A5
      expect(freq("C5", "major", 6.5 /***/)).toBeCloseTo(932.32752303617) // A#5
      expect(freq("C5", "major", 7 /*****/)).toBeCloseTo(987.76660251224) // B5
      expect(freq("C5", "major", 7.5 /***/)).toBeCloseTo(1046.50226120239) // C6
      expect(freq("C5", "major", 8 /*****/)).toBeCloseTo(1046.50226120239) // C6
    })
  })

  test("transferToTuning F# 12edo to 31edo", () => {
    const key = Key.of("F#5").minor.transferToTuning(KeyTuning.edo(31))

    expect(
      Array.from({ length: key.noteCount }, (_, i) => i).map((i) =>
        key.getDegreeDistance(i + 1),
      ),
    ).toEqual([0, 5, 8, 13, 18, 21, 26])
    expect(key.root).toBe("F#5")
  })
})

describe("KeyTuning", () => {
  describe("frequencyApproximateStepsFromA4", () => {
    const cases: [number, number][] = [
      [440, 0],
      [441, 0],
      [453, 0],
      [454, 1],

      [880, 12],

      [220, -12],

      [1046, 15],
      [1018, 15],
      [1017, 14],
    ]

    cases.forEach(([freq, steps]) => {
      test(`approximates ${freq} as ${steps} steps from A4 (in 12edo)`, () => {
        expect(KeyTuning.edo(12).frequencyApproximateStepsFromA4(freq)).toBe(
          steps,
        )
      })
    })
  })

  const testLetterIntervalPlan = (
    stepsPerOctave: number,
    plan: {
      minorityCount: number
      minorityInterval: number
      majorityCount: number
      majorityInterval: number
      accidentalInterval: number
    },
  ) => {
    test(`Correctly plans letter intervals for ${stepsPerOctave}edo`, () => {
      expect(KeyTuning.planLetterIntervals(stepsPerOctave)).toEqual(plan)

      expect(plan.majorityCount + plan.minorityCount).toBe(7)
      expect(
        plan.majorityCount * plan.majorityInterval +
          plan.minorityCount * plan.minorityInterval,
      ).toBe(stepsPerOctave)
    })
  }
  const testNoteMapping = (
    tuning: KeyTuning,
    noteMapping: { [key: number]: KeyNote[] },
  ) => {
    Object.entries(noteMapping).forEach(([stepIndexString, notes]) => {
      const stepIndex = parseInt(stepIndexString)
      notes.forEach((note) => {
        test(`Correctly maps ${note} (${stepIndex} steps from A4)`, () => {
          expect(tuning.noteStepsFromA4(note)).toBe(stepIndex)
        })
      })
    })
  }

  describe("12edo", () => {
    testLetterIntervalPlan(12, {
      minorityCount: 2,
      minorityInterval: 1,
      majorityCount: 5,
      majorityInterval: 2,
      accidentalInterval: 1,
    })
    testNoteMapping(KeyTuning.edo(12), {
      0: ["A4", "Bbb4", "G##4"],
      1: ["A#4", "Bb4", "Cbb5"],
      2: ["B4", "Cb5", "A##4"],
      3: ["C5", "Dbb5", "B#4"],
      4: ["C#5", "Db5", "B##4"],
      5: ["D5", "Ebb5", "C##5"],
      6: ["D#5", "Eb5", "Fbb5"],
      7: ["E5", "Fb5", "D##5"],
      8: ["F5", "Gbb5", "E#5"],
      9: ["F#5", "Gb5", "E##5"],
      10: ["G5", "Abb5", "F##5"],
      11: ["G#5", "Ab5"],
      12: ["A5", "Bbb5", "G##5"],

      "-12": ["A3", "Bbb3", "G##3"],
    })
  })

  describe("14edo", () => {
    testLetterIntervalPlan(14, {
      minorityCount: 0,
      minorityInterval: 0,
      majorityCount: 7,
      majorityInterval: 2,
      accidentalInterval: 0, // because there is no drift in the perfect fifths
    })
    testNoteMapping(KeyTuning.edo(14), {
      0: ["A4", "vvB4", "^^G4"],
      1: ["^A4", "vB4"],
      2: ["B4", "vvC5", "^^A4"],
      3: ["^B4", "vC5"],
      4: ["C5", "vvD5", "^^B4"],
      5: ["^C5", "vD5"],
      6: ["D5", "vvE5", "^^C5"],
      7: ["^D5", "vE5"],
      8: ["E5", "vvF5", "^^D5"],
      9: ["^E5", "vF5"],
      10: ["F5", "vvG5", "^^E5"],
      11: ["^F5", "vG5"],
      12: ["G5", "vvA5", "^^F5"],
      13: ["^G5", "vA5"],
      14: ["A5", "vvB5", "^^G5"],

      "-14": ["A3", "vvB3", "^^G3"],
    })
  })

  describe("15edo", () => {
    testLetterIntervalPlan(15, {
      minorityCount: 2,
      minorityInterval: 0,
      majorityCount: 5,
      majorityInterval: 3,
      accidentalInterval: 3,
    })
  })

  describe("16edo", () => {
    testLetterIntervalPlan(16, {
      minorityCount: 2,
      minorityInterval: 3,
      majorityCount: 5,
      majorityInterval: 2,
      accidentalInterval: -1,
    })
  })

  describe("17edo", () => {
    testLetterIntervalPlan(17, {
      minorityCount: 2,
      minorityInterval: 1,
      majorityCount: 5,
      majorityInterval: 3,
      accidentalInterval: 2,
    })
    testNoteMapping(KeyTuning.edo(17), {
      0: ["A4", "vBb4", "^G#4"],
      1: ["^A4", "Bb4"],
      2: ["vB4", "A#4"],
      3: ["B4", "vC5", "^A#4"],
      4: ["C5", "vDb5", "^B4"],
      5: ["^C5", "Db5"],
      6: ["vD5", "C#5"],
      7: ["D5", "vEb5", "^C#5"],
      8: ["^D5", "Eb5"],
      9: ["vE5", "D#5"],
      10: ["E5", "vF5", "^D#5"],
      11: ["F5", "vGb5", "^E5"],
      12: ["^F5", "Gb5"],
      13: ["vG5", "F#5"],
      14: ["G5", "vAb5", "^F#5"],
      15: ["^G5", "Ab5"],
      16: ["vA5", "G#5"],
      17: ["A5", "vBb5", "^G#5"],

      "-17": ["A3", "vBb3", "^G#3"],
    })
  })

  describe("18edo", () => {
    testLetterIntervalPlan(18, {
      minorityCount: 2,
      minorityInterval: 4,
      majorityCount: 5,
      majorityInterval: 2,
      accidentalInterval: -2, // there is negative drift in the perfect fifths
    })
  })

  describe("19edo", () => {
    testLetterIntervalPlan(19, {
      minorityCount: 2,
      minorityInterval: 2,
      majorityCount: 5,
      majorityInterval: 3,
      accidentalInterval: 1,
    })
    testNoteMapping(KeyTuning.edo(19), {
      0: ["A4"],
      1: ["A#4", "Bbb4"],
      2: ["Bb4", "A##4"],
      3: ["B4", "Cbb5"],
      4: ["B#4", "Cb5"],
      5: ["C5", "B##4"],
      6: ["C#5", "Dbb5"],
      7: ["Db5", "C##5"],
      8: ["D5"],
      9: ["D#5", "Ebb5"],
      10: ["Eb5", "D##5"],
      11: ["E5", "Fbb5"],
      12: ["E#5", "Fb5"],
      13: ["F5", "E##5"],
      14: ["F#5", "Gbb5"],
      15: ["Gb5", "F##5"],
      16: ["G5"],
      17: ["G#5", "Abb5"],
      18: ["Ab5", "G##5"],
      19: ["A5"],

      "-19": ["A3"],
    })
  })

  describe("20edo", () => {
    testLetterIntervalPlan(20, {
      minorityCount: 2,
      minorityInterval: 0,
      majorityCount: 5,
      majorityInterval: 4,
      accidentalInterval: 4,
    })
  })

  describe("21edo", () => {
    testLetterIntervalPlan(21, {
      minorityCount: 0,
      minorityInterval: 0,
      majorityCount: 7,
      majorityInterval: 3,
      accidentalInterval: 0, // because there is no drift in the perfect fifths
    })
    testNoteMapping(KeyTuning.edo(21), {
      0: ["A4"],
      1: ["^A4", "vvB4"],
      2: ["vB4", "^^A4"],
      3: ["B4"],
      4: ["^B4", "vvC5"],
      5: ["vC5", "^^B4"],
      6: ["C5"],
      7: ["^C5", "vvD5"],
      8: ["vD5", "^^C5"],
      9: ["D5"],
      10: ["^D5", "vvE5"],
      11: ["vE5", "^^D5"],
      12: ["E5"],
      13: ["^E5", "vvF5"],
      14: ["vF5", "^^E5"],
      15: ["F5"],
      16: ["^F5", "vvG5"],
      17: ["vG5", "^^F5"],
      18: ["G5"],
      19: ["^G5", "vvA5"],
      20: ["vA5", "^^G5"],
      21: ["A5"],

      "-21": ["A3"],
    })
  })

  describe("22edo", () => {
    testLetterIntervalPlan(22, {
      minorityCount: 2,
      minorityInterval: 1,
      majorityCount: 5,
      majorityInterval: 4,
      accidentalInterval: 3,
    })
  })

  describe("23edo", () => {
    testLetterIntervalPlan(23, {
      minorityCount: 2,
      minorityInterval: 4,
      majorityCount: 5,
      majorityInterval: 3,
      accidentalInterval: -1, // there is negative drift in the perfect fifths
    })
  })

  describe("24edo", () => {
    testLetterIntervalPlan(24, {
      minorityCount: 2,
      minorityInterval: 2,
      majorityCount: 5,
      majorityInterval: 4,
      accidentalInterval: 2,
    })
  })

  describe("25edo", () => {
    testLetterIntervalPlan(25, {
      minorityCount: 2,
      minorityInterval: 0,
      majorityCount: 5,
      majorityInterval: 5,
      accidentalInterval: 5,
    })
  })

  describe("26edo", () => {
    testLetterIntervalPlan(26, {
      minorityCount: 2,
      minorityInterval: 3,
      majorityCount: 5,
      majorityInterval: 4,
      accidentalInterval: 1,
    })
  })

  describe("27edo", () => {
    testLetterIntervalPlan(27, {
      minorityCount: 2,
      minorityInterval: 1,
      majorityCount: 5,
      majorityInterval: 5,
      accidentalInterval: 4,
    })
  })

  describe("28edo", () => {
    testLetterIntervalPlan(28, {
      minorityCount: 0,
      minorityInterval: 0,
      majorityCount: 7,
      majorityInterval: 4,
      accidentalInterval: 0, // because there is no drift in the perfect fifths
    })
  })

  describe("29edo", () => {
    testLetterIntervalPlan(29, {
      minorityCount: 2,
      minorityInterval: 2,
      majorityCount: 5,
      majorityInterval: 5,
      accidentalInterval: 3,
    })
  })

  describe("30edo", () => {
    testLetterIntervalPlan(30, {
      minorityCount: 2,
      minorityInterval: 0,
      majorityCount: 5,
      majorityInterval: 6,
      accidentalInterval: 6,
    })
  })

  describe("31edo", () => {
    testLetterIntervalPlan(31, {
      minorityCount: 2,
      minorityInterval: 3,
      majorityCount: 5,
      majorityInterval: 5,
      accidentalInterval: 2,
    })
    testNoteMapping(KeyTuning.edo(31), {
      0: ["A4", "^G##4", "vBbb4"],
      1: ["^A4", "Bbb4"],
      2: ["A#4", "vBb4"],
      3: ["Bb4", "^A#4"],
      4: ["vB4", "A##4"],
      5: ["B4", "^A##4", "vCb5"],
      6: ["^B4", "Cb5"],
      7: ["vC5", "B#4"],
      8: ["C5", "vDbb5", "^B#4"],
      9: ["^C5", "Dbb5"],
      10: ["C#5", "vDb5"],
      11: ["Db5", "^C#5"],
      12: ["vD5", "C##5"],
      13: ["D5", "^C##5", "vEbb5"],
      14: ["^D5", "Ebb5"],
      15: ["D#5", "vEb5"],
      16: ["Eb5", "^D#5"],
      17: ["vE5", "D##5"],
      18: ["E5", "^D##5", "vFb5"],
      19: ["^E5", "Fb5"],
      20: ["vF5", "E#5"],
      21: ["F5", "vGbb5", "^E#5"],
      22: ["^F5", "Gbb5"],
      23: ["F#5", "vGb5"],
      24: ["Gb5", "^F#5"],
      25: ["vG5", "F##5"],
      26: ["G5", "^F##5", "vAbb5"],
      27: ["^G5", "Abb5"],
      28: ["G#5", "vAb5"],
      29: ["Ab5", "^G#5"],
      30: ["vA5", "G##5"],
      31: ["A5", "^G##5", "vBbb5"],

      "-31": ["A3", "^G##3", "vBbb3"],
    })
  })

  describe("32edo", () => {
    testLetterIntervalPlan(32, {
      minorityCount: 2,
      minorityInterval: 1,
      majorityCount: 5,
      majorityInterval: 6,
      accidentalInterval: 5,
    })
  })

  describe("33edo", () => {
    testLetterIntervalPlan(33, {
      minorityCount: 2,
      minorityInterval: 4,
      majorityCount: 5,
      majorityInterval: 5,
      accidentalInterval: 1,
    })
  })

  describe("34edo", () => {
    testLetterIntervalPlan(34, {
      minorityCount: 2,
      minorityInterval: 2,
      majorityCount: 5,
      majorityInterval: 6,
      accidentalInterval: 4,
    })
  })

  describe("35edo", () => {
    testLetterIntervalPlan(35, {
      minorityCount: 0,
      minorityInterval: 0,
      majorityCount: 7,
      majorityInterval: 5,
      accidentalInterval: 0, // because there is no drift in the perfect fifths
    })
  })

  describe("36edo", () => {
    testLetterIntervalPlan(36, {
      minorityCount: 2,
      minorityInterval: 3,
      majorityCount: 5,
      majorityInterval: 6,
      accidentalInterval: 3,
    })
  })

  describe("37edo", () => {
    testLetterIntervalPlan(37, {
      minorityCount: 2,
      minorityInterval: 1,
      majorityCount: 5,
      majorityInterval: 7,
      accidentalInterval: 6,
    })
  })

  describe("38edo", () => {
    testLetterIntervalPlan(38, {
      minorityCount: 2,
      minorityInterval: 4,
      majorityCount: 5,
      majorityInterval: 6,
      accidentalInterval: 2,
    })
  })

  describe("39edo", () => {
    testLetterIntervalPlan(39, {
      minorityCount: 2,
      minorityInterval: 2,
      majorityCount: 5,
      majorityInterval: 7,
      accidentalInterval: 5,
    })
  })

  describe("40edo", () => {
    testLetterIntervalPlan(40, {
      minorityCount: 2,
      minorityInterval: 5,
      majorityCount: 5,
      majorityInterval: 6,
      accidentalInterval: 1,
    })
  })

  describe("41edo", () => {
    testLetterIntervalPlan(41, {
      minorityCount: 2,
      minorityInterval: 3,
      majorityCount: 5,
      majorityInterval: 7,
      accidentalInterval: 4,
    })
    testNoteMapping(KeyTuning.edo(41), {
      0: ["A4"],
      1: ["^A4"],
      2: ["^^A4", "vBb4"],
      3: ["vA#4", "Bb4"],
      4: ["A#4", "^Bb4"],
      5: ["vvB4", "^A#4"],
      6: ["vB4"],
      7: ["B4"],
      8: ["^B4"],
      9: ["vC5"],
      10: ["C5"],
      11: ["^C5"],
      12: ["^^C5", "vDb5"],
      13: ["vC#5", "Db5"],
      14: ["C#5", "^Db5"],
      15: ["vvD5", "^C#5"],
      16: ["vD5"],
      17: ["D5"],
      18: ["^D5"],
      19: ["^^D5", "vEb5"],
      20: ["vD#5", "Eb5"],
      21: ["D#5", "^Eb5"],
      22: ["vvE5", "^D#5"],
      23: ["vE5"],
      24: ["E5"],
      25: ["^E5"],
      26: ["vF5"],
      27: ["F5"],
      28: ["^F5"],
      29: ["^^F5", "vGb5"],
      30: ["vF#5", "Gb5"],
      31: ["F#5", "^Gb5"],
      32: ["vvG5", "^F#5"],
      33: ["vG5"],
      34: ["G5"],
      35: ["^G5"],
      36: ["^^G5", "vAb5"],
      37: ["vG#5", "Ab5"],
      38: ["G#5", "^Ab5"],
      39: ["vvA5", "^G#5"],
      40: ["vA5"],
      41: ["A5"],

      "-41": ["A3"],
    })
  })

  describe("42edo", () => {
    testLetterIntervalPlan(42, {
      minorityCount: 2,
      minorityInterval: 1,
      majorityCount: 5,
      majorityInterval: 8,
      accidentalInterval: 7,
    })
  })

  describe("43edo", () => {
    testLetterIntervalPlan(43, {
      minorityCount: 2,
      minorityInterval: 4,
      majorityCount: 5,
      majorityInterval: 7,
      accidentalInterval: 3,
    })
  })

  describe("44edo", () => {
    testLetterIntervalPlan(44, {
      minorityCount: 2,
      minorityInterval: 2,
      majorityCount: 5,
      majorityInterval: 8,
      accidentalInterval: 6,
    })
  })

  describe("45edo", () => {
    testLetterIntervalPlan(45, {
      minorityCount: 2,
      minorityInterval: 5,
      majorityCount: 5,
      majorityInterval: 7,
      accidentalInterval: 2,
    })
  })

  describe("46edo", () => {
    testLetterIntervalPlan(46, {
      minorityCount: 2,
      minorityInterval: 3,
      majorityCount: 5,
      majorityInterval: 8,
      accidentalInterval: 5,
    })
  })

  describe("47edo", () => {
    testLetterIntervalPlan(47, {
      minorityCount: 2,
      minorityInterval: 6,
      majorityCount: 5,
      majorityInterval: 7,
      accidentalInterval: 1,
    })
  })

  describe("48edo", () => {
    testLetterIntervalPlan(48, {
      minorityCount: 2,
      minorityInterval: 4,
      majorityCount: 5,
      majorityInterval: 8,
      accidentalInterval: 4,
    })
  })

  describe("49edo", () => {
    testLetterIntervalPlan(49, {
      minorityCount: 2,
      minorityInterval: 2,
      majorityCount: 5,
      majorityInterval: 9,
      accidentalInterval: 7,
    })
  })

  describe("50edo", () => {
    testLetterIntervalPlan(50, {
      minorityCount: 2,
      minorityInterval: 5,
      majorityCount: 5,
      majorityInterval: 8,
      accidentalInterval: 3,
    })
  })

  describe("51edo", () => {
    testLetterIntervalPlan(51, {
      minorityCount: 2,
      minorityInterval: 3,
      majorityCount: 5,
      majorityInterval: 9,
      accidentalInterval: 6,
    })
  })

  describe("52edo", () => {
    testLetterIntervalPlan(52, {
      minorityCount: 2,
      minorityInterval: 6,
      majorityCount: 5,
      majorityInterval: 8,
      accidentalInterval: 2,
    })
  })

  describe("53edo", () => {
    testLetterIntervalPlan(53, {
      minorityCount: 2,
      minorityInterval: 4,
      majorityCount: 5,
      majorityInterval: 9,
      accidentalInterval: 5,
    })
    testNoteMapping(KeyTuning.edo(53), {
      0: ["A4"],
      1: ["^A4"],
      2: ["^^A4", "vvBb4"],
      3: ["vvA#4", "vBb4"],
      4: ["vA#4", "Bb4"],
      5: ["^Bb4", "A#4"],
      6: ["^^Bb4", "^A#4"],
      7: ["vvB4", "^^A#4"],
      8: ["vB4"],
      9: ["B4"],
      10: ["^B4"],
      11: ["^^B4", "vvC5"],
      12: ["vC5"],
      13: ["C5"],
      14: ["^C5"],
      15: ["^^C5", "vvDb5"],
      16: ["vvC#5", "vDb5"],
      17: ["vC#5", "Db5"],
      18: ["^Db5", "C#5"],
      19: ["^^Db5", "^C#5"],
      20: ["vvD5", "^^C#5"],
      21: ["vD5"],
      22: ["D5"],
      23: ["^D5"],
      24: ["^^D5", "vvEb5"],
      25: ["vvD#5", "vEb5"],
      26: ["vD#5", "Eb5"],
      27: ["^Eb5", "D#5"],
      28: ["^^Eb5", "^D#5"],
      29: ["vvE5", "^^D#5"],
      30: ["vE5"],
      31: ["E5"],
      32: ["^E5"],
      33: ["^^E5", "vvF5"],
      34: ["vF5"],
      35: ["F5"],
      36: ["^F5"],
      37: ["^^F5", "vvGb5"],
      38: ["vvF#5", "vGb5"],
      39: ["vF#5", "Gb5"],
      40: ["^Gb5", "F#5"],
      41: ["^^Gb5", "^F#5"],
      42: ["vvG5", "^^F#5"],
      43: ["vG5"],
      44: ["G5"],
      45: ["^G5"],
      46: ["^^G5", "vvAb5"],
      47: ["vvG#5", "vAb5"],
      48: ["vG#5", "Ab5"],
      49: ["^Ab5", "G#5"],
      50: ["^^Ab5", "^G#5"],
      51: ["vvA5", "^^G#5"],
      52: ["vA5"],
      53: ["A5"],

      "-53": ["A3"],
    })
  })

  describe("54edo", () => {
    testLetterIntervalPlan(54, {
      minorityCount: 2,
      minorityInterval: 2,
      majorityCount: 5,
      majorityInterval: 10,
      accidentalInterval: 8,
    })
  })

  describe("55edo", () => {
    testLetterIntervalPlan(55, {
      minorityCount: 2,
      minorityInterval: 5,
      majorityCount: 5,
      majorityInterval: 9,
      accidentalInterval: 4,
    })
  })

  // ...

  describe("96edo", () => {
    testLetterIntervalPlan(96, {
      minorityCount: 2,
      minorityInterval: 8,
      majorityCount: 5,
      majorityInterval: 16,
      accidentalInterval: 8,
    })
    testNoteMapping(KeyTuning.edo(96), {
      0: ["A4"],
      1: ["^A4"],
      2: ["^^A4"],
      3: ["^^^A4"],
      4: ["^^^^A4", "vvvvA#4", "vvvvBb4"],
      5: ["vvvA#4", "vvvBb4"],
      6: ["vvA#4", "vvBb4"],
      7: ["vA#4", "vBb4"],
      8: ["A#4", "Bb4"],
      9: ["^Bb4", "^A#4"],
      10: ["^^Bb4", "^^A#4"],
      11: ["^^^Bb4", "^^^A#4"],
      12: ["vvvvB4", "^^^^Bb4", "^^^^A#4"],
      13: ["vvvB4"],
      14: ["vvB4"],
      15: ["vB4"],
      16: ["B4"],
      17: ["^B4"],
      18: ["^^B4"],
      19: ["^^^B4"],
      20: ["^^^^B4", "vvvvC5"],
      21: ["vvvC5"],
      22: ["vvC5"],
      23: ["vC5"],
      24: ["C5"],
      25: ["^C5"],
      26: ["^^C5"],
      27: ["^^^C5"],
      28: ["^^^^C5", "vvvvC#5", "vvvvDb5"],
      29: ["vvvC#5", "vvvDb5"],
      30: ["vvC#5", "vvDb5"],
      31: ["vC#5", "vDb5"],
      32: ["C#5", "Db5"],
      33: ["^Db5", "^C#5"],
      34: ["^^Db5", "^^C#5"],
      35: ["^^^Db5", "^^^C#5"],
      36: ["vvvvD5", "^^^^Db5", "^^^^C#5"],
      37: ["vvvD5"],
      38: ["vvD5"],
      39: ["vD5"],
      40: ["D5"],
      41: ["^D5"],
      42: ["^^D5"],
      43: ["^^^D5"],
      44: ["^^^^D5", "vvvvD#5", "vvvvEb5"],
      45: ["vvvD#5", "vvvEb5"],
      46: ["vvD#5", "vvEb5"],
      47: ["vD#5", "vEb5"],
      48: ["D#5", "Eb5"],
      49: ["^Eb5", "^D#5"],
      50: ["^^Eb5", "^^D#5"],
      51: ["^^^Eb5", "^^^D#5"],
      52: ["vvvvE5", "^^^^Eb5", "^^^^D#5"],
      53: ["vvvE5"],
      54: ["vvE5"],
      55: ["vE5"],
      56: ["E5"],
      57: ["^E5"],
      58: ["^^E5"],
      59: ["^^^E5"],
      60: ["^^^^E5", "vvvvF5"],
      61: ["vvvF5"],
      62: ["vvF5"],
      63: ["vF5"],
      64: ["F5"],
      65: ["^F5"],
      66: ["^^F5"],
      67: ["^^^F5"],
      68: ["^^^^F5", "vvvvF#5", "vvvvGb5"],
      69: ["vvvF#5", "vvvGb5"],
      70: ["vvF#5", "vvGb5"],
      71: ["vF#5", "vGb5"],
      72: ["F#5", "Gb5"],
      73: ["^Gb5", "^F#5"],
      74: ["^^Gb5", "^^F#5"],
      75: ["^^^Gb5", "^^^F#5"],
      76: ["vvvvG5", "^^^^Gb5", "^^^^F#5"],
      77: ["vvvG5"],
      78: ["vvG5"],
      79: ["vG5"],
      80: ["G5"],
      81: ["^G5"],
      82: ["^^G5"],
      83: ["^^^G5"],
      84: ["^^^^G5", "vvvvG#5", "vvvvAb5"],
      85: ["vvvG#5", "vvvAb5"],
      86: ["vvG#5", "vvAb5"],
      87: ["vG#5", "vAb5"],
      88: ["G#5", "Ab5"],
      89: ["^Ab5", "^G#5"],
      90: ["^^Ab5", "^^G#5"],
      91: ["^^^Ab5", "^^^G#5"],
      92: ["vvvvA5", "^^^^Ab5", "^^^^G#5"],
      93: ["vvvA5"],
      94: ["vvA5"],
      95: ["vA5"],
      96: ["A5"],

      "-96": ["A3"],
    })
  })
})
