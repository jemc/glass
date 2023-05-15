import type { VoiceNote } from "./Voice"

export interface Riff {
  bpm: number
  key: RiffKey
  div: string
  seq: string
  oct?: string
  vol?: string
  gls?: string
}

export type RiffKey =
  | "Ab-minor"
  | "A-minor"
  | "A#-minor"
  | "Bb-minor"
  | "B-minor"
  | "C-minor"
  | "C#-minor"
  | "Db-minor"
  | "D-minor"
  | "D#-minor"
  | "Eb-minor"
  | "E-minor"
  | "F-minor"
  | "F#-minor"
  | "Gb-minor"
  | "G-minor"
  | "G#-minor"
  | "Ab-major"
  | "A-major"
  | "A#-major"
  | "Bb-major"
  | "B-major"
  | "C-major"
  | "C#-major"
  | "Db-major"
  | "D-major"
  | "D#-major"
  | "Eb-major"
  | "E-major"
  | "F-major"
  | "F#-major"
  | "Gb-major"
  | "G-major"
  | "G#-major"

const SCALE_CODE_0$ = "o".charCodeAt(0)
const SCALE_CODE_0 = "0".charCodeAt(0)
const SCALE_CODE_1$ = "p".charCodeAt(0)
const SCALE_CODE_1 = "1".charCodeAt(0)
const SCALE_CODE_2$ = "q".charCodeAt(0)
const SCALE_CODE_2 = "2".charCodeAt(0)
const SCALE_CODE_3$ = "w".charCodeAt(0)
const SCALE_CODE_3 = "3".charCodeAt(0)
const SCALE_CODE_4$ = "e".charCodeAt(0)
const SCALE_CODE_4 = "4".charCodeAt(0)
const SCALE_CODE_5$ = "r".charCodeAt(0)
const SCALE_CODE_5 = "5".charCodeAt(0)
const SCALE_CODE_6$ = "t".charCodeAt(0)
const SCALE_CODE_6 = "6".charCodeAt(0)
const SCALE_CODE_7$ = "y".charCodeAt(0)
const SCALE_CODE_7 = "7".charCodeAt(0)
const SCALE_CODE_8$ = "u".charCodeAt(0)
const SCALE_CODE_8 = "8".charCodeAt(0)
const SCALE_CODE_9$ = "i".charCodeAt(0)
const SCALE_CODE_9 = "9".charCodeAt(0)

const SEQ_CODE_SUSTAIN = "-".charCodeAt(0)
const SEQ_CODE_SILENCE = " ".charCodeAt(0)

const OCT_CODE_0 = "0".charCodeAt(0)
const OCT_CODE_9 = "9".charCodeAt(0)
const OCT_CODE_10 = "@".charCodeAt(0)
const OCT_CODE_NONE = " ".charCodeAt(0)
const OCT_CODE_PLUS = "+".charCodeAt(0)
const OCT_CODE_MINUS = "-".charCodeAt(0)

const GLS_CODE_FROM_BELOW = ",".charCodeAt(0)
const GLS_CODE_FROM_ABOVE = "`".charCodeAt(0)
const GLS_CODE_TOWARD_SEQ = "^".charCodeAt(0)
const GLS_CODE_TOWARD_SEQ_CONTINUE = "-".charCodeAt(0)

const VOL_CODE_NONE = " ".charCodeAt(0)
const VOL_CODE_0 = "0".charCodeAt(0)
const VOL_CODE_9 = "9".charCodeAt(0)
const VOL_CODE_10 = "@".charCodeAt(0)

export function riffComputeStepSizes(div: string) {
  const stepTimes: number[] = []
  const chars = div.split("")
  const length = chars.length
  chars.push("|") // pretend there's a bar at the end
  for (let index = -1; index < length; ) {
    const nextIndex = chars.indexOf("|", index + 1)
    if (index >= 0) {
      const stepCount = nextIndex - index
      stepTimes.push(...Array(stepCount).fill(1 / stepCount))
    }
    index = nextIndex
  }

  return stepTimes
}

