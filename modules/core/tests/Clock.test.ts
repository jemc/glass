import { vi, describe, expect, test } from "vitest"
import { Clock } from "../src/Clock"

describe("Clock", () => {
  test("it runs the given function on each tick", () => {
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
    expect(runSaw).toEqual([
      { frame: 1, timestamp: 16, currentFramesPerSecond: 62.5 },
    ])

    clock.tick(32)
    expect(runSaw).toEqual([
      { frame: 1, timestamp: 16, currentFramesPerSecond: 62.5 },
      { frame: 2, timestamp: 32, currentFramesPerSecond: 62.5 },
    ])

    clock.tick(64)
    expect(runSaw).toEqual([
      { frame: 1, timestamp: 16, currentFramesPerSecond: 62.5 },
      { frame: 2, timestamp: 32, currentFramesPerSecond: 62.5 },
      { frame: 3, timestamp: 64, currentFramesPerSecond: 31.25 },
    ])
  })
})
