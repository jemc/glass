import { countOneBits } from "@glass/core"

export type KeyNote =
  `${KeyNoteNudge}${KeyNoteLetter}${KeyNoteAccidental}${KeyNoteOctave | ""}`

export type KeyNoteLetter = "C" | "D" | "E" | "F" | "G" | "A" | "B"

export type KeyNoteAccidental = "" | "b" | "#" | "bb" | "##"

export type KeyNoteNudge = "" | "^" | "v" // used by microtonal tunings

export type KeyNoteOctave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type KeyTertianChordQuality =
  | "maj" /////// (0, 4, 7) in 12edo
  | "min" /////// (0, 3, 7) in 12edo
  | "aug" /////// (0, 4, 8) in 12edo
  | "dim" /////// (0, 3, 6) in 12edo
  | "maj-b5" //// (0, 4, 6) in 12edo
  | "min-#5" //// (0, 3, 8) in 12edo
  | "sus2" ////// (0, 2, 7) in 12edo
  | "sus2-dim" // (0, 2, 6) in 12edo
  | "sus2-aug" // (0, 2, 8) in 12edo
  | "sus4" ////// (0, 5, 7) in 12edo
  | "sus4-aug" // (0, 5, 8) in 12edo

function noteNormalize(note: KeyNote): KeyNote {
  if (!note.match(/(\d+)$/)) return `${note}4` as KeyNote
  return note
}

export class KeyTuning {
  // TODO: Make this base frequency customizable
  private static baseFrequencyA4 = 440

  private constructor(
    // The number of equal-sized steps to divide the 2:1 perfect octave interval
    readonly stepsPerOctave: number,

    // The number of the above steps after which the scale will repeat.
    //
    // Usually this should be the same as `stepsPerOctave`, but some tunings
    // may vary this by a step or so in either direction to achieve affects
    // based on maintaining consonance near the octave boundary, in ways that
    // cause the scale to spiral to slightly different keys above and below.
    //
    // For examples of this, see the "Double Lydian" scale in 31edo,
    // which uses 31 steps per octave, but repeats the scale every 30 steps,
    // such that each successive octave is "detuned" by one step.
    readonly stepsPerScaleOctave: number = stepsPerOctave,

    // An optional array of adjustments to make to the tuning of each step,
    // with each array item indicating the number of cents to adjust the
    // tuning of the corresponding step index, compared to the base frequency
    // that was obtained through equal division of the perfect octave.
    //
    // The length of this array should match the `stepsPerScaleOctave` value,
    // if you intend to apply adjustments to every step in the scale.
    // The adjustments will repeat again from each scale octave.
    readonly perStepCentAdjustments: ReadonlyArray<number> = [],

    // The frequency to use for the A4 note, in Hz.
    private readonly frequencyA4: number = 440,
  ) {
    if (this.stepsPerOctave <= 0)
      throw new Error("KeyTuning stepsPerOctave must be positive")
    if (!Number.isInteger(this.stepsPerOctave))
      throw new Error("KeyTuning stepsPerOctave must be an integer")

    if (this.stepsPerScaleOctave <= 0)
      throw new Error("KeyTuning stepsPerScaleOctave must be positive")
    if (!Number.isInteger(this.stepsPerScaleOctave))
      throw new Error("KeyTuning stepsPerScaleOctave must be an integer")

    if (this.perStepCentAdjustments.length > this.stepsPerScaleOctave) {
      throw new Error(
        "KeyTuning perStepCentAdjustments must not exceed stepsPerScaleOctave",
      )
    }

    if (this.frequencyA4 <= 0)
      throw new Error("KeyTuning frequencyA4 must be positive")
  }

  // Create an EDO tuning (equal division of the octave).
  static edo(stepsPerOctave: number) {
    return new KeyTuning(stepsPerOctave)
  }

  frequencyOf(note: KeyNote): number {
    return (
      KeyTuning.baseFrequencyA4 *
      Math.pow(2, this.stepsFromA4(note) / this.stepsPerOctave)
    )
  }

  private stepsFromA4(note: KeyNote): number {
    const match = note.match(/^([v^]*)([A-G])([^\d]*)(\d+)$/)
    if (!match) throw new Error(`invalid note: ${note}`)

    const nudge = match[1]! as KeyNoteNudge
    const letter = match[2]! as KeyNoteLetter
    const accidental = match[3]! as KeyNoteAccidental
    const octave = Number.parseInt(match[4]!) as KeyNoteOctave

    if (this.stepsPerOctave === 12)
      return KeyTuning.noteStepsFromA4In12edo(nudge, letter, accidental, octave)

    if (this.stepsPerOctave === 31)
      return KeyTuning.noteStepsFromA4In31edo(nudge, letter, accidental, octave)

    throw new Error(`KeyTuning stepsFromA4 not yet implemented for ${this}`)
  }

  private static noteStepsFromA4In12edo(
    nudge: KeyNoteNudge,
    letter: KeyNoteLetter,
    accidental: KeyNoteAccidental,
    octave: KeyNoteOctave,
  ): number {
    const letterSteps = {
      C: -9,
      D: -7,
      E: -5,
      F: -4,
      G: -2,
      A: 0,
      B: 2,
    }[letter]

    const accidentalSteps = {
      "": 0,
      b: -1,
      "#": 1,
      bb: -1,
      "##": 1,
    }[accidental]

    return letterSteps + accidentalSteps + (octave - 4) * 12
  }

  private static noteStepsFromA4In31edo(
    nudge: KeyNoteNudge,
    letter: KeyNoteLetter,
    accidental: KeyNoteAccidental,
    octave: KeyNoteOctave,
  ): number {
    const letterSteps = {
      C: -23,
      D: -18,
      E: -13,
      F: -10,
      G: -5,
      A: 0,
      B: 5,
    }[letter]

    const accidentalSteps = {
      "": 0,
      b: -2,
      "#": 2,
      bb: -4,
      "##": 4,
    }[accidental]

    const nudgeSteps = {
      "": 0,
      "^": 1,
      v: -1,
    }[nudge]

    return letterSteps + accidentalSteps + nudgeSteps + (octave - 4) * 31
  }
}

export const KeyTuning12edo = KeyTuning.edo(12)
export const KeyTuning31edo = KeyTuning.edo(31)
// TODO: add just intonation tunings

export class Key {
  readonly root: KeyNote
  readonly rootFrequency: number
  private constructor(
    readonly tuning: KeyTuning,
    root: KeyNote,
    private modeBits: number,
  ) {
    this.root = noteNormalize(root)
    this.rootFrequency = tuning.frequencyOf(this.root)
  }

  static fromBits(bits: number, tuning: KeyTuning = KeyTuning12edo) {
    return new Key(tuning, "C4", bits)
  }

  static of(root: KeyNote) {
    return {
      major: anyMode.Ionian.transposeTo(root),
      minor: anyMode.Aeolian.transposeTo(root),
      mode: (mode: keyof typeof anyMode): Key =>
        anyMode[mode].transposeTo(root),
      melakarta: (number: number): Key | undefined =>
        melakartasByNumber[number - 1]?.transposeTo(root),
    }
  }

  // See https://ianring.com/musictheory/scales/
  get ringScaleNumber(): number {
    return this.modeBits
  }

  get noteCount(): number {
    return countOneBits(this.modeBits)
  }

  get rootOctave(): number {
    return Number.parseInt(this.root.match(/\d+$/)![0])
  }

  transposeTo(root: KeyNote): Key {
    return new Key(this.tuning, root, this.modeBits)
  }

  relativeMode(modeNumber: number): Key {
    if (modeNumber < 1) throw new Error("mode number must be positive")

    const rotateDegrees = modeNumber - 1
    const width = this.tuning.stepsPerScaleOctave
    const mask = (1 << width) - 1

    // If we encounter a key with zero notes, there is no need to rotate,
    // and the below loop will not terminate, so we need to bail out here.
    if (this.modeBits === 0) return this

    // Rotate the bits, one note (i.e. one set bit) at a time.
    // The result will always have the "one" bit set (the new root of the key).
    let rotatedBits = this.modeBits
    for (let i = 0; i < rotateDegrees; i++) {
      do {
        rotatedBits = (rotatedBits >> 1) | ((rotatedBits << (width - 1)) & mask)
      } while ((rotatedBits & 1) === 0)
    }

    return new Key(this.tuning, this.root, rotatedBits)
  }

  getDegreeFrequency(degree: number, octave: number = this.rootOctave): number {
    // Get the number of steps for that scale degree.
    let stepOffset = this.getDegreeDistance(degree)

    // Compensate for the octave, as needed.
    if (!Number.isInteger(octave)) throw new Error("octave must be an integer")
    let octaveOffset = octave - this.rootOctave
    while (octaveOffset < 0) {
      stepOffset -= this.tuning.stepsPerScaleOctave
      octaveOffset += 1
    }
    while (octaveOffset > 0) {
      stepOffset += this.tuning.stepsPerScaleOctave
      octaveOffset -= 1
    }

    // TODO: Make adjustments when relevant for the tuning.
    if (this.tuning.perStepCentAdjustments.length > 0)
      throw new Error("KeyTuning perStepCentAdjustments not implemented yet")

    // Get the final frequency.
    return (
      this.rootFrequency * Math.pow(2, stepOffset / this.tuning.stepsPerOctave)
    )
  }