export function riffDuration(riff: Riff) {
  const beatDuration = 60 / riff.bpm
  const steps = riffComputeStepSizes(riff.div)
  let duration = 0
  for (let i = 0; i < riff.seq.length; i++) {
    duration += (steps[i] ?? 0) * beatDuration
  }
  return duration
}

export function riffCharCodeToScaleNumber(code: number) {
  switch (code) {
    case SCALE_CODE_0$:
      return -0.5
    case SCALE_CODE_0:
      return 0
    case SCALE_CODE_1$:
      return 0.5
    case SCALE_CODE_1:
      return 1
    case SCALE_CODE_2$:
      return 1.5
    case SCALE_CODE_2:
      return 2
    case SCALE_CODE_3$:
      return 2.5
    case SCALE_CODE_3:
      return 3
    case SCALE_CODE_4$:
      return 3.5
    case SCALE_CODE_4:
      return 4
    case SCALE_CODE_5$:
      return 4.5
    case SCALE_CODE_5:
      return 5
    case SCALE_CODE_6$:
      return 5.5
    case SCALE_CODE_6:
      return 6
    case SCALE_CODE_7$:
      return 6.5
    case SCALE_CODE_7:
      return 7
    case SCALE_CODE_8$:
      return 7.5
    case SCALE_CODE_8:
      return 8
    case SCALE_CODE_9$:
      return 8.5
    case SCALE_CODE_9:
      return 9
  }

  throw new Error(`Unknown riff scale code: ${code}`)
}

export function riffScaleNumberToSemitoneOffset(
  scaleNumber: number,
  key: RiffKey,
) {
  let extra = 0
  while (scaleNumber < 1) {
    scaleNumber += 7
    extra -= 12
  }
  while (scaleNumber >= 8) {
    scaleNumber -= 7
    extra += 12
  }
  switch (scaleNumber) {
    case 1:
      return extra + 0
    case 1.5:
      return extra + 1
    case 2:
      return extra + 2
    case 2.5:
      return extra + 3
    case 3:
      return extra + (key.endsWith("-minor") ? 3 : 4)
    case 3.5:
      return extra + 4
    case 4:
      return extra + 5
    case 4.5:
      return extra + 6
    case 5:
      return extra + 7
    case 5.5:
      return extra + 8
    case 6:
      return extra + (key.endsWith("-minor") ? 8 : 9)
    case 6.5:
      return extra + (key.endsWith("-minor") ? 9 : 10)
    case 7:
      return extra + (key.endsWith("-minor") ? 10 : 11)
    case 7.5:
      return extra + 11
  }

  throw new Error(`Unknown riff scale number: ${scaleNumber}`)
}

export function riffKeyToSemitoneOffset(key: RiffKey) {
  switch (key.split("-")[0]) {
    case "C":
      return -9
    case "C#":
    case "Db":
      return -8
    case "D":
      return -7
    case "D#":
    case "Eb":
      return -6
    case "E":
      return -5
    case "F":
      return -4
    case "F#":
    case "Gb":
      return -3
    case "G":
      return -2
    case "G#":
      return -1
    case "Ab":
      return -1
    case "A":
      return 0
    case "A#":
    case "Bb":
      return 1
    case "B":
      return 2
  }

  throw new Error(`Unknown riff key: ${key}`)
}

export function riffScaleNumberToFrequency(
  scaleNumber: number,
  octave: number,
  key: RiffKey,
): number {
  const semitoneOffset =
    riffKeyToSemitoneOffset(key) +
    riffScaleNumberToSemitoneOffset(scaleNumber, key)
  return 440 * Math.pow(2, octave - 4 + semitoneOffset / 12)
}

export function riffCharCodeToOctave(code: number, currentOctave: number) {
  if (code >= OCT_CODE_0 && code <= OCT_CODE_9) {
    return code - OCT_CODE_0
  } else if (code === OCT_CODE_10) {
    return 10
  } else if (code === OCT_CODE_NONE) {
    return currentOctave
  } else if (code === OCT_CODE_PLUS) {
    return currentOctave + 1
  } else if (code === OCT_CODE_MINUS) {
    return currentOctave - 1
  } else if (isNaN(code)) {
    return currentOctave
  }

  throw new Error(`Unknown riff octave code: ${code}`)
}

