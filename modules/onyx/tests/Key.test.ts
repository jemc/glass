import { describe, expect, test } from "@jest/globals"
import { Key, KeyNote } from "../src/Key"

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
})
