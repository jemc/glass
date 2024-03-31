import type { Writable } from "type-fest"

const requestAnimationFrame = globalThis.window?.requestAnimationFrame

export class Clock {
  // The number of frames that have been triggered so far.
  // Note that the first triggered frame will be `1`, not `0`.
  readonly frame: number = 0

  // The time at which the latest frame started running, in milliseconds.
  readonly timestamp: DOMHighResTimeStamp = 0

  // An indication of how fast frames are currently happening, expressed
  // in frames per second (as measured via the last inter-frame interval).
  readonly currentFramesPerSecond: number = 0
  private tickAndKeepRunningFn: (timestamp: DOMHighResTimeStamp) => void

  // TODO: Refine this mechanism or remove it.
  private slowMotionFactor?: number

  // Create a new clock, which will call the given `runFn` on each `tick`.
  constructor(
    private runFn: () => void = () => {},
    private requestNextFrame = requestAnimationFrame ?? undefined,
  ) {
    this.tickAndKeepRunningFn = this.tickAndKeepRunning.bind(this)
  }

  // Start running the clock, which will call the given `runFn` on a regular
  // interval. This has no effect if the clock is already running.
  private alreadyStarted = false
  startRunning() {
    if (this.alreadyStarted) return
    if (this.requestNextFrame) this.requestNextFrame(this.tickAndKeepRunningFn)
    this.alreadyStarted = true
  }
  private tickAndKeepRunning(timestamp: DOMHighResTimeStamp) {
    this.tick(timestamp)
    requestAnimationFrame(this.tickAndKeepRunningFn)
  }

  // Run the next frame, using the given `timestamp`, and call the held `runFn`.
  //
  // Usually you don't need to call this manually, as it's called automatically
  // on a regular interval after `startRunning` is called.
  //
  // However, this method is exposed to allow manual control during tests.
  // Be sure to supply a monotonic increasing `timestamp` to avoid weirdness.
  tick(timestamp: DOMHighResTimeStamp) {
    const timeDelta = 1000 / (timestamp - this.timestamp)

    // In slow motion, we skip processing some frames.
    if (this.slowMotionFactor && this.slowMotionFactor > 60 / timeDelta) return

    // Update the clock state using a writeable view of the clock.
    // This hack is a simple way of exposing a read-only interface,
    // while still allowing us to update them internally.
    const write: Writable<Clock> = this
    write.frame++
    write.timestamp = timestamp
    write.currentFramesPerSecond = timeDelta

    // Run the designated run function that the clock is driving.
    this.runFn()
  }
}
