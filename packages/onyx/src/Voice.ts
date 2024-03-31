import { registerComponent } from "@glass/core"
import { Context } from "./Context"
import { makeAudioWorkletNodeFactory } from "./AudioWorklet"
import { OscAudioWorkletNodeFactory } from "./Osc"

export interface VoiceConfig {
  readonly gain: number
  readonly pan: number
  readonly timbre?: number
  readonly vibrato?: number
  readonly vibratoFreq?: number
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
  private vibrato: AudioParam
  private vibratoFreq: AudioParam

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
    this.vibrato =
      node.parameters.get("vibrato") ?? newThrowawayAudioParam(context.audio)
    this.vibratoFreq =
      node.parameters.get("vibratoFreq") ??
      newThrowawayAudioParam(context.audio)
    this.finalGain = finalGain.gain
    this.finalPan = finalPan.pan

    // Set initial AudioParam values.
    this.freq.value = 440
    this.gain.value = 0
    this.timbre.value = this.config.timbre ?? 0
    this.vibrato.value = this.config.vibrato ?? 0
    this.vibratoFreq.value = this.config.vibratoFreq ?? 4
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
