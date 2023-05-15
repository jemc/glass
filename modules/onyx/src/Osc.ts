import {
  AudioParamDescriptor,
  AudioWorkletProcessor as AudioWorkletProcessorBase,
  makeAudioWorkletNodeFactory,
} from "./AudioWorklet"

// TODO: avoid this hack (currently necessary due to source code stringifying)
abstract class AudioWorkletProcessor extends AudioWorkletProcessorBase {}

export class OscAudioWorkletProcessor extends AudioWorkletProcessor {
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
  private priorGain = 0
  private priorTimbre = 0

  process(
    inputs: [[]],
    outputs: [[Float32Array]],
    params: { freq: Float32Array; gain: Float32Array; timbre: Float32Array },
  ): boolean {
    const channel = outputs[0][0]
    const inverseSampleRate = 1 / 44100

    for (let i = 0; i < channel.length; i++) {
      const freq = params.freq[i] ?? params.freq[0]!
      let gain = params.gain[i] ?? this.priorGain
      let timbre = params.timbre[i] ?? this.priorTimbre

      // Coming from a gain of zero resets the waveform travel.
      // This prevents a click when the gain is increased from zero to nonzero.
      if (this.priorGain === 0) {
        this.travel = 1
      }

      // Travel forward in the waveform, based on the desired frequency.
      this.travel += inverseSampleRate * freq
      if (this.travel <= 1) {
        // Prevent changes in gain or timbre when in the midst of a cycle,
        // avoiding clicks or other artifacts due to sudden changes.
        gain = this.priorGain
        timbre = this.priorTimbre
      } else {
        // Keep travel between zero and one (for easily calculating a waveform).
        while (this.travel > 1) {
          this.travel -= 1
        }
      }
      const { travel } = this

      // Calculate the waveform sample.
      let sample = 0
      if (timbre === 0) {
        // Sine wave
        sample = Math.sin(travel * 2 * Math.PI)
      } else if (timbre === 1) {
        // Triangle wave
        sample =
          travel <= 0.25
            ? travel * 4
            : travel <= 0.75
              ? 2 - travel * 4
              : travel * 4 - 4
      } else if (timbre === 2) {
        // Sawtooth wave
        sample = 1 - travel * 2
      } else if (timbre < 1) {
        // Between Sine wave and Triangle wave
        const sine = Math.sin(travel * 2 * Math.PI)
        const triangle =
          travel <= 0.25
            ? travel * 4
            : travel <= 0.75
              ? 2 - travel * 4
              : travel * 4 - 4
        sample = (1 - timbre) * sine + timbre * triangle
      } else if (timbre < 2) {
        // Between Triangle wave and Sawtooth wave
        const toothStart = timbre * -0.25 + 0.5
        const upSlope = 1 / toothStart
        const downSlope = 2 / (1 - toothStart * 2)
        sample =
          travel <= toothStart
            ? travel * upSlope
            : travel < 1 - toothStart
              ? 1 - (travel - toothStart) * downSlope
              : (travel - 1) * upSlope
      } else if (timbre < 3) {
        // Between Sawtooth wave and Square wave
        const sawtooth = 1 - travel * 2
        const square = travel <= 0.5 ? 1 : -1
        sample = (3 - timbre) * sawtooth + (timbre - 2) * square
      } else if (timbre <= 4) {
        // Square/Pulse wave
        // The duty cycle is:
        // - 50% at timbre 3.0
        // - 25% at timbre 3.5
        // - 12.5% at timbre 4.0
        const dutyCycle = 0.5 * Math.pow(0.25, timbre - 3)
        sample = this.travel <= dutyCycle ? 1 : -1
      }

      // Emit the sample, scaled by the gain.
      channel[i] = sample * gain

      // Remember the gain and timbre for the next sample.
      this.priorGain = gain
      this.priorTimbre = timbre
    }

    return true
  }
}

export const OscAudioWorkletNodeFactory = makeAudioWorkletNodeFactory(
  OscAudioWorkletProcessor,
)