  // Return the number of tuning steps from the root to the given scale degree.
  //
  // Positive numbers greater than the `noteCount` imply notes in upper octaves.
  // Numbers less than 1 imply notes in lower octaves (below the key root).
  //
  // Non-integers imply fractional scale degrees, which are interpreted as
  // dividing the inter-degree interval into its tuning steps, rounding the
  // fraction to the nearest implied step in the tuning.
  getDegreeDistance(degree: number): number {
    let distance = 0 // steps away from the root

    // If the degree is not positive, we can look at a higher octave of it.
    //
    // For example, degree 0 is "like" a 7 in a heptatonic scale, and so on.
    //
    // But we need to compensate by adding a negative bias to the distance,
    // according to the number of steps traversed in our "octave up" jumps.
    // This loop will jump an octave up like so until the degree is positive.
    while (degree < 1) {
      degree += this.noteCount
      distance -= this.tuning.stepsPerScaleOctave
    }

    // In the simple case where the scale degree is an integer, we can just
    // look up the number of steps from the root to the given scale degree.
    if (Number.isInteger(degree)) {
      distance += this.getPositiveIntegerDegreeDistance(degree)
      return distance
    }

    // Non-integer scale degrees imply that we should subdivide the interval
    // between the two nearest integer scale degrees according to the steps
    // available in the tuning, and select the step value which most closely
    // represents the given fractional scale degree.
    //
    // For example, if we have a major scale in 12edo tuning, and we ask
    // for scale degree 4.4, we notice that there are two steps between
    // the 4th and 5th scale degrees, and that the 0.4 fraction rounds to 1/2,
    // therefore we would select the chromatic step halfway between 4 and 5
    // That is, we'd get a tritone (6 steps in 12edo) above the root.
    // In this case, 4.4 and 4.6 would both yield the same result.
    //
    // But imagine we were playing in a 12edo scale where the 4th scale degree
    // has been flattened by one step, meaning that we have three steps between
    // the 4th and 5th scale degrees. In this case, 4.4 would give us the
    // natural 4, while 4.6 would give us the flattened 5 (different results).
    //
    // Similarly, in a 31edo scale, there are usually more than 2 steps between
    // any two scale degrees, so the fractional scale degree would be more
    // finely subdivided, and the result would be more precise.
    //
    // This system lets us use the same input numbers for Riff sequence lines
    // which will get their most natural interpretation in any given tuning.
    // Some tunings may be able to take more advantage of this than others.
    //
    // To write Riff sequence lines that accommodate microtonal nuance, you can
    // think of the following fractional numbers as meaning the following:
    // - X + 0.4 means "X#"
    // - X - 0.4 means "Xb"
    // - X + 0.2 means "^X" (or "half sharp", sometimes called "shat")
    // - X - 0.2 means "vX" (or "half flat", sometimes called "flarp")
    const upperDegree = Math.ceil(degree)
    const lowerDegree = Math.floor(degree)
    const upperDistance = this.getDegreeDistance(upperDegree)
    const lowerDistance = this.getDegreeDistance(lowerDegree)
    const stepsBetween = upperDistance - lowerDistance
    const stepsToTake = Math.round((degree - lowerDegree) * stepsBetween)
    distance += lowerDistance + stepsToTake
    return distance
  }
  private getPositiveIntegerDegreeDistance(degree: number) {
    if (degree < 1) throw new Error("integer scale degree must be positive")

    const rotateDegrees = degree - 1
    const width = this.tuning.stepsPerScaleOctave
    const mask = (1 << width) - 1

    let rotatedBits = this.modeBits
    let steps = 0
    for (let i = 0; i < rotateDegrees; i++) {
      do {
        steps += 1
        rotatedBits = (rotatedBits >> 1) | ((rotatedBits << (width - 1)) & mask)
      } while ((rotatedBits & 1) === 0)
    }

    return steps
  }

  private static tertianQualityMatrix12edo: (
    | KeyTertianChordQuality
    | undefined
  )[][] = [
    [undefined, undefined, "sus2-dim", "sus2", "sus2-aug"],
    [undefined, "dim", "min", "min-#5"],
    ["maj-b5", "maj", "aug"],
    ["sus4", "sus4-aug"],
  ]
  getTertianQuality(degree1: number): KeyTertianChordQuality | undefined {
    const degree2 = degree1 + 2
    const degree3 = degree2 + 2

    const distance1 = this.getDegreeDistance(degree1)
    const distance2 = this.getDegreeDistance(degree2)
    const distance3 = this.getDegreeDistance(degree3)

    const delta1 = distance2 - distance1
    const delta2 = distance3 - distance2

    if (this.tuning.stepsPerOctave !== 12)
      throw new Error("this method currently only works in 12edo")

    return Key.tertianQualityMatrix12edo.at(delta1 - 2)?.at(delta2 - 2)
  }
  private static expoundTertianQuality12edo(
    quality: KeyTertianChordQuality,
  ): [number, number] {
    for (const [i, row] of Key.tertianQualityMatrix12edo.entries()) {
      for (const [j, q] of row.entries()) {
        if (q === quality) {
          return [i + 2, i + 2 + j + 2]
        }
      }
    }
    throw new Error(`unknown tertian quality: ${quality}`)
  }

  // Return the "onyx name" for the key, which is a three-part (two-syllable)
  // semantic name, conveying the tonal quality of the I, IV, and V chords:
  //
  // - the starting consonant(s) and vowel(s) convey the quality of the I chord
  // - the center consonant(s) convey the quality of the IV chord
  // - the ending consonant(s) and vowel(s) convey the quality of the V chord
  //
  // Together, the three of these uniquely and fully specify a heptatonic scale,
  // such that among heptatonic scales, no two scales have the same onyx name,
  // and the onyx name is sufficient information to derive the scale values.
  // The one exception to this rule is the "unknown" quality, yielding "?" marks
  // in the naming tertian qualities which have not yet been implemented.
  //
  // See the `Key.onyxNameScheme` table for the implications of each name part.
  get onyxName(): string {
    // TODO: handle non-heptatonic scales
    const n1 = Key.onyxNameScheme[this.getTertianQuality(1) ?? "?"][0]
    const n4 = Key.onyxNameScheme[this.getTertianQuality(4) ?? "?"][1]
    const n5 = Key.onyxNameScheme[this.getTertianQuality(5) ?? "?"][2]
    return `${n1}${n4}${n5}`
  }
  private static onyxNamePattern = /^([A-Z][aeiouy]+)([^aeiouy]+)([a-z]+)$/
  static onyxNameScheme: {
    [key in KeyTertianChordQuality | "?"]: [string, string, string]
  } = {
    //                  I   IV   V
    maj: /*********/ ["Ma", "m", "am"],
    min: /*********/ ["Ni", "n", "in"],
    aug: /*********/ ["Ga", "g", "ug"],
    dim: /*********/ ["Di", "d", "id"],
    "maj-b5": /****/ ["Da", "dm", "ad"],
    "min-#5": /****/ ["Gi", "gn", "ig"],
    sus2: /********/ ["Too", "t", "oot"],
    "sus2-aug": /**/ ["Goo", "gt", "oog"],
    "sus2-dim": /**/ ["Doo", "dt", "ood"],
    sus4: /********/ ["Foh", "f", "ohf"],
    "sus4-aug": /**/ ["Goh", "gf", "ohg"],
    "?": /*********/ ["?x", "?", "x?"],
  }
  static fromOnyxName(root: KeyNote, name: string): Key {
    const match = name.match(Key.onyxNamePattern)
    if (!match) throw new Error(`invalid onyx name: ${name}`)

    // TODO: support non-12edo, and non-heptatonic scales by name

    const q1 = Object.entries(Key.onyxNameScheme)
      .find(([k, names]) => match[1] === names[0])
      ?.at(0)
    const q4 = Object.entries(Key.onyxNameScheme)
      .find(([k, names]) => match[2] === names[1])
      ?.at(0)
    const q5 = Object.entries(Key.onyxNameScheme)
      .find(([k, names]) => match[3] === names[2])
      ?.at(0)
    if (!q1 || !q4 || !q5)
      throw new Error(`invalid onyx name: ${name} (${q1}, ${q4}, ${q5})`)

    const octave = 12
    const [d1to3, d1to5] = Key.expoundTertianQuality12edo(
      q1 as KeyTertianChordQuality,
    )
    const [d4to6, d4to8] = Key.expoundTertianQuality12edo(
      q4 as KeyTertianChordQuality,
    )
    const [d5to7, d5to9] = Key.expoundTertianQuality12edo(
      q5 as KeyTertianChordQuality,
    )

    const d1 = 0
    const d3 = d1to3
    const d5 = d1to5
    const d7 = d5 + d5to7
    const d2 = d5 + d5to9 - octave
    const d4 = octave - d4to8
    const d6 = d4 + d4to6

    const bits =
      (1 << d1) |
      (1 << d2) |
      (1 << d3) |
      (1 << d4) |
      (1 << d6) |
      (1 << d5) |
      (1 << d7)

    return Key.fromBits(bits).transposeTo(root)
  }

  // Svaras (or swaras) are scale degrees in Carnatic music, which can indicate
  // not only the scale degree but also the distance from root, with
  // a single syllable indicating each.
  //
  // Noticing whether a given scale "has" a given svara is a helpful way to
  // functionally classify the tonal qualities to expect from a given scale.
  //
  // These svaras also form the basis for the melakarta system, with the
  // combinations of all possible coherent svaras forming the exhaustive 72
  // melakarta scales.
  //
  // See https://en.wikipedia.org/wiki/Svara#Svaras_in_Carnatic_music
  //
  // See also the tests for this function to see the melakarta numbering rules
  // that entail the 72 possible combinations of svaras.
  hasSvara(
    name:
      | "sa"
      | "ra"
      | "ri"
      | "ru"
      | "ga"
      | "gi"
      | "gu"
      | "ma"
      | "mi"
      | "pa"
      | "dha"
      | "dhi"
      | "dhu"
      | "na"
      | "ni"
      | "nu",
  ) {
    if (this.tuning.stepsPerOctave !== 12)
      throw new Error("this method currently only works in 12edo")

    switch (name) {
      case "sa":
        return this.getDegreeDistance(1) === 0
      case "ra":
        return this.getDegreeDistance(2) === 1
      case "ri":
        return this.getDegreeDistance(2) === 2
      case "ru":
        return this.getDegreeDistance(2) === 3
      case "ga":
        return this.getDegreeDistance(3) === 2
      case "gi":
        return this.getDegreeDistance(3) === 3
      case "gu":
        return this.getDegreeDistance(3) === 4
      case "ma":
        return this.getDegreeDistance(4) === 5
      case "mi":
        return this.getDegreeDistance(4) === 6
      case "pa":
        return this.getDegreeDistance(5) === 7
      case "dha":
        return this.getDegreeDistance(6) === 8
      case "dhi":
        return this.getDegreeDistance(6) === 9
      case "dhu":
        return this.getDegreeDistance(6) === 10
      case "na":
        return this.getDegreeDistance(7) === 9
      case "ni":
        return this.getDegreeDistance(7) === 10
      case "nu":
        return this.getDegreeDistance(7) === 11
    }
  }
}

const h = 1
const w = 2
const A = 3
const B = 4
function mode12edo(...semitoneCounts: number[]): Key {
  if (semitoneCounts.reduce((acc, count) => acc + count, 0) !== 12)
    throw new Error("sum of semitone counts must be 12 when in 12edo")

  return Key.fromBits(
    semitoneCounts.reverse().reduce((acc, semitoneCount) => {
      return (acc << semitoneCount) | 1
    }, 0),
  )
}

