import { jest, describe, expect, test } from "@jest/globals"
import { World } from "../src/World"
import {
  Button,
  ButtonState,
  ButtonSource,
  ButtonSourceConfig,
} from "../src/Button"
import { AutoMap } from "../src/AutoMap"

describe("ButtonState", () => {
  test("tracks the current state of button presses", () => {
    const world = new World()
    const state = new ButtonState(world.clock)

    expect(state.isPressed(Button.Start)).toBe(false)
    expect(state.isPressed(Button.Select)).toBe(false)
    expect(state.isPressedJustNow(Button.Start)).toBe(false)
    expect(state.isPressedJustNow(Button.Select)).toBe(false)

    // Tick the clock a few times to make sure that everything works correctly
    // even when we're not starting at time zero.
    world.clock.tick(100)
    world.clock.tick(200)
    world.clock.tick(300)

    expect(state.isPressed(Button.Start)).toBe(false)
    expect(state.isPressed(Button.Select)).toBe(false)
    expect(state.isPressedJustNow(Button.Start)).toBe(false)
    expect(state.isPressedJustNow(Button.Select)).toBe(false)

    // Press Select.
    state.capture(Button.Select)
    world.clock.tick(400)

    expect(state.isPressed(Button.Start)).toBe(false)
    expect(state.isPressed(Button.Select)).toBe(true)
    expect(state.isPressedJustNow(Button.Start)).toBe(false)
    expect(state.isPressedJustNow(Button.Select)).toBe(true)

    // Tick again - Select is still pressed, but it's no longer "just now".
    world.clock.tick(500)

    expect(state.isPressed(Button.Start)).toBe(false)
    expect(state.isPressed(Button.Select)).toBe(true)
    expect(state.isPressedJustNow(Button.Start)).toBe(false)
    expect(state.isPressedJustNow(Button.Select)).toBe(false)

    // Press Start.
    state.capture(Button.Start)
    world.clock.tick(600)

    expect(state.isPressed(Button.Start)).toBe(true)
    expect(state.isPressed(Button.Select)).toBe(true)
    expect(state.isPressedJustNow(Button.Start)).toBe(true)
    expect(state.isPressedJustNow(Button.Select)).toBe(false)

    // Release Select. Start is still pressed, but it's no longer "just now".
    state.release(Button.Select)
    world.clock.tick(700)

    expect(state.isPressed(Button.Start)).toBe(true)
    expect(state.isPressed(Button.Select)).toBe(false)
    expect(state.isPressedJustNow(Button.Start)).toBe(false)
    expect(state.isPressedJustNow(Button.Select)).toBe(false)

    // Release Start.
    state.release(Button.Start)
    world.clock.tick(800)

    expect(state.isPressed(Button.Start)).toBe(false)
    expect(state.isPressed(Button.Select)).toBe(false)
    expect(state.isPressedJustNow(Button.Start)).toBe(false)
    expect(state.isPressedJustNow(Button.Select)).toBe(false)
  })
})

enum CustomButton {
  Foo,
  Bar,
  Baz,
}

