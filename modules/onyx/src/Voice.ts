import { registerComponent } from "@glass/core"
import { Context } from "./Context"
import { Riff, riffSeqToVoiceNotes } from "./Riff"
import { makeAudioWorkletNodeFactory } from "./AudioWorklet"
import { OscAudioWorkletNodeFactory } from "./Osc"

export interface VoiceConfig {
  readonly gain: number
  readonly pan: number
  readonly timbre?: number
  readonly waveShapeMapping?: Float32Array
  readonly harmonicCoefficients?: {
    real: Float32Array
    imaginary: Float32Array
  }
  readonly worklet?: ReturnType<typeof makeAudioWorkletNodeFactory>
}

export interface VoiceNote {
  duration: number
  freqBase: number
  freqSlides?: VoiceNoteSlide[]
  gainEvents?: { time: number; gain: number }[]
}

interface VoiceNoteSlide {
  timeStart: number // relative to note start
  timeEnd: number // relative to note start
  deltaStart: number
  deltaEnd: number
}

// const busterCharging: Riff = {
//   bpm: 480,
//   key: "G#-minor",
//   div: "|               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               ",
//   seq: "0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---0-----1-2-3-5---",
//   oct: "4                                                                                                                                                                                                                                                                                                                                                                                                                                                                               ",
//   gls: "````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ````p           ",
// }
// const exampleRiff = busterCharging

// const oneUp: Riff = {
//   bpm: 120,
//   key: "C#-major",
//   div: "|       |       ",
//   seq: "1234567812345678",
//   oct: "6               ",
//   vol: "        44444444",
// }
// const exampleRiff = oneUp

// const mrXIntro: Riff = {
//   bpm: 260,
//   key: "A-minor",
//   div: "| | | |   | | | | | | | |   | | | | | | |   |   |     |     |     |     | | |     |     |   |   |   |   ",
//   seq: "  1-- 1 1 1 p 1 2   3-- 3 3 3 2 3 4 r-4-r-r r r r-- 2-- r-- r-- 2-- r-- 5-- 5-- r-- 5-- u-7-u-7-u-7-u-- ",
//   gls: "                                      ^-^--                                               ^-^-^-^-^-^-- ",
//   oct: "4",
// }
// const exampleRiff = mrXIntro

// const mrXIntro2: Riff = {
//   bpm: 260,
//   key: "A-minor",
//   div: "|     |     |     |     | | | | |     |     |     |     | | | | |     |     |     |     |     |     |     |     | | |     |     |   |   |   |   ",
//   seq: "1-- 3-- 1-- 5-- 3-- 1-- 3 2 3 4 3-- 5-- 3-- 7-- 5-- 3-- 5 4 5 6 2-- r-- 2-- y-- r-- 2-- y-- r-- y-- y-- r-- y-- u-- u-- y-- u-- 9-i-9-i-9-i-9-- ",
//   gls: "                                                                                                                                  ^-^-^-^-^-^-- ",
//   oct: "3",
// }
// const exampleRiff2 = mrXIntro2

const mrX: Riff = {
  bpm: 180,
  key: "D-minor",
  div: "|           | | | | | | | | | | | | | | | |",
  seq: "           8--97-8-5-7-4-32-32-0--7--4--5--",
  gls: "           ,1                     `q    ,1",
  vol: "                                       6  ",
}
const exampleRiff = mrX

const mrX2: Riff = {
  bpm: 180,
  key: "D-minor",
  div: "|           |           |           |           |           |           |           |           |           ",
  seq: "0-----1-----3-----5-----------4-----------3-----------1-----4-----3-----------2-----------0-----5-----------",
  oct: "4                                                                                               3           ",
  vol: "@38261@38261@38261@38261514131@38261514131@38261514131@38261@38261@38261514131@38261514131@38261@38261514131",
}
// const exampleRiff = mrX2
const exampleRiff2 = mrX2

const pulse1 = {}
const pulse2 = {}

const mrXStage = {
  voices: { pulse1, pulse2 },

  sections: {
    intro: {
      pulse1: [mrX, mrX],
      pulse2: [mrX2],
    },
  },

  pre: ["intro"],
  loop: [],
  post: [],
}

// const exampleRiff: Riff = {
//   bpm: 420,
//   key: "C#-minor",
//   div: "|               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               |               ",
//   seq: "5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---5-----6-7-8-9---",
//   gls: "````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ````p       ``1 ",
//   oct: "4                                                                                                                                                                                                                                                                                                                                                                                                                                                                               ",
// }

