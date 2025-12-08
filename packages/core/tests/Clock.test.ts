import { vi, describe, expect, test } from "vitest"
import { Clock } from "../src/Clock"

describe("Clock", () => {
  test("it runs the given function on each tick, throttled to 60fps", () => {
    const nextFrameFn = vi.fn<[(timestamp: number) => void], number>()
    let runningClock: Clock | undefined

    const runSaw: {
      frame?: number
      timestamp?: number
      currentFramesPerSecond?: number
    }[] = []
    const runFn = () => {
      runSaw.push({
        frame: runningClock?.frame,
        timestamp: runningClock?.timestamp,
        currentFramesPerSecond: runningClock?.currentFramesPerSecond,
      })
    }

    const clock = new Clock(runFn, nextFrameFn)
    runningClock = clock

    clock.tick(16)
    expect(runSaw).toEqual([])

    clock.tick(17)
    expect(runSaw).toEqual([
      { frame: 1, timestamp: 1000 / 60, currentFramesPerSecond: 1000 / 17 },
    ])

    clock.tick(33)
    expect(runSaw).toEqual([
      { frame: 1, timestamp: 1000 / 60, currentFramesPerSecond: 1000 / 17 },
    ])

    clock.tick(35)
    expect(runSaw).toEqual([
      { frame: 1, timestamp: 1000 / 60, currentFramesPerSecond: 1000 / 17 },
      { frame: 2, timestamp: 2000 / 60, currentFramesPerSecond: 1000 / 18 },
    ])

    clock.tick(35)
    expect(runSaw).toEqual([
      { frame: 1, timestamp: 1000 / 60, currentFramesPerSecond: 1000 / 17 },
      { frame: 2, timestamp: 2000 / 60, currentFramesPerSecond: 1000 / 18 },
    ])

    clock.tick(50)
    expect(runSaw).toEqual([
      { frame: 1, timestamp: 1000 / 60, currentFramesPerSecond: 1000 / 17 },
      { frame: 2, timestamp: 2000 / 60, currentFramesPerSecond: 1000 / 18 },
    ])

    clock.tick(51)
    expect(runSaw).toEqual([
      { frame: 1, timestamp: 1000 / 60, currentFramesPerSecond: 1000 / 17 },
      { frame: 2, timestamp: 2000 / 60, currentFramesPerSecond: 1000 / 18 },
      { frame: 3, timestamp: 3000 / 60, currentFramesPerSecond: 1000 / 16 },
    ])
  })
})
