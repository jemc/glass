import { Voice, VoiceConfig, VoiceNote } from "./Voice"
import { Clock, World, registerComponent } from "@glass/core"
import { Context } from "./Context"
import { Riff, riffDuration } from "./Riff"

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
    console.log(finishTime, this.scheduleFinishTime)

    const { pre, loop } = this.config
    const preSectionCount = pre?.length ?? 0

    if (pre && this.scheduledSections < preSectionCount) {
      this.scheduleSection(
        pre[this.scheduledSections]!,
        this.scheduleFinishTime,
      )
      this.scheduledSections++
    } else if (loop) {
      console.log(
        `Scheduling loop section ${this.scheduledSections - preSectionCount}`,
      )
      let loopIndex = this.scheduledSections - preSectionCount
      while (loopIndex >= loop.length) loopIndex -= loop.length
      this.scheduleSection(loop[loopIndex]!, this.scheduleFinishTime)
      this.scheduledSections++
    }
  }

  scheduleSection(name: string, timeOffset = 0) {
    console.log(`Scheduling section ${name} at ${timeOffset}`)
    const section = this.config.sections[name]
    if (!section) throw new Error(`No section named ${name}`)

    let greatestRiffTimeOffset = 0

    for (const [voiceName, riffs] of Object.entries(section)) {
      const voice = this.voices[voiceName]
      if (!voice) throw new Error(`No voice named ${voiceName}`)

      let riffTimeOffset = timeOffset
      for (const riff of riffs) {
        voice.applyRiff(riff, riffTimeOffset)
        riffTimeOffset += riffDuration(riff)
      }
      if (riffTimeOffset > greatestRiffTimeOffset) {
        greatestRiffTimeOffset = riffTimeOffset
      }
    }

    this.scheduleFinishTime = greatestRiffTimeOffset
  }

  continuePlaying(context: Context, clock: Clock) {
    const foresightTime = 0.1 // TODO: determine dynamically?
    this.scheduleSectionsIfNeeded(clock.timestamp / 1000 + foresightTime)

    this
  }
}

export const ArrangementPlaySystem = (world: World) =>
  world.systemFor([Context, ArrangementPlay], {
    runEach(entity, context, play) {
      context.audio.resume() // TODO: move to another system, and add suspend when tab loses focus

      play.setupVoicesIfNeeded(context)

      play.continuePlaying(context, world.clock)
    },
  })