describe("ButtonSource", () => {
  test("captures standard buttons with default mappings", () => {
    const world = new World()
    const source = new ButtonSource(
      new ButtonState(world.clock),
      ButtonSourceConfig.Default,
    )
    const event = { code: "", altKey: false, ctrlKey: false, shiftKey: false }

    expect(source.state.isPressed(Button.Up)).toBe(false)
    expect(source.state.isPressed(Button.Left)).toBe(false)
    expect(source.state.isPressed(Button.Down)).toBe(false)
    expect(source.state.isPressed(Button.Right)).toBe(false)

    // Press Up & Left.
    source.captureKeyboardEvent({ ...event, code: "ArrowUp" })
    source.captureKeyboardEvent({ ...event, code: "ArrowLeft" })
    world.clock.tick(100)

    expect(source.state.isPressed(Button.Up)).toBe(true)
    expect(source.state.isPressed(Button.Left)).toBe(true)
    expect(source.state.isPressed(Button.Down)).toBe(false)
    expect(source.state.isPressed(Button.Right)).toBe(false)

    // Release Up & Press Down.
    source.releaseKeyboardEvent({ ...event, code: "ArrowUp" })
    source.captureKeyboardEvent({ ...event, code: "ArrowDown" })
    world.clock.tick(200)

    expect(source.state.isPressed(Button.Up)).toBe(false)
    expect(source.state.isPressed(Button.Left)).toBe(true)
    expect(source.state.isPressed(Button.Down)).toBe(true)
    expect(source.state.isPressed(Button.Right)).toBe(false)

    // Release Left & Press Right.
    source.releaseKeyboardEvent({ ...event, code: "ArrowLeft" })
    source.captureKeyboardEvent({ ...event, code: "ArrowRight" })
    world.clock.tick(300)

    expect(source.state.isPressed(Button.Up)).toBe(false)
    expect(source.state.isPressed(Button.Left)).toBe(false)
    expect(source.state.isPressed(Button.Down)).toBe(true)
    expect(source.state.isPressed(Button.Right)).toBe(true)

    // Release Down & Right.
    source.releaseKeyboardEvent({ ...event, code: "ArrowDown" })
    source.releaseKeyboardEvent({ ...event, code: "ArrowRight" })
    world.clock.tick(400)

    expect(source.state.isPressed(Button.Up)).toBe(false)
    expect(source.state.isPressed(Button.Left)).toBe(false)
    expect(source.state.isPressed(Button.Down)).toBe(false)
    expect(source.state.isPressed(Button.Right)).toBe(false)
  })

  test("captures custom buttons with weird mappings", () => {
    const world = new World()
    const source = new ButtonSource<CustomButton>(
      new ButtonState<CustomButton>(world.clock),
      {
        keyboard: {
          ArrowUp: [
            { button: CustomButton.Foo },
            { button: CustomButton.Bar, shift: true },
            { button: CustomButton.Baz, ctrl: true, alt: true },
          ],
        },
      },
    )
    const event = {
      code: "ArrowUp",
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
    }

    expect(source.state.isPressed(CustomButton.Foo)).toBe(false)
    expect(source.state.isPressed(CustomButton.Bar)).toBe(false)
    expect(source.state.isPressed(CustomButton.Baz)).toBe(false)

    // Press Foo (up).
    expect(source.captureKeyboardEvent(event)).toBe(true)
    world.clock.tick(100)

    expect(source.state.isPressed(CustomButton.Foo)).toBe(true)
    expect(source.state.isPressed(CustomButton.Bar)).toBe(false)
    expect(source.state.isPressed(CustomButton.Baz)).toBe(false)

    // Release Foo.
    expect(source.releaseKeyboardEvent(event)).toBe(true)
    world.clock.tick(200)

    expect(source.state.isPressed(CustomButton.Foo)).toBe(false)
    expect(source.state.isPressed(CustomButton.Bar)).toBe(false)
    expect(source.state.isPressed(CustomButton.Baz)).toBe(false)

    // Press Bar (shift + up).
    expect(source.captureKeyboardEvent({ ...event, shiftKey: true })).toBe(true)
    world.clock.tick(300)

    expect(source.state.isPressed(CustomButton.Foo)).toBe(false)
    expect(source.state.isPressed(CustomButton.Bar)).toBe(true)
    expect(source.state.isPressed(CustomButton.Baz)).toBe(false)

    // Release Bar and press Baz (ctrl + alt + up).
    expect(source.releaseKeyboardEvent({ ...event, shiftKey: true })).toBe(true)
    expect(
      source.captureKeyboardEvent({ ...event, ctrlKey: true, altKey: true }),
    ).toBe(true)
    world.clock.tick(400)

    expect(source.state.isPressed(CustomButton.Foo)).toBe(false)
    expect(source.state.isPressed(CustomButton.Bar)).toBe(false)
    expect(source.state.isPressed(CustomButton.Baz)).toBe(true)

    // Release Baz and press an unused combo (shift + ctrl + up).
    expect(
      source.releaseKeyboardEvent({ ...event, ctrlKey: true, altKey: true }),
    ).toBe(true)
    expect(
      source.captureKeyboardEvent({ ...event, shiftKey: true, ctrlKey: true }),
    ).toBe(false)
    world.clock.tick(500)

    expect(source.state.isPressed(CustomButton.Foo)).toBe(false)
    expect(source.state.isPressed(CustomButton.Bar)).toBe(false)
    expect(source.state.isPressed(CustomButton.Baz)).toBe(false)

    // Release the unused combo.
    expect(
      source.releaseKeyboardEvent({ ...event, shiftKey: true, ctrlKey: true }),
    ).toBe(false)
    world.clock.tick(600)

    expect(source.state.isPressed(CustomButton.Foo)).toBe(false)
    expect(source.state.isPressed(CustomButton.Bar)).toBe(false)
    expect(source.state.isPressed(CustomButton.Baz)).toBe(false)
  })
})