const base = {
  Major: /********************/ mode12edo(w, w, h, w, w, w, h),
  "Jazz Minor": /*************/ mode12edo(w, h, w, w, w, w, h),
  "Harmonic Major": /*********/ mode12edo(w, w, h, w, h, A, h),
  "Harmonic Minor": /*********/ mode12edo(w, h, w, w, h, A, h),
  "Double Harmonic Major": /**/ mode12edo(h, A, h, w, h, A, h),
  "Neapolitan Minor": /*******/ mode12edo(h, w, w, w, h, A, h),
  "Neapolitan Major": /*******/ mode12edo(h, w, w, w, w, w, h),
  "Hungarian Major": /********/ mode12edo(A, h, w, h, w, h, w),
  "Romanian Major": /*********/ mode12edo(h, A, w, h, w, h, w),
  "Harmonic Lydian": /********/ mode12edo(w, w, w, h, h, A, h),

  "Mixolydian #2": /**********/ mode12edo(A, h, h, w, w, h, w),
  "Lydian b2": /**************/ mode12edo(h, A, w, h, w, w, h),

  "Lydian b2 b6": /***********/ mode12edo(h, A, w, h, h, A, h),
  "Ionian #2 #6": /***********/ mode12edo(A, h, h, w, A, h, h),
  "Lydian b2 b3": /***********/ mode12edo(h, w, A, h, w, w, h),
  "Phrygian #3 #4": /*********/ mode12edo(h, A, w, h, h, w, w),
  "Phrygian b3 #4": /*********/ mode12edo(h, h, B, h, h, w, w),
  "Lydian #2 b6 b7": /********/ mode12edo(A, h, w, h, h, w, w),
  "Ionian b2 b3 b4": /********/ mode12edo(h, w, h, A, w, w, h),
  "Ionian #2 b6": /***********/ mode12edo(A, h, h, w, h, A, h),
  "Lydian #2 b6": /***********/ mode12edo(A, h, w, h, h, A, h),
  "Ionian #6 b3": /***********/ mode12edo(w, h, w, w, A, h, h),
  "Dorian b2 b3": /***********/ mode12edo(h, h, A, w, w, h, w),
  "Lydian b7 b2 #3": /********/ mode12edo(h, B, h, h, w, h, w),
  "Lydian b7 b2 bb3": /*******/ mode12edo(h, h, B, h, w, h, w),
  "Ionian #2 b6 bb7": /*******/ mode12edo(A, h, h, w, h, h, A),
  "Ionian b2 #6": /***********/ mode12edo(h, A, h, w, A, h, h),
  "Aeolian #4 b7": /**********/ mode12edo(w, h, A, h, h, h, A),
  "Phrygian b7 b3 #4": /******/ mode12edo(h, h, B, h, h, h, A),
  "Phrygian b3 #4 #7": /******/ mode12edo(h, h, B, h, h, A, h),
  "Lydian b2 b3 #6": /********/ mode12edo(h, w, A, h, A, h, h),
  "Phrygian #3 #4 b7": /******/ mode12edo(h, A, w, h, h, h, A),
  "Ionian b2 b3 #6": /********/ mode12edo(h, w, w, w, A, h, h),
  "Ionian b2 bb3": /**********/ mode12edo(h, h, A, w, w, w, h),
  "Ionian ##5 #6": /**********/ mode12edo(w, w, h, B, h, h, h),
  "Ionian b2 bb3 #4": /*******/ mode12edo(h, h, B, h, w, w, h),
  "Ionian b2 b3 b4 #6": /*****/ mode12edo(h, w, h, A, A, h, h),
  "Ionian #2 #4 b6 bb7": /****/ mode12edo(A, h, w, h, h, h, A),
  "Ionian b2 bb3 #6": /*******/ mode12edo(h, h, A, w, A, h, h),
  "Phrygian ##3 #4 b7": /*****/ mode12edo(h, B, h, h, h, h, A),
  "Ionian b2 bb3 #4 #6": /****/ mode12edo(h, h, B, h, A, h, h),
}

