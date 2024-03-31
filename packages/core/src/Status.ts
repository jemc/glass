import { registerComponent } from "./Component"
import { Clock } from "./Clock"
import { World } from "./World"
import { System } from "./System"

export interface StatusConfig {
  readonly setAtStart?: boolean
  readonly maxFrames?: number
  readonly sets?: ReadonlyArray<string>
  readonly stops?: ReadonlyArray<string>
  readonly then?: ReadonlyArray<string>
  readonly blocks?: ReadonlyArray<string>
  readonly sustains?: ReadonlyArray<string>
}

interface CompiledStatusConfig extends StatusConfig {
  blockedBy?: string[]
  sustainedBy?: string[]
}

export class Status {
  static readonly componentId = registerComponent(this)

  private configs: { [name: string]: CompiledStatusConfig } = {}
  private map: { [name: string]: number } = {}

  constructor(
    private clock: Clock,
    configs: { [name: string]: StatusConfig },
  ) {
    this.configs = configs

    // Take note of statuses that are blocked by other statuses.
    for (const [name, config] of Object.entries(configs)) {
      if (config.blocks) {
        for (const blockedName of config.blocks) {
          const blocked = this.configs[blockedName]
          if (blocked) {
            blocked.blockedBy = blocked.blockedBy ?? []
            blocked.blockedBy.push(name)
          }
        }
      }
    }

    // Take note of statuses that are sustained by other statuses.
    for (const [name, config] of Object.entries(configs)) {
      if (config.sustains) {
        for (const sustainedName of config.sustains) {
          const sustained = this.configs[sustainedName]
          if (sustained) {
            sustained.sustainedBy = sustained.sustainedBy ?? []
            sustained.sustainedBy.push(name)
          }
        }
      }
    }

    // Set any statuses that should be set at the start.
    for (const [name, config] of Object.entries(configs)) {
      if (config.setAtStart) this.set(name)
    }
  }

  get list() {
    return Object.keys(this.map)
  }

  is(name: string) {
    return this.map[name] !== undefined
  }

  isStarting(name: string) {
    return this.map[name] === this.clock.frame
  }

  stop(name: string) {
    // If it's already stopped, do nothing.
    if (this.map[name] === undefined) return

    // If it's sustained by another status, do nothing.
    const config = this.configs[name]
    if (config?.sustainedBy) {
      for (const sustainerName of config.sustainedBy) {
        if (this.is(sustainerName)) return
      }
    }

    // Remove it from the map.
    delete this.map[name]

    // Run any relevant triggers.
    if (config?.then) config.then.forEach((name) => this.set(name))
  }

  set(name: string, activate = true) {
    // If asked to deactivate, call stop instead of continuing.
    if (!activate) {
      this.stop(name)
      return
    }

    // If it's already set, do nothing.
    if (this.map[name] !== undefined) {
      return
    }

    // If it's blocked by another status, do nothing.
    const config = this.configs[name]
    if (config?.blockedBy) {
      for (const blockerName of config.blockedBy) {
        if (this.is(blockerName)) return
      }
    }

    // Activate it at this frame.
    this.map[name] = this.clock.frame

    // Run any relevant triggers.
    if (config?.sets) config.sets.forEach((other) => this.set(other))
    if (config?.stops) config.stops.forEach((other) => this.stop(other))
  }

  setMany(names: { [name: string]: boolean }) {
    for (const [name, activate] of Object.entries(names)) {
      this.set(name, activate)
    }
  }

  each(callback: (name: string, config: StatusConfig, frame: number) => void) {
    for (const [name, frame] of Object.entries(this.map)) {
      const config = this.configs[name]
      if (config) callback(name, config, frame)
    }
  }

  noticeTime() {
    for (const [name, frame] of Object.entries(this.map)) {
      const config = this.configs[name]
      if (config?.maxFrames && config?.maxFrames < this.clock.frame - frame) {
        this.stop(name)
      }
    }
  }
}

export const StatusSystem = (world: World) =>
  System.for([Status], {
    shouldMatchAll: [Status],

    runEach(entity, status) {
      status.noticeTime()
    },
  })
