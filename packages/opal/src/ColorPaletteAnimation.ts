import { System, World, registerComponent } from "@glass/core"
import { Context } from "./Context"

interface ColorPaletteAnimationConfig {
  readonly name: string
  readonly framesPerStep?: number
  readonly cycles?: number[][]
}

export class ColorPaletteAnimation {
  static readonly componentId = registerComponent(this)

  constructor(readonly config: ColorPaletteAnimationConfig) {}
}

export const ColorPaletteAnimationSystem = (opal: Context) =>
  System.for(opal, [ColorPaletteAnimation], {
    shouldMatchAll: [ColorPaletteAnimation],

    runEach(entity, animation) {
      const { config } = animation

      const palette = opal.colorPalettes.get(config.name)
      if (!palette) return

      const framesPerStep = config.framesPerStep || 1

      if (opal.world.clock.frame % framesPerStep === 0) {
        const { colors } = palette

        const { cycles } = config
        if (cycles) {
          const newColors = [...colors]

          cycles.forEach((indices) => {
            for (let i = 1; i < indices.length; i++) {
              const oldColor = colors[indices[i]!]
              if (oldColor) newColors[indices[i - 1]!] = oldColor
            }
            const firstColor = colors[indices[0]!]
            if (firstColor) newColors[indices[indices.length - 1]!] = firstColor
          })

          palette.colors = newColors
        }
      }
    },
  })