const modes = {
  ...base,

  Ionian: base["Major"].relativeMode(1),
  Dorian: base["Major"].relativeMode(2),
  Phrygian: base["Major"].relativeMode(3),
  Lydian: base["Major"].relativeMode(4),
  Mixolydian: base["Major"].relativeMode(5),
  Aeolian: base["Major"].relativeMode(6),
  Locrian: base["Major"].relativeMode(7),

  "Dorian #7": base["Jazz Minor"].relativeMode(1),
  "Phrygian #6": base["Jazz Minor"].relativeMode(2),
  "Lydian #5": base["Jazz Minor"].relativeMode(3),
  "Mixolydian #4": base["Jazz Minor"].relativeMode(4),
  "Aeolian #3": base["Jazz Minor"].relativeMode(5),
  "Locrian #2": base["Jazz Minor"].relativeMode(6),
  "Ionian #1": base["Jazz Minor"].relativeMode(7),

  "Ionian b6": base["Harmonic Major"].relativeMode(1),
  "Dorian b5": base["Harmonic Major"].relativeMode(2),
  "Phrygian b4": base["Harmonic Major"].relativeMode(3),
  "Lydian b3": base["Harmonic Major"].relativeMode(4),
  "Mixolydian b2": base["Harmonic Major"].relativeMode(5),
  "Aeolian b1": base["Harmonic Major"].relativeMode(6),
  "Locrian b7": base["Harmonic Major"].relativeMode(7),

  "Aeolian #7": base["Harmonic Minor"].relativeMode(1),
  "Locrian #6": base["Harmonic Minor"].relativeMode(2),
  "Ionian #5": base["Harmonic Minor"].relativeMode(3),
  "Dorian #4": base["Harmonic Minor"].relativeMode(4),
  "Phrygian #3": base["Harmonic Minor"].relativeMode(5),
  "Lydian #2": base["Harmonic Minor"].relativeMode(6),
  "Mixolydian #1": base["Harmonic Minor"].relativeMode(7),

  "Phrygian #3 #7": base["Double Harmonic Major"].relativeMode(1),
  "Lydian #2 #6": base["Double Harmonic Major"].relativeMode(2),
  "Mixolydian #1 #5": base["Double Harmonic Major"].relativeMode(3),
  "Aeolian #7 #4": base["Double Harmonic Major"].relativeMode(4),
  "Locrian #6 #3": base["Double Harmonic Major"].relativeMode(5),
  "Ionian #5 #2": base["Double Harmonic Major"].relativeMode(6),
  "Dorian #4 #1": base["Double Harmonic Major"].relativeMode(7),

  "Phrygian #7": base["Neapolitan Minor"].relativeMode(1),
  "Lydian #6": base["Neapolitan Minor"].relativeMode(2),
  "Mixolydian #5": base["Neapolitan Minor"].relativeMode(3),
  "Aeolian #4": base["Neapolitan Minor"].relativeMode(4),
  "Locrian #3": base["Neapolitan Minor"].relativeMode(5),
  "Ionian #2": base["Neapolitan Minor"].relativeMode(6),
  "Dorian #1": base["Neapolitan Minor"].relativeMode(7),

  "Dorian #7 b2": base["Neapolitan Major"].relativeMode(1),
  "Phrygian #6 b1": base["Neapolitan Major"].relativeMode(2),
  "Lydian #5 b7": base["Neapolitan Major"].relativeMode(3),
  "Mixolydian #4 b6": base["Neapolitan Major"].relativeMode(4),
  "Aeolian #3 b5": base["Neapolitan Major"].relativeMode(5),
  "Locrian #2 b4": base["Neapolitan Major"].relativeMode(6),
  "Ionian #1 b3": base["Neapolitan Major"].relativeMode(7),

  "Mixolydian #4 #2": base["Hungarian Major"].relativeMode(1),
  "Aeolian #3 #1": base["Hungarian Major"].relativeMode(2),
  "Locrian #2 #7": base["Hungarian Major"].relativeMode(3),
  "Ionian #1 #6": base["Hungarian Major"].relativeMode(4),
  "Dorian #7 #5": base["Hungarian Major"].relativeMode(5),
  "Phrygian #6 #4": base["Hungarian Major"].relativeMode(6),
  "Lydian #5 #3": base["Hungarian Major"].relativeMode(7),

  "Lydian b7 b2": base["Romanian Major"].relativeMode(1),
  "Mixolydian b6 b1": base["Romanian Major"].relativeMode(2),
  "Aeolian b5 b7": base["Romanian Major"].relativeMode(3),
  "Locrian b4 b6": base["Romanian Major"].relativeMode(4),
  "Ionian b3 b5": base["Romanian Major"].relativeMode(5),
  "Dorian b2 b4": base["Romanian Major"].relativeMode(6),
  "Phrygian b1 b3": base["Romanian Major"].relativeMode(7),

  "Lydian b6": base["Harmonic Lydian"].relativeMode(1),
  "Mixolydian b5": base["Harmonic Lydian"].relativeMode(2),
  "Aeolian b4": base["Harmonic Lydian"].relativeMode(3),
  "Locrian b3": base["Harmonic Lydian"].relativeMode(4),
  "Ionian b2": base["Harmonic Lydian"].relativeMode(5),
  "Dorian b1": base["Harmonic Lydian"].relativeMode(6),
  "Phrygian b7": base["Harmonic Lydian"].relativeMode(7),

  "Mixolydian #2": base["Mixolydian #2"].relativeMode(1),
  "Aeolian #1": base["Mixolydian #2"].relativeMode(2),
  "Locrian #7": base["Mixolydian #2"].relativeMode(3),
  "Ionian #6": base["Mixolydian #2"].relativeMode(4),
  "Dorian #5": base["Mixolydian #2"].relativeMode(5),
  "Phrygian #4": base["Mixolydian #2"].relativeMode(6),
  "Lydian #3": base["Mixolydian #2"].relativeMode(7),

  "Lydian b2": base["Lydian b2"].relativeMode(1),
  "Mixolydian b1": base["Lydian b2"].relativeMode(2),
  "Aeolian b7": base["Lydian b2"].relativeMode(3),
  "Locrian b6": base["Lydian b2"].relativeMode(4),
  "Ionian b5": base["Lydian b2"].relativeMode(5),
  "Dorian b4": base["Lydian b2"].relativeMode(6),
  "Phrygian b3": base["Lydian b2"].relativeMode(7),

  "Lydian b2 b6": base["Lydian b2 b6"].relativeMode(1),
  "Mixolydian b1 b5": base["Lydian b2 b6"].relativeMode(2),
  "Aeolian b7 b4": base["Lydian b2 b6"].relativeMode(3),
  "Locrian b6 b3": base["Lydian b2 b6"].relativeMode(4),
  "Ionian b5 b2": base["Lydian b2 b6"].relativeMode(5),
  "Dorian b4 b1": base["Lydian b2 b6"].relativeMode(6),
  "Phrygian b3 b7": base["Lydian b2 b6"].relativeMode(7),

  "Ionian #2 #6": base["Ionian #2 #6"].relativeMode(1),
  "Dorian #1 #5": base["Ionian #2 #6"].relativeMode(2),
  "Phrygian #7 #4": base["Ionian #2 #6"].relativeMode(3),
  "Lydian #6 #3": base["Ionian #2 #6"].relativeMode(4),
  "Mixolydian #5 #2": base["Ionian #2 #6"].relativeMode(5),
  "Aeolian #4 #1": base["Ionian #2 #6"].relativeMode(6),
  "Locrian #3 #7": base["Ionian #2 #6"].relativeMode(7),

  "Lydian b2 b3": base["Lydian b2 b3"].relativeMode(1),
  "Mixolydian b1 b2": base["Lydian b2 b3"].relativeMode(2),
  "Aeolian b7 b1": base["Lydian b2 b3"].relativeMode(3),
  "Locrian b6 b7": base["Lydian b2 b3"].relativeMode(4),
  "Ionian b5 b6": base["Lydian b2 b3"].relativeMode(5),
  "Dorian b4 b5": base["Lydian b2 b3"].relativeMode(6),
  "Phrygian b3 b4": base["Lydian b2 b3"].relativeMode(7),

  "Phrygian #3 #4": base["Phrygian #3 #4"].relativeMode(1),
  "Lydian #2 #3": base["Phrygian #3 #4"].relativeMode(2),
  "Mixolydian #1 #2": base["Phrygian #3 #4"].relativeMode(3),
  "Aeolian #7 #1": base["Phrygian #3 #4"].relativeMode(4),
  "Locrian #6 #7": base["Phrygian #3 #4"].relativeMode(5),
  "Ionian #5 #6": base["Phrygian #3 #4"].relativeMode(6),
  "Dorian #4 #5": base["Phrygian #3 #4"].relativeMode(7),

  "Phrygian b3 #4": base["Phrygian b3 #4"].relativeMode(1),
  "Lydian b2 #3": base["Phrygian b3 #4"].relativeMode(2),
  "Mixolydian b1 #2": base["Phrygian b3 #4"].relativeMode(3),
  "Aeolian b7 #1": base["Phrygian b3 #4"].relativeMode(4),
  "Locrian b6 #7": base["Phrygian b3 #4"].relativeMode(5),
  "Ionian b5 #6": base["Phrygian b3 #4"].relativeMode(6),
  "Dorian b4 #5": base["Phrygian b3 #4"].relativeMode(7),

  ///
  // Still need these scale groups:
  //
  // 7-Z37
  // 7-26 (partially done)

  "Lydian #2 b6 b7": base["Lydian #2 b6 b7"].relativeMode(1),
  "Mixolydian #1 b5 b6": base["Lydian #2 b6 b7"].relativeMode(2),
  "Aeolian #7 b4 b5": base["Lydian #2 b6 b7"].relativeMode(3),
  "Locrian #6 b3 b4": base["Lydian #2 b6 b7"].relativeMode(4),
  "Ionian #5 b2 b3": base["Lydian #2 b6 b7"].relativeMode(5),
  "Dorian #4 b1 b2": base["Lydian #2 b6 b7"].relativeMode(6),
  "Phrygian #3 b7 b1": base["Lydian #2 b6 b7"].relativeMode(7),

  "Ionian b2 b3 b4": base["Ionian b2 b3 b4"].relativeMode(1),
  "Dorian b1 b2 b3": base["Ionian b2 b3 b4"].relativeMode(2),
  "Phrygian b7 b1 b2": base["Ionian b2 b3 b4"].relativeMode(3),
  "Lydian b6 b7 b1": base["Ionian b2 b3 b4"].relativeMode(4),
  "Mixolydian b5 b6 b7": base["Ionian b2 b3 b4"].relativeMode(5),
  "Aeolian b4 b5 b6": base["Ionian b2 b3 b4"].relativeMode(6),
  "Locrian b3 b4 b5": base["Ionian b2 b3 b4"].relativeMode(7),

  "Ionian #2 b6": base["Ionian #2 b6"].relativeMode(1),
  "Dorian #1 b5": base["Ionian #2 b6"].relativeMode(2),
  "Phrygian #7 b4": base["Ionian #2 b6"].relativeMode(3),
  "Lydian #6 b3": base["Ionian #2 b6"].relativeMode(4),
  "Mixolydian #5 b2": base["Ionian #2 b6"].relativeMode(5),
  "Aeolian #4 b1": base["Ionian #2 b6"].relativeMode(6),
  "Locrian #3 b7": base["Ionian #2 b6"].relativeMode(7),

  "Lydian #2 b6": base["Lydian #2 b6"].relativeMode(1),
  "Mixolydian #1 b5": base["Lydian #2 b6"].relativeMode(2),
  "Aeolian #7 b4": base["Lydian #2 b6"].relativeMode(3),
  "Locrian #6 b3": base["Lydian #2 b6"].relativeMode(4),
  "Ionian #5 b2": base["Lydian #2 b6"].relativeMode(5),
  "Dorian #4 b1": base["Lydian #2 b6"].relativeMode(6),
  "Phrygian #3 b7": base["Lydian #2 b6"].relativeMode(7),

  ///
  // Still need these scale groups:
  //
  // 7-25

  "Ionian #6 b3": base["Ionian #6 b3"].relativeMode(1),
  "Dorian #5 b2": base["Ionian #6 b3"].relativeMode(2),
  "Phrygian #4 b1": base["Ionian #6 b3"].relativeMode(3),
  "Lydian #3 b7": base["Ionian #6 b3"].relativeMode(4),
  "Mixolydian #2 b6": base["Ionian #6 b3"].relativeMode(5),
  "Aeolian #1 b5": base["Ionian #6 b3"].relativeMode(6),
  "Locrian #7 b4": base["Ionian #6 b3"].relativeMode(7),

  "Dorian b2 b3": base["Dorian b2 b3"].relativeMode(1),
  "Phrygian b1 b2": base["Dorian b2 b3"].relativeMode(2),
  "Lydian b7 b1": base["Dorian b2 b3"].relativeMode(3),
  "Mixolydian b6 b7": base["Dorian b2 b3"].relativeMode(4),
  "Aeolian b5 b6": base["Dorian b2 b3"].relativeMode(5),
  "Locrian b4 b5": base["Dorian b2 b3"].relativeMode(6),
  "Ionian b3 b4": base["Dorian b2 b3"].relativeMode(7),

  "Lydian b7 b2 #3": base["Lydian b7 b2 #3"].relativeMode(1),
  "Mixolydian b6 b1 #2": base["Lydian b7 b2 #3"].relativeMode(2),
  "Aeolian b5 b7 #1": base["Lydian b7 b2 #3"].relativeMode(3),
  "Locrian b4 b6 #7": base["Lydian b7 b2 #3"].relativeMode(4),
  "Ionian b3 b5 #6": base["Lydian b7 b2 #3"].relativeMode(5),
  "Dorian b2 b4 #5": base["Lydian b7 b2 #3"].relativeMode(6),
  "Phrygian b1 b3 #4": base["Lydian b7 b2 #3"].relativeMode(7),

  "Lydian b7 b2 bb3": base["Lydian b7 b2 bb3"].relativeMode(1),
  "Mixolydian b6 b1 bb2": base["Lydian b7 b2 bb3"].relativeMode(2),
  "Aeolian b5 b7 bb1": base["Lydian b7 b2 bb3"].relativeMode(3),
  "Locrian b4 b6 bb7": base["Lydian b7 b2 bb3"].relativeMode(4),
  "Ionian b3 b5 bb6": base["Lydian b7 b2 bb3"].relativeMode(5),
  "Dorian b2 b4 bb5": base["Lydian b7 b2 bb3"].relativeMode(6),
  "Phrygian b1 b3 bb4": base["Lydian b7 b2 bb3"].relativeMode(7),

  "Ionian #2 b6 bb7": base["Ionian #2 b6 bb7"].relativeMode(1),
  "Dorian #1 b5 bb6": base["Ionian #2 b6 bb7"].relativeMode(2),
  "Phrygian #7 b4 bb5": base["Ionian #2 b6 bb7"].relativeMode(3),
  "Lydian #6 b3 bb4": base["Ionian #2 b6 bb7"].relativeMode(4),
  "Mixolydian #5 b2 bb3": base["Ionian #2 b6 bb7"].relativeMode(5),
  "Aeolian #4 b1 bb2": base["Ionian #2 b6 bb7"].relativeMode(6),
  "Locrian #3 b7 bb1": base["Ionian #2 b6 bb7"].relativeMode(7),

  ///
  // Still need these scale groups:
  //
  // 7-13

  "Ionian b2 #6": base["Ionian b2 #6"].relativeMode(1),
  "Dorian b1 #5": base["Ionian b2 #6"].relativeMode(2),
  "Phrygian b7 #4": base["Ionian b2 #6"].relativeMode(3),
  "Lydian b6 #3": base["Ionian b2 #6"].relativeMode(4),
  "Mixolydian b5 #2": base["Ionian b2 #6"].relativeMode(5),
  "Aeolian b4 #1": base["Ionian b2 #6"].relativeMode(6),
  "Locrian b3 #7": base["Ionian b2 #6"].relativeMode(7),

  "Aeolian #4 b7": base["Aeolian #4 b7"].relativeMode(1),
  "Locrian #3 b6": base["Aeolian #4 b7"].relativeMode(2),
  "Ionian #2 b5": base["Aeolian #4 b7"].relativeMode(3),
  "Dorian #1 b4": base["Aeolian #4 b7"].relativeMode(4),
  "Phrygian #7 b3": base["Aeolian #4 b7"].relativeMode(5),
  "Lydian #6 b2": base["Aeolian #4 b7"].relativeMode(6),
  "Mixolydian #5 b1": base["Aeolian #4 b7"].relativeMode(7),

  "Phrygian b7 b3 #4": base["Phrygian b7 b3 #4"].relativeMode(1),
  "Lydian b6 b2 #3": base["Phrygian b7 b3 #4"].relativeMode(2),
  "Mixolydian b5 b1 #2": base["Phrygian b7 b3 #4"].relativeMode(3),
  "Aeolian b4 b7 #1": base["Phrygian b7 b3 #4"].relativeMode(4),
  "Locrian b3 b6 #7": base["Phrygian b7 b3 #4"].relativeMode(5),
  "Ionian b2 b5 #6": base["Phrygian b7 b3 #4"].relativeMode(6),
  "Dorian b1 b4 #5": base["Phrygian b7 b3 #4"].relativeMode(7),

  "Phrygian b3 #4 #7": base["Phrygian b3 #4 #7"].relativeMode(1),
  "Lydian b2 #3 #6": base["Phrygian b3 #4 #7"].relativeMode(2),
  "Mixolydian b1 #2 #5": base["Phrygian b3 #4 #7"].relativeMode(3),
  "Aeolian b7 #1 #4": base["Phrygian b3 #4 #7"].relativeMode(4),
  "Locrian b6 #7 #3": base["Phrygian b3 #4 #7"].relativeMode(5),
  "Ionian b5 #6 #2": base["Phrygian b3 #4 #7"].relativeMode(6),
  "Dorian b4 #5 #1": base["Phrygian b3 #4 #7"].relativeMode(7),

  "Lydian b2 b3 #6": base["Lydian b2 b3 #6"].relativeMode(1),
  "Mixolydian b1 b2 #5": base["Lydian b2 b3 #6"].relativeMode(2),
  "Aeolian b7 b1 #4": base["Lydian b2 b3 #6"].relativeMode(3),
  "Locrian b6 b7 #3": base["Lydian b2 b3 #6"].relativeMode(4),
  "Ionian b5 b6 #2": base["Lydian b2 b3 #6"].relativeMode(5),
  "Dorian b4 b5 #1": base["Lydian b2 b3 #6"].relativeMode(6),
  "Phrygian b3 b4 #7": base["Lydian b2 b3 #6"].relativeMode(7),

  "Phrygian #3 #4 b7": base["Phrygian #3 #4 b7"].relativeMode(1),
  "Lydian #2 #3 b6": base["Phrygian #3 #4 b7"].relativeMode(2),
  "Mixolydian #1 #2 b5": base["Phrygian #3 #4 b7"].relativeMode(3),
  "Aeolian #7 #1 b4": base["Phrygian #3 #4 b7"].relativeMode(4),
  "Locrian #6 #7 b3": base["Phrygian #3 #4 b7"].relativeMode(5),
  "Ionian #5 #6 b2": base["Phrygian #3 #4 b7"].relativeMode(6),
  "Dorian #4 #5 b1": base["Phrygian #3 #4 b7"].relativeMode(7),

  ///
  // Still need these scale groups:
  //
  // 7-23

  "Ionian b2 b3 #6": base["Ionian b2 b3 #6"].relativeMode(1),
  "Dorian b1 b2 #5": base["Ionian b2 b3 #6"].relativeMode(2),
  "Phrygian b7 b1 #4": base["Ionian b2 b3 #6"].relativeMode(3),
  "Lydian b6 b7 #3": base["Ionian b2 b3 #6"].relativeMode(4),
  "Mixolydian b5 b6 #2": base["Ionian b2 b3 #6"].relativeMode(5),
  "Aeolian b4 b5 #1": base["Ionian b2 b3 #6"].relativeMode(6),
  "Locrian b3 b4 #7": base["Ionian b2 b3 #6"].relativeMode(7),

  "Ionian b2 bb3": base["Ionian b2 bb3"].relativeMode(1),
  "Dorian b1 bb2": base["Ionian b2 bb3"].relativeMode(2),
  "Phrygian b7 bb1": base["Ionian b2 bb3"].relativeMode(3),
  "Lydian b6 bb7": base["Ionian b2 bb3"].relativeMode(4),
  "Mixolydian b5 bb6": base["Ionian b2 bb3"].relativeMode(5),
  "Aeolian b4 bb5": base["Ionian b2 bb3"].relativeMode(6),
  "Locrian b3 bb4": base["Ionian b2 bb3"].relativeMode(7),

  "Ionian ##5 #6": base["Ionian ##5 #6"].relativeMode(1),
  "Dorian ##4 #5": base["Ionian ##5 #6"].relativeMode(2),
  "Phrygian ##3 #4": base["Ionian ##5 #6"].relativeMode(3),
  "Lydian ##2 #3": base["Ionian ##5 #6"].relativeMode(4),
  "Mixolydian ##1 #2": base["Ionian ##5 #6"].relativeMode(5),
  "Aeolian ##7 #1": base["Ionian ##5 #6"].relativeMode(6),
  "Locrian ##6 #7": base["Ionian ##5 #6"].relativeMode(7),

  "Ionian b2 bb3 #4": base["Ionian b2 bb3 #4"].relativeMode(1),
  "Dorian b1 bb2 #3": base["Ionian b2 bb3 #4"].relativeMode(2),
  "Phrygian b7 bb1 #2": base["Ionian b2 bb3 #4"].relativeMode(3),
  "Lydian b6 bb7 #1": base["Ionian b2 bb3 #4"].relativeMode(4),
  "Mixolydian b5 bb6 #7": base["Ionian b2 bb3 #4"].relativeMode(5),
  "Aeolian b4 bb5 #6": base["Ionian b2 bb3 #4"].relativeMode(6),
  "Locrian b3 bb4 #5": base["Ionian b2 bb3 #4"].relativeMode(7),

  ///
  // Still need these scale groups:
  //
  // 7-11

  "Ionian b2 b3 b4 #6": base["Ionian b2 b3 b4 #6"].relativeMode(1),
  "Dorian b1 b2 b3 #5": base["Ionian b2 b3 b4 #6"].relativeMode(2),
  "Phrygian b7 b1 b2 #4": base["Ionian b2 b3 b4 #6"].relativeMode(3),
  "Lydian b6 b7 b1 #3": base["Ionian b2 b3 b4 #6"].relativeMode(4),
  "Mixolydian b5 b6 b7 #2": base["Ionian b2 b3 b4 #6"].relativeMode(5),
  "Aeolian b4 b5 b6 #1": base["Ionian b2 b3 b4 #6"].relativeMode(6),
  "Locrian b3 b4 b5 #7": base["Ionian b2 b3 b4 #6"].relativeMode(7),

  "Ionian #2 #4 b6 bb7": base["Ionian #2 #4 b6 bb7"].relativeMode(1),
  "Dorian #1 #3 b5 bb6": base["Ionian #2 #4 b6 bb7"].relativeMode(2),
  "Phrygian #7 #2 b4 bb5": base["Ionian #2 #4 b6 bb7"].relativeMode(3),
  "Lydian #6 #1 b3 bb4": base["Ionian #2 #4 b6 bb7"].relativeMode(4),
  "Mixolydian #5 #7 b2 bb3": base["Ionian #2 #4 b6 bb7"].relativeMode(5),
  "Aeolian #4 #6 b1 bb2": base["Ionian #2 #4 b6 bb7"].relativeMode(6),
  "Locrian #3 #5 b7 bb1": base["Ionian #2 #4 b6 bb7"].relativeMode(7),

  ///
  // Still need these scale groups:
  //
  // 7-Z36

  "Ionian b2 bb3 #6": base["Ionian b2 bb3 #6"].relativeMode(1),
  "Dorian b1 bb2 #5": base["Ionian b2 bb3 #6"].relativeMode(2),
  "Phrygian b7 bb1 #4": base["Ionian b2 bb3 #6"].relativeMode(3),
  "Lydian b6 bb7 #3": base["Ionian b2 bb3 #6"].relativeMode(4),
  "Mixolydian b5 bb6 #2": base["Ionian b2 bb3 #6"].relativeMode(5),
  "Aeolian b4 bb5 #1": base["Ionian b2 bb3 #6"].relativeMode(6),
  "Locrian b3 bb4 #7": base["Ionian b2 bb3 #6"].relativeMode(7),

  "Phrygian ##3 #4 b7": base["Phrygian ##3 #4 b7"].relativeMode(1),
  "Lydian ##2 #3 b6": base["Phrygian ##3 #4 b7"].relativeMode(2),
  "Mixolydian ##1 #2 b5": base["Phrygian ##3 #4 b7"].relativeMode(3),
  "Aeolian ##7 #1 b4": base["Phrygian ##3 #4 b7"].relativeMode(4),
  "Locrian ##6 #7 b3": base["Phrygian ##3 #4 b7"].relativeMode(5),
  "Ionian ##5 #6 b2": base["Phrygian ##3 #4 b7"].relativeMode(6),
  "Dorian ##4 #5 b1": base["Phrygian ##3 #4 b7"].relativeMode(7),

  "Ionian b2 bb3 #4 #6": base["Ionian b2 bb3 #4 #6"].relativeMode(1),
  "Dorian b1 bb2 #3 #5": base["Ionian b2 bb3 #4 #6"].relativeMode(2),
  "Phrygian b7 bb1 #2 #4": base["Ionian b2 bb3 #4 #6"].relativeMode(3),
  "Lydian b6 bb7 #1 #3": base["Ionian b2 bb3 #4 #6"].relativeMode(4),
  "Mixolydian b5 bb6 #7 #2": base["Ionian b2 bb3 #4 #6"].relativeMode(5),
  "Aeolian b4 bb5 #6 #1": base["Ionian b2 bb3 #4 #6"].relativeMode(6),
  "Locrian b3 bb4 #5 #7": base["Ionian b2 bb3 #4 #6"].relativeMode(7),

  ///
  // Still need these scale groups:
  //
  // 7-8
  // 7-10
  // 7-9
  // 7-3
}

