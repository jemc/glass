import { Voice, VoiceConfig, VoiceNote } from "./Voice"
import { Clock, System, World, registerComponent } from "@glass/core"
import { Context } from "./Context"
import { Riff, riffDuration, riffSeqToVoiceNotes } from "./Riff"

export interface Arrangement {
  // Named voices, with their configuration.
  readonly voices: { [name: string]: VoiceConfig }

  // Named sections, with the riffs played by each voice in that section.
  readonly sections: { [name: string]: { [voiceName: string]: Riff[] } }

  // Sections to play when first starting the arrangement.
  readonly pre?: string[]

  // Sections to play in a loop while the arrangement is sustained.
  readonly loop?: string[]

  // Sections to play when the arrangement is released.
  readonly post?: string[]
}

export class ArrangementPlay {
  static readonly componentId = registerComponent(this)

  private startTimestamp = 0
  private voices: { [name: string]: Voice } = {}
  private pendingNotes: { [name: string]: [number, VoiceNote][] } = {}

  private scheduledSections = 0
  private scheduleFinishTime = 0

  constructor(readonly config: Arrangement) {}

  setupVoicesIfNeeded(context: Context) {
    for (const [name, voiceConfig] of Object.entries(this.config.voices)) {
      this.voices[name] ??= new Voice(context, voiceConfig)
      this.pendingNotes[name] ??= []
    }
  }

  scheduleSectionsIfNeeded(finishTime: number) {
    if (finishTime <= this.scheduleFinishTime) return

    const { pre, loop } = this.config
    const preSectionCount = pre?.length ?? 0

    if (pre && this.scheduledSections < preSectionCount) {
      this.scheduleSection(
        pre[this.scheduledSections]!,
        this.scheduleFinishTime,
      )
      this.scheduledSections++
    } else if (loop) {
      let loopIndex = this.scheduledSections - preSectionCount
      while (loopIndex >= loop.length) loopIndex -= loop.length
      this.scheduleSection(loop[loopIndex]!, this.scheduleFinishTime)
      this.scheduledSections++
    }
  }

  scheduleSection(name: string, timeOffset = 0) {
    const section = this.config.sections[name]
    if (!section) throw new Error(`No section named ${name}`)

    let greatestRiffTimeOffset = 0

    for (const [voiceName, riffs] of Object.entries(section)) {
      const voice = this.voices[voiceName]
      if (!voice) throw new Error(`No voice named ${voiceName}`)

      let riffTimeOffset = timeOffset
      for (const riff of riffs) {
        riffSeqToVoiceNotes(riff).forEach(([time, note]) => {
          this.pendingNotes[voiceName]!.push([time + riffTimeOffset, note])
        })
        riffTimeOffset += riffDuration(riff)
      }
      if (riffTimeOffset > greatestRiffTimeOffset) {
        greatestRiffTimeOffset = riffTimeOffset
      }
    }

    this.scheduleFinishTime = greatestRiffTimeOffset
  }

  continuePlaying(context: Context) {
    const { clock } = context.world
    const timestamp = clock.timestamp / 1000

    if (this.startTimestamp === 0) {
      this.startTimestamp = timestamp
      this.scheduleFinishTime = this.startTimestamp
    }

    const foresightTime = 2 / clock.currentFramesPerSecond // 2 frame
    const foresightTimestamp = timestamp + foresightTime
    this.scheduleSectionsIfNeeded(foresightTimestamp)

    for (const [name, voice] of Object.entries(this.voices)) {
      const pendingNotes = this.pendingNotes[name]!
      while (pendingNotes.length > 0) {
        const [time, note] = pendingNotes[0]!
        if (time > foresightTimestamp) {
          break
        } else {
          pendingNotes.shift()
          voice.scheduleNote(time, note)
        }
      }
    }

    this
  }
}

export const ArrangementPlaySystem = (onyx: Context) =>
  System.for(onyx, [ArrangementPlay], {
    shouldMatchAll: [ArrangementPlay],

    runEach(entity, play) {
      onyx.audio.resume() // TODO: move to another system, and add suspend when tab loses focus

      play.continuePlaying(onyx)
    },

    runEachSet(entity, play) {
      play.setupVoicesIfNeeded(onyx)
    },
  })