// const exampleRiff: Riff = {
//   bpm: 120,
//   key: "A-minor",
//   div: "|       |       |       |       |       |       |       |       ",
//   seq: "1 1 0 0 1 1 0 0 1 1 0 3-----0 0 1 1 0 0 1 1 0 0 1 1 0 5-----0 0 ",
//   oct: "                                                                ",
//   gls: "                      ,,2                             ,,4       ",
// }
// const exampleRiff2 = exampleRiff

// const exampleRiff: Riff = {
//   bpm: 120,
//   key: "A-minor",
//   div: "|       |   |   |   |   |   |   |   ",
//   seq: "1 1 1 1 0-1-5------ 4-- 5-4-  3---- ",
//   oct: "2                                   ",
//   gls: "            ,2,2,2,2             `2 ",
// }
// const exampleRiff2 = exampleRiff

// const exampleRiff: Riff = {
//   bpm: 120,
//   key: "A-minor",
//   div: "|   |   |   |   |   ",
//   seq: "1-3 4---- 3-5-----  ",
//   oct: "5                   ",
//   gls: "/1          ^--     ",
// }
// const exampleRiff2 = exampleRiff

// const exampleRiff: Riff = {
//   bpm: 120,
//   key: "A-minor",
//   div: "|   |   |   |   |   ",
//   seq: "1-3 4---- 3-5-----  ",
//   oct: "4                   ",
//   gls: "/1                  ",
// }

function newThrowawayAudioParam(audio: AudioContext): AudioParam {
  // Create a throwaway gain node (not connected to anything)
  // and return its gain parameter as an AudioParam that will do nothing.
  return audio.createGain().gain
}

export class Voice {
  static readonly componentId = registerComponent(this)

  private freq: AudioParam
  private gain: AudioParam
  private timbre: AudioParam
  private finalGain: AudioParam
  private finalPan: AudioParam

  constructor(
    readonly context: Context,
    readonly config: VoiceConfig,
  ) {
    // Set up the AudioNode DAG.
    const workletNodeFactory = this.config.worklet ?? OscAudioWorkletNodeFactory
    const node = workletNodeFactory(context.audio)
    const finalGain = context.audio.createGain()
    const finalPan = context.audio.createStereoPanner()
    node.connect(finalGain)
    finalGain.connect(finalPan)
    finalPan.connect(context.audio.destination)

    // Capture AudioParams.
    this.freq =
      node.parameters.get("freq") ?? newThrowawayAudioParam(context.audio)
    this.gain =
      node.parameters.get("gain") ?? newThrowawayAudioParam(context.audio)
    this.timbre =
      node.parameters.get("timbre") ?? newThrowawayAudioParam(context.audio)
    this.finalGain = finalGain.gain
    this.finalPan = finalPan.pan

    // Set initial AudioParam values.
    this.freq.value = 440
    this.gain.value = 0
    this.timbre.value = this.config.timbre ?? 0
    this.finalGain.value = this.config.gain
    this.finalPan.value = this.config.pan
  }

  scheduleNote(timeOffset: number, note: VoiceNote) {
    const timeStart = timeOffset
    const timeEnd = timeStart + note.duration

    const attackTime = 0.0 // TODO: configurable
    const releaseTime = 0.01 // TODO: configurable

    const { gain, freq } = this

    freq.setValueAtTime(note.freqBase, timeStart)

    if (note.freqSlides) {
      note.freqSlides.forEach((slide) => {
        freq.setValueAtTime(
          note.freqBase + slide.deltaStart,
          timeStart + slide.timeStart,
        )
        freq.exponentialRampToValueAtTime(
          note.freqBase + slide.deltaEnd,
          timeStart + slide.timeEnd,
        )
      })
    }

    gain.cancelScheduledValues(timeStart)
    gain.setValueAtTime(0, timeStart)
    gain.linearRampToValueAtTime(1.0, timeStart + attackTime)

    if (note.gainEvents) {
      note.gainEvents.forEach(({ time, gain: factor }) => {
        gain.setValueAtTime(factor, timeStart + time)
      })
    }

    gain.cancelScheduledValues(timeEnd - releaseTime)
    gain.setValueAtTime(0, timeEnd - releaseTime)
    gain.linearRampToValueAtTime(0, timeEnd)
  }
}