const modeAliases = {
  ...modes,

  ///
  // Aliases of Major relative modes

  Minor: modes.Aeolian,

  "Chinese Zè": modes.Ionian,
  "Thaat Bilawal": modes.Ionian,
  "Thang Phiang Aw Bon": modes.Ionian,
  "Mela Dheerasankarabharanam (29)": modes.Ionian,
  "Japanese Banshikicho": modes.Dorian,
  "Thaat Kafi": modes.Dorian,
  "Thang Nawk": modes.Dorian,
  "Mela Kharaharapriya (22)": modes.Dorian,
  "Major Inverse": modes.Phrygian,
  "Japanese Zokuso": modes.Phrygian,
  "Thaat Bhairavi": modes.Phrygian,
  "Thang Klang Haep": modes.Phrygian,
  "Mela Hanumatodi (8)": modes.Phrygian,
  "Japanese Kung": modes.Lydian,
  "Thaat Kalyan": modes.Lydian,
  "Thang Chawa": modes.Lydian,
  "Mela Mechakalyani (65)": modes.Lydian,
  "Chinese Ching": modes.Mixolydian,
  "Mugham Rast": modes.Mixolydian,
  "Thang Phiang Aw Lang": modes.Mixolydian,
  "Thaat Khamaj": modes.Mixolydian,
  "Mela Harikambhoji (28)": modes.Mixolydian,
  "Thaat Asavari": modes.Aeolian,
  "Thang Nai": modes.Aeolian,
  "Mugham Shur": modes.Aeolian,
  "Ethiopian Geez": modes.Aeolian,
  "Mela Natabhairavi (20)": modes.Aeolian,
  "Thang Luk": modes.Locrian,
  "Jewish Yishtabach": modes.Locrian,

  ///
  // Aliases of Jazz Minor relative modes

  "Ionian b3": modes["Dorian #7"],
  "Dorian b2": modes["Phrygian #6"],
  "Phrygian b1": modes["Lydian #5"],
  "Lydian b7": modes["Mixolydian #4"],
  "Mixolydian b6": modes["Aeolian #3"],
  "Aeolian b5": modes["Locrian #2"],
  "Locrian b4": modes["Ionian #1"],

  Bocrian: modes["Dorian #7"],
  Mixolythian: modes["Phrygian #6"],
  Larian: modes["Lydian #5"],
  Lythian: modes["Mixolydian #4"],
  Stydian: modes["Aeolian #3"],
  Lorian: modes["Locrian #2"],
  Ionadian: modes["Ionian #1"],

  "Melodic Minor": modes["Dorian #7"],
  "Minor-Major": modes["Dorian #7"],
  "Mela Gourimanohari (23)": modes["Dorian #7"],
  "Jazz Minor Inverse": modes["Phrygian #6"],
  "Phrygian-Mixolydian": modes["Phrygian #6"],
  "Javanese Pelog": modes["Phrygian #6"],
  "Mela Natakapriya (10)": modes["Phrygian #6"],
  "Lydian Augmented": modes["Lydian #5"],
  Acoustic: modes["Mixolydian #4"],
  Overtone: modes["Mixolydian #4"],
  "Overtone Dominant": modes["Mixolydian #4"],
  "Lydian Dominant": modes["Mixolydian #4"],
  "Lydian-Mixolydian": modes["Mixolydian #4"],
  "Mela Vachaspati (64)": modes["Mixolydian #4"],
  Bartók: modes["Mixolydian #4"],
  "Major-Minor": modes["Aeolian #3"],
  "Aeolian Dominant": modes["Aeolian #3"],
  "Altered Mixolydian": modes["Aeolian #3"],
  "Mugham Bayati Shiraz": modes["Aeolian #3"],
  "Mela Charukesi (26)": modes["Aeolian #3"],
  "Minor Locrian": modes["Locrian #2"],
  "Half Diminished": modes["Locrian #2"],
  "Super-Locrian": modes["Ionian #1"],
  "Diminished Whole-Tone": modes["Ionian #1"],
  Altered: modes["Ionian #1"],
  "Altered Dominant": modes["Ionian #1"],
  Pomeroy: modes["Ionian #1"],
  Ravel: modes["Ionian #1"],

  ///
  // Aliases of Harmonic Major relative modes

  Aerorian: modes["Ionian b6"],
  Katagian: modes["Dorian b5"],
  Phronian: modes["Phrygian b4"],
  Banian: modes["Lydian b3"],
  Aeronian: modes["Mixolydian b2"],
  Palian: modes["Aeolian b1"],
  Stothian: modes["Locrian b7"],

  "Greek Tabahaniotikos": modes["Ionian b6"],
  "Mugham Shahnaz": modes["Ionian b6"],
  "Mela Sarasangi (27)": modes["Ionian b6"],
  "Locrian #2 #6": modes["Dorian b5"],
  "Blues Heptatonic": modes["Dorian b5"],
  "Greek Kartzigár": modes["Dorian b5"],
  "Melodic Minor #4": modes["Lydian b3"],
  "Lydian Diminished": modes["Lydian b3"],
  "Mela Dharmavati (59)": modes["Lydian b3"],
  "Harmonic Minor Inverse": modes["Mixolydian b2"],
  "Mugham Humayun": modes["Mixolydian b2"],
  "Mela Chakravakam (16)": modes["Mixolydian b2"],
  "Lydian Augmented #2": modes["Aeolian b1"],
  "Diminished Blues b9": modes["Locrian b7"],

  ///
  // Aliases of Harmonic Minor relative modes

  Mydian: modes["Aeolian #7"],
  Thyptian: modes["Locrian #6"],
  Phrothian: modes["Ionian #5"],
  Katycrian: modes["Dorian #4"],
  Ionalian: modes["Phrygian #3"],
  Bycrian: modes["Lydian #2"],
  Pathian: modes["Mixolydian #1"],

  "Harmonic Minor": modes["Aeolian #7"],
  "Thaat Pilu": modes["Aeolian #7"],
  "Mela Keeravani (21)": modes["Aeolian #7"],
  "Major Augmented": modes["Ionian #5"],
  "Ionian Augmented": modes["Ionian #5"],
  "Greek Nikríz": modes["Dorian #4"],
  "Altered Dorian": modes["Dorian #4"],
  "Romanian Minor": modes["Dorian #4"],
  "Jewish Misheberekh": modes["Dorian #4"],
  "Mela Hemavati (58)": modes["Dorian #4"],
  "Phrygian Dominant": modes["Phrygian #3"],
  "Phrygian Major": modes["Phrygian #3"],
  "Harmonic Major Inverse": modes["Phrygian #3"],
  "Greek Hitzaz": modes["Phrygian #3"],
  Vativasantabhairavi: modes["Phrygian #3"],
  "Jewish Freygish": modes["Phrygian #3"],
  "Mela Vakulabharanam (14)": modes["Phrygian #3"],
  "Aeolian Harmonic": modes["Lydian #2"],
  "Mela Kosalam (71)": modes["Lydian #2"],
  "Ultra-Locrian": modes["Mixolydian #1"],
  "Super-Locrian Diminished": modes["Mixolydian #1"],
  "Super-Locrian Double-Flat": modes["Mixolydian #1"],
  "Diminished Locrian": modes["Mixolydian #1"],

  ///
  // Aliases of Double Harmonic Major relative modes

  Aerynian: modes["Phrygian #3 #7"],
  Loptian: modes["Lydian #2 #6"],
  Ionodian: modes["Mixolydian #1 #5"],
  Bogian: modes["Aeolian #7 #4"],
  Mogian: modes["Locrian #6 #3"],
  Docrian: modes["Ionian #5 #2"],
  Epadian: modes["Dorian #4 #1"],

  "Greek Hitzazkiar": modes["Phrygian #3 #7"],
  "Thaat Bhairav": modes["Phrygian #3 #7"],
  "Mela Mayamalavagaula (15)": modes["Phrygian #3 #7"],
  "Mela Rasikapriya (72)": modes["Lydian #2 #6"],
  "Ultra-Phrygian": modes["Mixolydian #1 #5"],
  "Double Harmonic Minor": modes["Aeolian #7 #4"],
  "Hungarian Minor": modes["Aeolian #7 #4"],
  "Greek Niavent": modes["Aeolian #7 #4"],
  Hisar: modes["Aeolian #7 #4"],
  "Mela Simhendramadhyamam (57)": modes["Aeolian #7 #4"],
  "Hungarian Minor Inverse": modes["Locrian #6 #3"],
  "Greek Tsinganikos": modes["Locrian #6 #3"],
  "Mugham Caharkah 1": modes["Locrian #6 #3"],
  "Ionian Augmented #2": modes["Ionian #5 #2"],
  "Locrian Double-Flat 3": modes["Dorian #4 #1"],
  "Double-Flat 7": modes["Dorian #4 #1"],

  ///
  // Aliases of Neapolitan Minor relative modes

  Aerylian: modes["Phrygian #7"],
  Zagian: modes["Lydian #6"],
  Lagian: modes["Mixolydian #5"],
  Tyrian: modes["Aeolian #4"],
  Mixonorian: modes["Locrian #3"],
  Dolian: modes["Ionian #2"],
  Porian: modes["Dorian #1"],

  "Mela Dhenuka (9)": modes["Phrygian #7"],
  "Mela Chitrambari (66)": modes["Lydian #6"],
  "Mixolydian Augmented": modes["Mixolydian #5"],
  "Mela Shanmukhapriya (56)": modes["Aeolian #4"],
  "Locrian Dominant": modes["Locrian #3"],
  "Mela Sulini (35)": modes["Ionian #2"],

  ///
  // Aliases of Neapolitan Major relative modes

  Thydian: modes["Dorian #7 b2"],
  Aeolynian: modes["Phrygian #6 b1"],
  Aeroptian: modes["Lydian #5 b7"],
  Phryrian: modes["Mixolydian #4 b6"],
  Gothian: modes["Aeolian #3 b5"],
  Storian: modes["Locrian #2 b4"],
  Pyptian: modes["Ionian #1 b3"],

  "Lydian Major": modes["Dorian #7 b2"],
  "Mela Kokilapriya (11)": modes["Dorian #7 b2"],
  "Leading Whole-Tone": modes["Phrygian #6 b1"],
  "Lydian Minor": modes["Mixolydian #4 b6"],
  "Mela Rishabhapriya (62)": modes["Mixolydian #4 b6"],
  "Locrian Major": modes["Aeolian #3 b5"],
  "Leading Whole-Tone Inverse": modes["Ionian #1 b3"],

  ///
  // Aliases of Hungarian Major relative modes

  Mycrian: modes["Mixolydian #4 #2"],
  Ionorian: modes["Aeolian #3 #1"],
  Phrydian: modes["Locrian #2 #7"],
  Zyptian: modes["Ionian #1 #6"],
  Katothian: modes["Dorian #7 #5"],
  Phrylian: modes["Phrygian #6 #4"],
  Kocrian: modes["Lydian #5 #3"],

  "Mela Nasikabhushani (70)": modes["Mixolydian #4 #2"],
  "Alternating Heptamode": modes["Aeolian #3 #1"],
  "Harmonic Minor b5": modes["Locrian #2 #7"],
  "Mela Shadvidamargini (46)": modes["Phrygian #6 #4"],
  "Japanese Nokhan Flute Scale": modes["Lydian #5 #3"],

  ///
  // Aliases of Romanian Major relative modes

  Epalian: modes["Lydian b7 b2"],
  Pogian: modes["Mixolydian b6 b1"],
  Aeraptian: modes["Aeolian b5 b7"],
  Epylian: modes["Locrian b4 b6"],
  Gamian: modes["Ionian b3 b5"],
  Kathian: modes["Dorian b2 b4"],
  Lylian: modes["Phrygian b1 b3"],

  Petrushka: modes["Lydian b7 b2"],
  "Mela Ramapriya (52)": modes["Lydian b7 b2"],
  "Moravian Pistalkova": modes["Aeolian b5 b7"],
  "Hungarian Major Inverse": modes["Aeolian b5 b7"],
  "Jeth's Mode": modes["Ionian b3 b5"],

  ///
  // Aliases of Harmonic Lydian relative modes

  Ryphian: modes["Lydian b6"],
  Gylian: modes["Mixolydian b5"],
  Aeloycrian: modes["Aeolian b4"],
  Pynian: modes["Locrian b3"],
  Zanian: modes["Ionian b2"],
  Golian: modes["Dorian b1"],
  Dyptian: modes["Phrygian b7"],

  "Mela Latangi (63)": modes["Lydian b6"],
  "Greek Sabach": modes["Aeolian b4"],
  "Mugham Caharkah 2": modes["Ionian b2"],
  "Thaat Bhairubahar": modes["Ionian b2"],
  "Mela Suryakantam (17)": modes["Ionian b2"],
  "Major-Melodic Phrygian": modes["Ionian b2"],
  "Mela Senavati (7)": modes["Phrygian b7"],

  ///
  // Aliases of Mixolydian #2 relative modes

  Ionycrian: modes["Mixolydian #2"],
  Phradian: modes["Aeolian #1"],
  Aeolorian: modes["Locrian #7"],
  Gonian: modes["Ionian #6"],
  Dalian: modes["Dorian #5"],
  Dygian: modes["Phrygian #4"],
  Zolian: modes["Lydian #3"],

  "Mela Vagadheeswari (34)": modes["Mixolydian #2"],
  "Mela Naganandini (30)": modes["Ionian #6"],
  "Mela Bhavapriya (44)": modes["Phrygian #4"],

  ///
  // Aliases of Lydian b2 relative modes

  Garian: modes["Lydian b2"],
  Thonian: modes["Mixolydian b1"],
  Phrorian: modes["Aeolian b7"],
  Stadian: modes["Locrian b6"],
  Thodian: modes["Ionian b5"],
  Dogian: modes["Dorian b4"],
  Mixopyrian: modes["Phrygian b3"],

  "Thaat Marva": modes["Lydian b2"],
  "Greek Houzám Minór": modes["Lydian b2"],
  "Mela Gamanashrama (53)": modes["Lydian b2"],
  "Mela Jhankaradhvani (19)": modes["Aeolian b7"],
  "Mela Ratnangi (2)": modes["Phrygian b3"],

  ///
  // Aliases of Lydian b2 b6 relative modes

  Stylian: modes["Lydian b2 b6"],
  Epathian: modes["Mixolydian b1 b5"],
  Mythian: modes["Aeolian b7 b4"],
  Sogian: modes["Locrian b6 b3"],
  Gogian: modes["Ionian b5 b2"],
  Rothian: modes["Dorian b4 b1"],
  Katarian: modes["Phrygian b3 b7"],

  "Chromatic Hypolydian": modes["Lydian b2 b6"],
  "Greek Pireotikos": modes["Lydian b2 b6"],
  "Thaat Purvi": modes["Lydian b2 b6"],
  "Mela Kamavardhani (51)": modes["Lydian b2 b6"],
  "Chromatic Hypophrygian": modes["Mixolydian b1 b5"],
  "Blues Scale III": modes["Mixolydian b1 b5"],
  "Chromatic Hypodorian": modes["Aeolian b7 b4"],
  "Relative Blues Scale": modes["Aeolian b7 b4"],
  "Chromatic Mixolydian": modes["Locrian b6 b3"],
  "Chromatic Lydian": modes["Ionian b5 b2"],
  "Chromatic Phrygian": modes["Dorian b4 b1"],
  "Chromatic Dorian": modes["Phrygian b3 b7"],
  "Mela Kanakangi (1)": modes["Phrygian b3 b7"],

  ///
  // Aliases of Ionian #2 #6 relative modes

  Ionacrian: modes["Ionian #2 #6"],
  Gathian: modes["Dorian #1 #5"],
  Ionyphian: modes["Phrygian #7 #4"],
  Phrynian: modes["Lydian #6 #3"],
  Epogian: modes["Mixolydian #5 #2"],
  Lanian: modes["Aeolian #4 #1"],
  Paptian: modes["Locrian #3 #7"],

  "Chromatic Dorian Inverse": modes["Ionian #2 #6"],
  "Japanese Youlan": modes["Ionian #2 #6"],
  "Mela Chalanata (36)": modes["Ionian #2 #6"],
  "Chromatic Phrygian Inverse": modes["Dorian #1 #5"],
  "Chromatic Lydian Inverse": modes["Phrygian #7 #4"],
  "Harsh Minor": modes["Phrygian #7 #4"],
  "Thaat Todi": modes["Phrygian #7 #4"],
  "Mela Shubhapantuvarali (45)": modes["Phrygian #7 #4"],
  "Chromatic Mixolydian Inverse": modes["Lydian #6 #3"],
  "Chromatic Hypodorian Inverse": modes["Mixolydian #5 #2"],
  "Chromatic Hypophrygian Inverse": modes["Aeolian #4 #1"],
  "Chromatic Hypolydian Inverse": modes["Locrian #3 #7"],

  ///
  // Aliases of Lydian b2 b3 relative modes

  Manian: modes["Lydian b2 b3"],
  Marian: modes["Mixolydian b1 b2"],
  Korian: modes["Aeolian b7 b1"],
  Lynian: modes["Locrian b6 b7"],
  Malian: modes["Ionian b5 b6"],
  Synian: modes["Dorian b4 b5"],
  Phragian: modes["Phrygian b3 b4"],

  "Mela Suvarnangi (47)": modes["Lydian b2 b3"],

  ///
  // Relative modes of Phrygian #3 #4

  Rynian: modes["Phrygian #3 #4"],
  Eporian: modes["Lydian #2 #3"],
  Rylian: modes["Mixolydian #1 #2"],
  Epaptian: modes["Aeolian #7 #1"],
  Byrian: modes["Locrian #6 #7"],
  Katanian: modes["Ionian #5 #6"],
  Katyrian: modes["Dorian #4 #5"],

  "Harsh Major-Minor": modes["Phrygian #3 #4"],
  "Mela Namanarayani (50)": modes["Phrygian #3 #4"],

  ///
  // Relative modes of Phrygian b3 #4

  Aeolagian: modes["Phrygian b3 #4"],
  Zyrian: modes["Lydian b2 #3"],
  Thacrian: modes["Mixolydian b1 #2"],
  Dodian: modes["Aeolian b7 #1"],
  Aeolyptian: modes["Locrian b6 #7"],
  Aeolonian: modes["Ionian b5 #6"],
  Aeradian: modes["Dorian b4 #5"],

  "Mela Jalarnavam (38)": modes["Phrygian b3 #4"],

  ///
  // Relative modes of Lydian #2 b6 b7

  Ionanian: modes["Lydian #2 b6 b7"],
  Aerothian: modes["Mixolydian #1 b5 b6"],
  Stagian: modes["Aeolian #7 b4 b5"],
  Lothian: modes["Locrian #6 b3 b4"],
  Phrycrian: modes["Ionian #5 b2 b3"],
  Kyptian: modes["Dorian #4 b1 b2"],
  Ionylian: modes["Phrygian #3 b7 b1"],

  "Mela Jyoti Swarupini (68)": modes["Lydian #2 b6 b7"],

  ///
  // Relative modes of Ionian b2 b3 b4

  Kynian: modes["Ionian b2 b3 b4"],
  Stynian: modes["Dorian b1 b2 b3"],
  Epyphian: modes["Phrygian b7 b1 b2"],
  Epacrian: modes["Lydian b6 b7 b1"],
  Sathian: modes["Mixolydian b5 b6 b7"],
  Lathian: modes["Aeolian b4 b5 b6"],
  Aeralian: modes["Locrian b3 b4 b5"],

  "Persichetti Scale": modes["Phrygian b7 b1 b2"],
  "Elephant Scale": modes["Locrian b3 b4 b5"],

  ///
  // Relative modes of Ionian #2 b6

  Syrian: modes["Ionian #2 b6"],
  Stodian: modes["Dorian #1 b5"],
  Ionocrian: modes["Phrygian #7 b4"],
  Zycrian: modes["Lydian #6 b3"],
  Ionygian: modes["Mixolydian #5 b2"],
  Tholian: modes["Aeolian #4 b1"],
  Ralian: modes["Locrian #3 b7"],

  "Mela Gangeyabhushani (33)": modes["Ionian #2 b6"],
  "Greek Sengiach": modes["Ionian #2 b6"],
  "Mela Neetimati (60)": modes["Lydian #6 b3"],

  ///
  // Relative modes of Lydian #2 b6

  Barian: modes["Lydian #2 b6"],
  Mixolocrian: modes["Mixolydian #1 b5"],
  Sagian: modes["Aeolian #7 b4"],
  Aeolothian: modes["Locrian #6 b3"],
  Socrian: modes["Ionian #5 b2"],
  Katathian: modes["Dorian #4 b1"],
  Modian: modes["Phrygian #3 b7"],

  "Mela Dhatuvardhani (69)": modes["Lydian #2 b6"],
  "Major Romani": modes["Ionian #5 b2"],
  "Heptatonic Romani": modes["Phrygian #3 b7"],
  "Mela Gayakapriya (13)": modes["Phrygian #3 b7"],

  ///
  // Relative modes of Ionian #6 b3

  Aeracrian: modes["Ionian #6 b3"],
  Byptian: modes["Dorian #5 b2"],
  Darian: modes["Phrygian #4 b1"],
  Lonian: modes["Lydian #3 b7"],
  Aerathian: modes["Mixolydian #2 b6"],
  Sarian: modes["Aeolian #1 b5"],
  Zoptian: modes["Locrian #7 b4"],

  "Mela Varunapriya (24)": modes["Ionian #6 b3"],
  "Mela Ragavardhini (32)": modes["Mixolydian #2 b6"],

  ///
  // Relative modes of Dorian b2 b3

  Zaptian: modes["Dorian b2 b3"],
  Kagian: modes["Phrygian b1 b2"],
  Phrolian: modes["Lydian b7 b1"],
  Ionagian: modes["Mixolydian b6 b7"],
  Aeodian: modes["Aeolian b5 b6"],
  Kycrian: modes["Locrian b4 b5"],
  Epygian: modes["Ionian b3 b4"],

  "Mela Vanaspati (4)": modes["Dorian b2 b3"],
  "Major Bebop Heptatonic": modes["Mixolydian b6 b7"],
  "Mela Mararanjani (25)": modes["Mixolydian b6 b7"],
  "Modified Blues": modes["Aeolian b5 b6"],

  ///
  // Relative modes of Lydian b7 b2 #3

  Katalian: modes["Lydian b7 b2 #3"],
  Aeolathian: modes["Mixolydian b6 b1 #2"],
  Bythian: modes["Aeolian b5 b7 #1"],
  Padian: modes["Locrian b4 b6 #7"],
  Rolian: modes["Ionian b3 b5 #6"],
  Pydian: modes["Dorian b2 b4 #5"],
  Thygian: modes["Phrygian b1 b3 #4"],

  ///
  // Relative modes of Lydian b7 b2 bb3

  Dagian: modes["Lydian b7 b2 bb3"],
  Aolydian: modes["Mixolydian b6 b1 bb2"],
  Stygian: modes["Aeolian b5 b7 bb1"],
  Aeolygian: modes["Locrian b4 b6 bb7"],
  Aerogian: modes["Ionian b3 b5 bb6"],
  Dacrian: modes["Dorian b2 b4 bb5"],
  Baptian: modes["Phrygian b1 b3 bb4"],

  "Mela Navaneetam (40)": modes["Lydian b7 b2 bb3"],

  ///
  // Relative modes of Ionian #2 b6 bb7

  Stoptian: modes["Ionian #2 b6 bb7"],
  Zygian: modes["Dorian #1 b5 bb6"],
  Kataptian: modes["Phrygian #7 b4 bb5"],
  Aeolaptian: modes["Lydian #6 b3 bb4"],
  Pothian: modes["Mixolydian #5 b2 bb3"],
  Bygian: modes["Aeolian #4 b1 bb2"],
  Stalian: modes["Locrian #3 b7 bb1"],

  "Mela Yagapriya (31)": modes["Ionian #2 b6 bb7"],

  ///
  // Relative modes of Ionian b2 #6

  Zodian: modes["Ionian b2 #6"],
  Ranian: modes["Dorian b1 #5"],
  Ladian: modes["Phrygian b7 #4"],
  Podian: modes["Lydian b6 #3"],
  Ionothian: modes["Mixolydian b5 #2"],
  Kanian: modes["Aeolian b4 #1"],
  Zylian: modes["Locrian b3 #7"],

  "Mela Hatakambari (18)": modes["Ionian b2 #6"],
  "Mela Gavambhodi (43)": modes["Phrygian b7 #4"],

  ///
  // Relative modes of Aeolian #4 b7

  Phryptian: modes["Aeolian #4 b7"],
  Katynian: modes["Locrian #3 b6"],
  Aerycrian: modes["Ionian #2 b5"],
  Ganian: modes["Dorian #1 b4"],
  Eparian: modes["Phrygian #7 b3"],
  Lyrian: modes["Lydian #6 b2"],
  Katocrian: modes["Mixolydian #5 b1"],

  "Mela Shamalangi (55)": modes["Aeolian #4 b7"],
  "Mela Ganamurti (3)": modes["Phrygian #7 b3"],
  "Mela Vishwambari (54)": modes["Lydian #6 b2"],

  ///
  // Relative modes of Phrygian b7 b3 #4

  Aeolanian: modes["Phrygian b7 b3 #4"],
  Danian: modes["Lydian b6 b2 #3"],
  Aeolacrian: modes["Mixolydian b5 b1 #2"],
  Zythian: modes["Aeolian b4 b7 #1"],
  Dyrian: modes["Locrian b3 b6 #7"],
  Koptian: modes["Ionian b2 b5 #6"],
  Thocrian: modes["Dorian b1 b4 #5"],

  "Mela Salagam (37)": modes["Phrygian b7 b3 #4"],

  ///
  // Relative modes of Phrygian b3 #4 #7

  Stonian: modes["Phrygian b3 #4 #7"],
  Syptian: modes["Lydian b2 #3 #6"],
  Ionarian: modes["Mixolydian b1 #2 #5"],
  Dynian: modes["Aeolian b7 #1 #4"],
  Zydian: modes["Locrian b6 #7 #3"],
  Zathian: modes["Ionian b5 #6 #2"],
  Radian: modes["Dorian b4 #5 #1"],

  "Mela Jhalavarali (39)": modes["Phrygian b3 #4 #7"],

  ///
  // Relative modes of Lydian b2 b3 #6

  Katadian: modes["Lydian b2 b3 #6"],
  Kodian: modes["Mixolydian b1 b2 #5"],
  Zarian: modes["Aeolian b7 b1 #4"],
  Phrythian: modes["Locrian b6 b7 #3"],
  Rorian: modes["Ionian b5 b6 #2"],
  Bolian: modes["Dorian b4 b5 #1"],
  Bothian: modes["Phrygian b3 b4 #7"],

  "Mela Divyamani (48)": modes["Lydian b2 b3 #6"],

  ///
  // Relative modes of Phrygian #3 #4 b7

  Thogian: modes["Phrygian #3 #4 b7"],
  Laptian: modes["Lydian #2 #3 b6"],
  Lygian: modes["Mixolydian #1 #2 b5"],
  Logian: modes["Aeolian #7 #1 b4"],
  Lalian: modes["Locrian #6 #7 b3"],
  Sothian: modes["Ionian #5 #6 b2"],
  Phrocrian: modes["Dorian #4 #5 b1"],

  "Mela Dhavalambari (49)": modes["Phrygian #3 #4 b7"],
  "Foulds' Mantra Of Will Scale": modes["Phrygian #3 #4 b7"],
  "Verdi's Enigmatic Descending": modes["Ionian #5 #6 b2"],

  ///
  // Relative modes of Ionian b2 b3 #6

  Staptian: modes["Ionian b2 b3 #6"],
  Mothian: modes["Dorian b1 b2 #5"],
  Aeranian: modes["Phrygian b7 b1 #4"],
  Ragian: modes["Lydian b6 b7 #3"],
  Pagian: modes["Mixolydian b5 b6 #2"],
  Aeolythian: modes["Aeolian b4 b5 #1"],
  Molian: modes["Locrian b3 b4 #7"],

  "Mela Rupavati (12)": modes["Ionian b2 b3 #6"],

  ///
  // Relative modes of Ionian b2 bb3

  Pylian: modes["Ionian b2 bb3"],
  Ionathian: modes["Dorian b1 bb2"],
  Phraptian: modes["Phrygian b7 bb1"],
  Bacrian: modes["Lydian b6 bb7"],
  Katythian: modes["Mixolydian b5 bb6"],
  Madian: modes["Aeolian b4 bb5"],
  Aerygian: modes["Locrian b3 bb4"],

  "Mela Manavati (5)": modes["Ionian b2 bb3"],
  "Verdi's Enigmatic Ascending": modes["Dorian b1 bb2"],
  "Mela Kantamani (61)": modes["Lydian b6 bb7"],

  ///
  // Relative modes of Ionian ##5 #6

  Kygian: modes["Ionian ##5 #6"],
  Mocrian: modes["Dorian ##4 #5"],
  Zynian: modes["Phrygian ##3 #4"],
  Zogian: modes["Lydian ##2 #3"],
  Epyrian: modes["Mixolydian ##1 #2"],
  Lycrian: modes["Aeolian ##7 #1"],
  Daptian: modes["Locrian ##6 #7"],

  ///
  // Relative modes of Ionian b2 bb3 #4

  Aeraphian: modes["Ionian b2 bb3 #4"],
  Zacrian: modes["Dorian b1 bb2 #3"],
  Ionythian: modes["Phrygian b7 bb1 #2"],
  Aeolyrian: modes["Lydian b6 bb7 #1"],
  Gorian: modes["Mixolydian b5 bb6 #7"],
  Aeolodian: modes["Aeolian b4 bb5 #6"],
  Doptian: modes["Locrian b3 bb4 #5"],

  "Mela Pavani (41)": modes["Ionian b2 bb3 #4"],

  ///
  // Relative modes of Ionian b2 b3 b4 #6

  Aeolocrian: modes["Ionian b2 b3 b4 #6"],
  Mixodorian: modes["Dorian b1 b2 b3 #5"],
  Dathian: modes["Phrygian b7 b1 b2 #4"],
  Gacrian: modes["Lydian b6 b7 b1 #3"],
  Borian: modes["Mixolydian b5 b6 b7 #2"],
  Sycrian: modes["Aeolian b4 b5 b6 #1"],
  Gadian: modes["Locrian b3 b4 b5 #7"],

  ///
  // Relative modes of Ionian #2 #4 b6 bb7

  Raptian: modes["Ionian #2 #4 b6 bb7"],
  Epolian: modes["Dorian #1 #3 b5 bb6"],
  Sythian: modes["Phrygian #7 #2 b4 bb5"],
  Sydian: modes["Lydian #6 #1 b3 bb4"],
  Epocrian: modes["Mixolydian #5 #7 b2 bb3"],
  Kylian: modes["Aeolian #4 #6 b1 bb2"],
  Epagian: modes["Locrian #3 #5 b7 bb1"],

  "Mela Sucharitra (67)": modes["Ionian #2 #4 b6 bb7"],

  ///
  // Relative modes of Ionian b2 bb3 #6

  Epythian: modes["Ionian b2 bb3 #6"],
  Kaptian: modes["Dorian b1 bb2 #5"],
  Morian: modes["Phrygian b7 bb1 #2"],
  Rycrian: modes["Lydian b6 bb7 #3"],
  Ronian: modes["Mixolydian b5 bb6 #2"],
  Stycrian: modes["Aeolian b4 bb5 #1"],
  Katorian: modes["Locrian b3 bb4 #7"],

  "Mela Tanarupi (6)": modes["Ionian b2 bb3 #6"],
  "Heptatonic Blues": modes["Mixolydian b5 bb6 #2"],

  ///
  // Relative modes of Phrygian ##3 #4 b7

  Phrathian: modes["Phrygian ##3 #4 b7"],
  Thycrian: modes["Lydian ##2 #3 b6"],
  Aeoladian: modes["Mixolydian ##1 #2 b5"],
  Dylian: modes["Aeolian ##7 #1 b4"],
  Eponian: modes["Locrian ##6 #7 b3"],
  Katygian: modes["Ionian ##5 #6 b2"],
  Starian: modes["Dorian ##4 #5 b1"],

  ///
  // Relative modes of Ionian b2 bb3 #4 #6

  Kolian: modes["Ionian b2 bb3 #4 #6"],
  Dycrian: modes["Dorian b1 bb2 #3 #5"],
  Parian: modes["Phrygian b7 bb1 #2 #4"],
  Ionaptian: modes["Lydian b6 bb7 #1 #3"],
  Thylian: modes["Mixolydian b5 bb6 #7 #2"],
  Lolian: modes["Aeolian b4 bb5 #6 #1"],
  Thagian: modes["Locrian b3 bb4 #5 #7"],

  "Mela Raghupriya (42)": modes["Ionian b2 bb3 #4 #6"],
}