export function riffGainAt(riff: Riff, index: number) {
  let gain = 1
  if (!riff.vol) return gain

  for (let i = 0; i <= index; i++)
    gain = riffCharCodeToGain(riff.vol.charCodeAt(i)) ?? gain

  return gain
}

export function riffOctaveAt(riff: Riff, index: number) {
  let octave = 4
  if (!riff.oct) return octave

  for (let i = 0; i <= index; i++)
    octave = riffCharCodeToOctave(riff.oct.charCodeAt(i), octave)

  return octave
}

export function riffCharCodeToGain(code: number) {
  if (code >= VOL_CODE_0 && code <= VOL_CODE_9) {
    return (code - VOL_CODE_0) / 10
  } else if (code === VOL_CODE_10) {
    return 1
  } else if (code === VOL_CODE_NONE) {
    return undefined
  } else if (isNaN(code)) {
    return undefined
  }

  throw new Error(`Unknown riff volume code: ${code}`)
}

function measure(
  steps: number[],
  str: string,
  index: number,
  predicate: (code: number, index: number) => boolean,
) {
  let duration = 0
  let i = index
  for (; i < str.length; i++) {
    if (!predicate(str.charCodeAt(i), i)) break
    duration += steps[i] ?? 0
  }
  return { duration, stepCount: i - index }
}

function findFirstNewSeqNoteWithin(
  riff: Riff,
  indexStart: number,
  indexAfter: number,
) {
  for (let peekIndex = indexStart; peekIndex < indexAfter; peekIndex++) {
    const peekCharCode = riff.seq.charCodeAt(peekIndex)
    if (
      peekCharCode !== SEQ_CODE_SUSTAIN &&
      peekCharCode !== SEQ_CODE_SILENCE
    ) {
      return {
        scaleNumber: riffCharCodeToScaleNumber(peekCharCode),
        octave: riffOctaveAt(riff, peekIndex),
      }
    }
  }
  return undefined
}

function freqSlideFrom(
  riff: Riff,
  steps: number[],
  index: number,
  note: VoiceNote & { scaleNumber: number },
  glsCharCode: number,
) {
  if (!riff.gls) return
  const beatDuration = 60 / riff.bpm

  const measureWhere = (c: number) => c === glsCharCode
  const measured = measure(steps, riff.gls, index, measureWhere)

  const slideDelta =
    riffCharCodeToScaleNumber(riff.gls.charCodeAt(index + measured.stepCount)) *
    (glsCharCode === GLS_CODE_FROM_BELOW ? -1 : 1)

  const timeStart = note.duration - (steps[index] ?? 0) * beatDuration
  const timeEnd = timeStart + measured.duration * beatDuration
  const deltaStart =
    riffScaleNumberToFrequency(
      note.scaleNumber + slideDelta,
      riffOctaveAt(riff, index),
      riff.key,
    ) - note.freqBase

  note.freqSlides = note.freqSlides ?? []
  note.freqSlides.push({ timeStart, timeEnd, deltaStart, deltaEnd: 0 })
}

function freqSlideTowardSeq(
  riff: Riff,
  steps: number[],
  index: number,
  note: VoiceNote & { scaleNumber: number; octave: number },
) {
  if (!riff.gls) return
  const beatDuration = 60 / riff.bpm
  const stepDuration = (steps[index] ?? 0) * beatDuration

  // Find the duration of the slide.
  const measureWhere = (c: number, i: number) =>
    i === index || c === GLS_CODE_TOWARD_SEQ_CONTINUE
  const measured = measure(steps, riff.gls, index, measureWhere)
  const slideDuration = measured.duration * beatDuration
  const slideSteps = measured.stepCount

  // Find the target of the slide.
  const target = findFirstNewSeqNoteWithin(riff, index, index + slideSteps)
  if (!target) return

  note.freqSlides = note.freqSlides ?? []
  const timeStart = note.duration - stepDuration
  const timeEnd = timeStart + slideDuration
  const deltaStart = note.freqSlides[note.freqSlides.length - 1]?.deltaEnd ?? 0
  const deltaEnd =
    riffScaleNumberToFrequency(target.scaleNumber, target.octave, riff.key) -
    note.freqBase
  note.freqSlides.push({ timeStart, timeEnd, deltaStart, deltaEnd })
}

