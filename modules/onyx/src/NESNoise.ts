import {
  AudioParamDescriptor,
  AudioWorkletProcessor as AudioWorkletProcessorBase,
  makeAudioWorkletNodeFactory,
} from "./AudioWorklet"

// TODO: avoid this hack
abstract class AudioWorkletProcessor extends AudioWorkletProcessorBase {}

export class NESNoiseProcessor extends AudioWorkletProcessor {
  static readonly nodeOptions: AudioWorkletNodeOptions = {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [1],
  }

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      {
        name: "freq",
        defaultValue: 440,
        minValue: 0,
        maxValue: 20000,
        automationRate: "a-rate",
      },
      {
        name: "gain",
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: "a-rate",
      },
      {
        name: "timbre",
        defaultValue: 4,
        minValue: 0,
        maxValue: 4,
        automationRate: "a-rate",
      },
    ]
  }
  private travel = 0
  private shiftRegister = 1
  private inverseSampleRate = ((1 / 44100) * (447443.2 / 4811.2)) / 8

  process(
    inputs: [[]],
    outputs: [[Float32Array]],
    params: { freq: Float32Array; gain: Float32Array; timbre: Float32Array },
  ): boolean {
    const channel = outputs[0][0]

    for (let i = 0; i < channel.length; i++) {
      const freq = params.freq[i] ?? params.freq[0]!
      const gain = params.gain[i] ?? params.gain[0]!
      const timbre = params.timbre[i] ?? params.timbre[0]!
      const feedbackShift = Math.floor(timbre) + 1

      this.travel += this.inverseSampleRate * freq
      while (this.travel > 1) {
        this.travel -= 1

        const bit0 = (this.shiftRegister & 1) > 0
        const bit1Or6 = ((this.shiftRegister >> feedbackShift) & 1) > 0
        const newBit = bit0 !== bit1Or6
        this.shiftRegister =
          (this.shiftRegister >> 1) | ((newBit ? 0 : 1) << 14)
      }

      const sample = (this.shiftRegister & 1) * 2 - 1

      channel[i] = sample * gain
    }

    return true
  }
}

// // See https://wiki.nesdev.com/w/index.php/APU_Noise
// function nesNoiseWaveShapeGen(mode6: boolean) {
//   const waveShape = new Float32Array(mode6 ? 93 : 3276)
//   let shiftRegister = 1
//   for (let i = 0; i < 93; i++) {
//     const bit0 = shiftRegister & 1
//     const bit1Or6 = mode6 ? (shiftRegister >> 6) & 1 : (shiftRegister >> 1) & 1
//     const newBit = bit0 ^ bit1Or6
//     waveShape[i] = newBit ? 1 : -1
//     shiftRegister = (shiftRegister >> 1) | (newBit ? 0 : 1 << 14)
//   }
//   return waveShape
// }
// const nesNoiseWaveShape93 = nesNoiseWaveShapeGen(true)
// const nesNoiseWaveShape32767 = nesNoiseWaveShapeGen(false)

export const NESNoise = makeAudioWorkletNodeFactory(NESNoiseProcessor)