const anyMode = { ...modes, ...modeAliases }

const melakartasByNumber = [
  modeAliases["Mela Kanakangi (1)"],
  modeAliases["Mela Ratnangi (2)"],
  modeAliases["Mela Ganamurti (3)"],
  modeAliases["Mela Vanaspati (4)"],
  modeAliases["Mela Manavati (5)"],
  modeAliases["Mela Tanarupi (6)"],
  modeAliases["Mela Senavati (7)"],
  modeAliases["Mela Hanumatodi (8)"],
  modeAliases["Mela Dhenuka (9)"],
  modeAliases["Mela Natakapriya (10)"],
  modeAliases["Mela Kokilapriya (11)"],
  modeAliases["Mela Rupavati (12)"],
  modeAliases["Mela Gayakapriya (13)"],
  modeAliases["Mela Vakulabharanam (14)"],
  modeAliases["Mela Mayamalavagaula (15)"],
  modeAliases["Mela Chakravakam (16)"],
  modeAliases["Mela Suryakantam (17)"],
  modeAliases["Mela Hatakambari (18)"],
  modeAliases["Mela Jhankaradhvani (19)"],
  modeAliases["Mela Natabhairavi (20)"],
  modeAliases["Mela Keeravani (21)"],
  modeAliases["Mela Kharaharapriya (22)"],
  modeAliases["Mela Gourimanohari (23)"],
  modeAliases["Mela Varunapriya (24)"],
  modeAliases["Mela Mararanjani (25)"],
  modeAliases["Mela Charukesi (26)"],
  modeAliases["Mela Sarasangi (27)"],
  modeAliases["Mela Harikambhoji (28)"],
  modeAliases["Mela Dheerasankarabharanam (29)"],
  modeAliases["Mela Naganandini (30)"],
  modeAliases["Mela Yagapriya (31)"],
  modeAliases["Mela Ragavardhini (32)"],
  modeAliases["Mela Gangeyabhushani (33)"],
  modeAliases["Mela Vagadheeswari (34)"],
  modeAliases["Mela Sulini (35)"],
  modeAliases["Mela Chalanata (36)"],
  modeAliases["Mela Salagam (37)"],
  modeAliases["Mela Jalarnavam (38)"],
  modeAliases["Mela Jhalavarali (39)"],
  modeAliases["Mela Navaneetam (40)"],
  modeAliases["Mela Pavani (41)"],
  modeAliases["Mela Raghupriya (42)"],
  modeAliases["Mela Gavambhodi (43)"],
  modeAliases["Mela Bhavapriya (44)"],
  modeAliases["Mela Shubhapantuvarali (45)"],
  modeAliases["Mela Shadvidamargini (46)"],
  modeAliases["Mela Suvarnangi (47)"],
  modeAliases["Mela Divyamani (48)"],
  modeAliases["Mela Dhavalambari (49)"],
  modeAliases["Mela Namanarayani (50)"],
  modeAliases["Mela Kamavardhani (51)"],
  modeAliases["Mela Ramapriya (52)"],
  modeAliases["Mela Gamanashrama (53)"],
  modeAliases["Mela Vishwambari (54)"],
  modeAliases["Mela Shamalangi (55)"],
  modeAliases["Mela Shanmukhapriya (56)"],
  modeAliases["Mela Simhendramadhyamam (57)"],
  modeAliases["Mela Hemavati (58)"],
  modeAliases["Mela Dharmavati (59)"],
  modeAliases["Mela Neetimati (60)"],
  modeAliases["Mela Kantamani (61)"],
  modeAliases["Mela Rishabhapriya (62)"],
  modeAliases["Mela Latangi (63)"],
  modeAliases["Mela Vachaspati (64)"],
  modeAliases["Mela Mechakalyani (65)"],
  modeAliases["Mela Chitrambari (66)"],
  modeAliases["Mela Sucharitra (67)"],
  modeAliases["Mela Jyoti Swarupini (68)"],
  modeAliases["Mela Dhatuvardhani (69)"],
  modeAliases["Mela Nasikabhushani (70)"],
  modeAliases["Mela Kosalam (71)"],
  modeAliases["Mela Rasikapriya (72)"],
]
