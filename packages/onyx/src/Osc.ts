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
      {
        name: "vibrato", // value of 1 gives +/- 1 semitone of depth
        defaultValue: 0,
        minValue: -120,
        maxValue: 120,
        automationRate: "a-rate",
      },
      {
        name: "vibratoFreq",
        defaultValue: 5,
        minValue: 0,
        maxValue: 200,
        automationRate: "a-rate",
      },
    ]
  }

  private travel = 0
  private priorGain = 0
  private priorTimbre = 0

  private vibratoTravel = 0
  private priorVibratoAmount = 0

  process(
    inputs: [[]],
    outputs: [[Float32Array]],
    params: {
      freq: Float32Array
      gain: Float32Array
      timbre: Float32Array
      vibrato: Float32Array
      vibratoFreq: Float32Array
    },
  ): boolean {
    const channel = outputs[0][0]
    const inverseSampleRate = 1 / 44100
    const cls = OscAudioWorkletProcessor

    for (let i = 0; i < channel.length; i++) {
      let freq = params.freq[i] ?? params.freq[0]!
      let gain = params.gain[i] ?? this.priorGain
      let timbre = params.timbre[i] ?? this.priorTimbre
      let vibratoAmount = params.vibrato[i] ?? this.priorVibratoAmount
      const vibratoFreq = params.vibratoFreq[i] ?? params.vibratoFreq[0]!

      // Coming from a gain of zero resets the waveform and vibrato travel.
      // This prevents a click when the gain is increased from zero to nonzero.
      if (this.priorGain === 0) {
        this.travel = 1
        this.vibratoTravel = 1
      }

      // Travel forward in the vibrato cycle, based on the vibrato frequency.
      this.vibratoTravel += inverseSampleRate * vibratoFreq
      if (this.vibratoTravel <= 1) {
        // Prevent changes in vibrato amount when in the midst of a cycle,
        // avoiding clicks or other artifacts due to sudden changes.
        vibratoAmount = this.priorVibratoAmount
      } else {
        // Keep between zero and one (for easily calculating a waveform).
        while (this.vibratoTravel > 1) {
          this.vibratoTravel -= 1
        }
      }
      const { vibratoTravel } = this

      // Apply vibrato to the frequency.
      const vibratoTimbre = 1.0 // triangle // TODO: configurable
      freq *= cls.semitonesToRatio(
        vibratoAmount * cls.waveform(vibratoTravel, vibratoTimbre),
      )

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

      // Emit a waveform sample, scaled by the gain.
      channel[i] = cls.waveform(travel, timbre) * gain

      // Remember the gain and timbre for the next sample.
      this.priorGain = gain
      this.priorTimbre = timbre
      this.priorVibratoAmount = vibratoAmount
    }

    return true
  }

  static semitonesToRatio(semitones: number): number {
    return Math.pow(2, semitones / 12)
  }

  static waveform(travel: number, timbre: number): number {
    if (timbre === 0) {
      // Sine wave
      return Math.sin(travel * 2 * Math.PI)
    } else if (timbre === 1) {
      // Triangle wave
      return travel <= 0.25
        ? travel * 4
        : travel <= 0.75
          ? 2 - travel * 4
          : travel * 4 - 4
    } else if (timbre === 2) {
      // Sawtooth wave
      return 1 - travel * 2
    } else if (timbre < 1) {
      // Between Sine wave and Triangle wave
      const sine = Math.sin(travel * 2 * Math.PI)
      const triangle =
        travel <= 0.25
          ? travel * 4
          : travel <= 0.75
            ? 2 - travel * 4
            : travel * 4 - 4
      return (1 - timbre) * sine + timbre * triangle
    } else if (timbre < 2) {
      // Between Triangle wave and Sawtooth wave
      const toothStart = timbre * -0.25 + 0.5
      const upSlope = 1 / toothStart
      const downSlope = 2 / (1 - toothStart * 2)
      return travel <= toothStart
        ? travel * upSlope
        : travel < 1 - toothStart
          ? 1 - (travel - toothStart) * downSlope
          : (travel - 1) * upSlope
    } else if (timbre < 3) {
      // Between Sawtooth wave and Square wave
      const sawtooth = 1 - travel * 2
      const square = travel <= 0.5 ? 1 : -1
      return (3 - timbre) * sawtooth + (timbre - 2) * square
    } else if (timbre <= 4) {
      // Square/Pulse wave
      // The duty cycle is:
      // - 50% at timbre 3.0
      // - 25% at timbre 3.5
      // - 12.5% at timbre 4.0
      const dutyCycle = 0.5 * Math.pow(0.25, timbre - 3)
      return travel <= dutyCycle ? 1 : -1
    }

    // Invalid timbre: you get silence
    return 0
  }
}

export const OscAudioWorkletNodeFactory = makeAudioWorkletNodeFactory(
  OscAudioWorkletProcessor,
)
