import { registerComponent, Clock, clampToRange } from "@glass/core"

type GaugeConfig = Partial<Pick<Gauge, "min" | "max" | "value">>

class Gauge {
  readonly min: number = 0
  readonly max: number = 1

  value = 0

  constructor(config: GaugeConfig) {
    Object.assign(this, config)

    if (this.min >= this.max) throw new Error("min must be less than max")
    if (!Number.isFinite(this.min)) throw new Error("min must be finite")
    if (!Number.isFinite(this.max)) throw new Error("max must be finite")

    this.value = clampToRange(this.value, this)
  }
}

export interface GaugeEffect {
  readonly type: "set" | "setPercent" | "add" | "addPercent"
  readonly name: string
  readonly value: number
}

export class Gauges {
  static readonly componentId = registerComponent(this)

  private map: { [name: string]: Gauge } = {}

  constructor(configs: { [name: string]: GaugeConfig } = {}) {
    for (const [name, partialConfig] of Object.entries(configs)) {
      this.map[name] = new Gauge(partialConfig)
    }
  }

  private gauge(name: string) {
    const gauge = this.map[name]
    if (!gauge) throw new Error(`No gauge named "${name}"`)
    return gauge
  }

  get(name: string) {
    return this.gauge(name).value
  }

  apply(effect: GaugeEffect) {
    this[effect.type](effect.name, effect.value)
  }

  set(name: string, value: number) {
    const gauge = this.gauge(name)
    if (gauge.value === value) return

    gauge.value = clampToRange(value, gauge)
  }

  setPercent(name: string, percent: number) {
    if (percent < 0) percent = 0
    else if (percent > 1) percent = 1

    const gauge = this.gauge(name)
    const value = gauge.min + (gauge.max - gauge.min) * percent
    if (gauge.value === value) return

    gauge.value = value
  }

  add(name: string, delta: number) {
    const gauge = this.gauge(name)
    if (delta === 0) return

    gauge.value = clampToRange(gauge.value + delta, gauge)
  }

  addPercent(name: string, percent: number) {
    const gauge = this.gauge(name)
    const delta = (gauge.max - gauge.min) * percent
    if (delta === 0) return

    gauge.value = clampToRange(gauge.value + delta, gauge)
  }
}
