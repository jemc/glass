import { registerComponent } from "./Component"
import { Clock } from "./Clock"

// These are the standard buttons that a retro-style game might have.
//
// If there are more buttons that are commonly needed, we can add them here.
//
// However, if you need a different set of buttons specific to your use case,
// you can define your own enum and use a `ButtonSource<MySpecificButtons>`.
export enum Button {
  Start,
  Select,
  Up,
  Down,
  Left,
  Right,
  A,
  B,
  X,
  Y,
  // (add more common ones here, as needed)
}

// Track the current set of buttons that are pressed, including the frame
// at which they were initially pressed.
export class ButtonState<T extends number = Button> {
  private pressedAt = new Array<number>()

  constructor(private clock: Clock) {}

  // Mark the given button as pressed, marked with the frame number
  // of the next/upcoming clock frame.
  //
  // This should usually be called only by a ButtonSource, not directly.
  // Though it may be useful in tests for simulating button presses.
  // Just know that you may get weirdness if you don't tick the clock afterward.
  capture(button: T) {
    if (this.pressedAt[button] !== undefined) return
    this.pressedAt[button] = this.clock.frame + 1
  }

  // Mark the given button as being released (i.e. clear its state).
  release(button: T) {
    delete this.pressedAt[button]
  }

  // Check if the given button is currently pressed.
  isPressed(button: T) {
    return this.pressedAt[button] !== undefined
  }

  // Check if the given button was newly pressed in the current frame.
  isPressedJustNow(button: T) {
    return this.pressedAt[button] === this.clock.frame
  }
}

// A component that captures button presses/releases into a `ButtonState`.
//
// If you have a custom set of buttons, you can supply that as a type parameter,
// otherwise it will use the standard set of buttons defined in `Button`.
export class ButtonSource<T extends number = Button> {
  static readonly componentId = registerComponent(this)

  // Create a new button source, which will capture button presses/releases
  // into the given `state`, according to the given `config`.
  //
  // The `config` defines how to map keyboard events into button presses.
  // You can use `ButtonSourceConfig.Default` as a starting point.
  constructor(
    readonly state: ButtonState<T>,
    readonly config: ButtonSourceConfig<T>,
  ) {}

  // Listen to events from the given event target.
  listenTo(target: Pick<EventTarget, "addEventListener">) {
    target.addEventListener("keydown", (e) => {
      const event = e as KeyboardEvent
      if (this.captureKeyboardEvent(event)) e.preventDefault()
    })

    target.addEventListener("keyup", (e) => {
      const event = e as KeyboardEvent
      if (this.releaseKeyboardEvent(event)) e.preventDefault()
    })
  }

  // Look at the given keyboard `event` and potentially capture a button press,
  // if the given `event` matches a configured button.
  captureKeyboardEvent(
    event: Pick<KeyboardEvent, "code" | "altKey" | "ctrlKey" | "shiftKey">,
  ) {
    const buttonConfigs = this.config.keyboard[event.code]
    if (!buttonConfigs) return false

    // Trigger the first matching button configuration, if any.
    // Return true if a button was captured, false otherwise.

    return (
      undefined !==
      buttonConfigs.find((buttonConfig) => {
        if (!buttonConfig.ignoreModifiers) {
          if (event.altKey != !!buttonConfig.alt) return false
          if (event.ctrlKey != !!buttonConfig.ctrl) return false
          if (event.shiftKey != !!buttonConfig.shift) return false
        }

        this.state.capture(buttonConfig.button)
        return true
      })
    )
  }

  // Look at the given keyboard `event` and potentially release a button,
  // if the given `event` matches a configured button.
  releaseKeyboardEvent(
    event: Pick<KeyboardEvent, "code" | "altKey" | "ctrlKey" | "shiftKey">,
  ) {
    const buttonConfigs = this.config.keyboard[event.code]
    if (!buttonConfigs) return

    let somethingReleased = false
    for (const buttonConfig of buttonConfigs) {
      // TODO: Should we check modifiers here too? Need to think it through...

      if (this.state.isPressed(buttonConfig.button)) {
        this.state.release(buttonConfig.button)
        somethingReleased = true
      }
    }

    return somethingReleased
  }
}

export interface ButtonSourceConfig<T extends number = Button> {
  keyboard: {
    [eventCode: string]: {
      button: T
      ignoreModifiers?: boolean
      shift?: boolean
      ctrl?: boolean
      alt?: boolean
    }[]
  }
}

export const ButtonSourceConfig: { Default: ButtonSourceConfig } = {
  Default: {
    keyboard: {
      Enter: [{ button: Button.Start }],
      RightShift: [{ button: Button.Select }],

      ArrowUp: [{ button: Button.Up }],
      ArrowDown: [{ button: Button.Down }],
      ArrowLeft: [{ button: Button.Left }],
      ArrowRight: [{ button: Button.Right }],

      KeyW: [{ button: Button.Up }],
      KeyA: [{ button: Button.Left }],
      KeyS: [{ button: Button.Down }],
      KeyD: [{ button: Button.Right }],

      KeyZ: [{ button: Button.A }],
      KeyX: [{ button: Button.B }],
      KeyC: [{ button: Button.X }],
      KeyV: [{ button: Button.Y }],

      ControlRight: [{ button: Button.A }],
      AltRight: [{ button: Button.B }],
    },
  },
}