export function riffSeqToVoiceNotes(riff: Riff): [number, VoiceNote][] {
  const beatDuration = 60 / riff.bpm

  // Compute what timestamp each step of the strings correspond to.
  const steps = riffComputeStepSizes(riff.div)

  // Compile a list of VoiceNotes for the riff.
  const notes: [number, VoiceNote][] = []
  let note: (VoiceNote & { scaleNumber: number; octave: number }) | undefined
  let timeOffset = 0
  for (let i = 0; i < riff.seq.length; i++) {
    // Use the amount of time that was sliced for this step.
    const stepDuration = (steps[i] ?? 0) * beatDuration

    // Check the sequencer for a note.
    const seqCharCode = riff.seq.charCodeAt(i)
    const glsCharCode = riff.gls?.charCodeAt(i)
    const volCharCode = riff.vol?.charCodeAt(i)
    if (seqCharCode === SEQ_CODE_SUSTAIN) {
      // Sustain the current note.
      if (note) note.duration += stepDuration
    } else if (seqCharCode === SEQ_CODE_SILENCE) {
      // The absence of a note.
    } else if (
      note &&
      (glsCharCode === GLS_CODE_TOWARD_SEQ ||
        glsCharCode === GLS_CODE_TOWARD_SEQ_CONTINUE)
    ) {
      // Slide toward the next note.
      // This means we don't start a new note, but sustain the duration.
      if (note) note.duration += stepDuration
    } else {
      // Other character codes are used to start a note.
      const scaleNumber = riffCharCodeToScaleNumber(seqCharCode)
      const octave = riffOctaveAt(riff, i)
      const frequency = riffScaleNumberToFrequency(
        scaleNumber,
        octave,
        riff.key,
      )
      note = {
        duration: stepDuration,
        freqBase: frequency,
        scaleNumber,
        octave,
      }
      notes.push([timeOffset, note])

      const gain = riffGainAt(riff, i)
      if (gain != 1 && riffCharCodeToGain(volCharCode ?? 0) === undefined) {
        note.gainEvents ??= []
        note.gainEvents.push({ time: 0, gain })
      }
    }

    // Check for a glissando slide.
    if (note && glsCharCode) {
      const prevGlsCharCode = riff.gls?.charCodeAt(i - 1)
      if (
        glsCharCode === GLS_CODE_TOWARD_SEQ &&
        prevGlsCharCode !== GLS_CODE_TOWARD_SEQ
      ) {
        // Slide toward the target indicated by the overlapping seq track.
        freqSlideTowardSeq(riff, steps, i, note)
      } else if (
        glsCharCode === GLS_CODE_FROM_BELOW &&
        prevGlsCharCode !== GLS_CODE_FROM_BELOW
      ) {
        // Slide upward from below.
        freqSlideFrom(riff, steps, i, note, GLS_CODE_FROM_BELOW)
      } else if (
        glsCharCode === GLS_CODE_FROM_ABOVE &&
        prevGlsCharCode !== GLS_CODE_FROM_ABOVE
      ) {
        // Slide downward from above.
        freqSlideFrom(riff, steps, i, note, GLS_CODE_FROM_ABOVE)
      }
    }

    // Check for a volume event
    if (note && volCharCode) {
      const gain = riffCharCodeToGain(volCharCode)
      if (gain !== undefined) {
        note.gainEvents ??= []
        note.gainEvents.push({ time: note.duration - stepDuration, gain })
      }
    }

    timeOffset += stepDuration
  }

  notes.forEach(([time, note]) => {
    delete (note as any).scaleNumber
    delete (note as any).octave
  })

  return notes
}
