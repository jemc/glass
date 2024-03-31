import { Context } from "./Context"

export type AudioWorkletInputs = ReadonlyArray<ReadonlyArray<Float32Array>>
export type AudioWorkletOutputs = ReadonlyArray<Array<Float32Array>>
export type AudioWorkletParameters = { [parameterName: string]: Float32Array }

export type AudioParamDescriptor = {
  name: string
  defaultValue: number
  minValue: number
  maxValue: number
  automationRate: "a-rate" | "k-rate"
}

export abstract class AudioWorkletProcessor {
  static readonly workletOptions: AudioWorkletNodeOptions = {}
  static get parameterDescriptors(): AudioParamDescriptor[] {
    return []
  }

  protected abstract process(
    inputs: AudioWorkletInputs,
    outputs: AudioWorkletOutputs,
    params: AudioWorkletParameters,
  ): boolean
}

export type AudioWorkletProcessorClass = (new () => AudioWorkletProcessor) & {
  workletOptions: AudioWorkletNodeOptions
}

export function makeAudioWorkletNodeFactory(p: AudioWorkletProcessorClass) {
  const url = `data:text/javascript,${encodeURIComponent(
    p.toString(),
  )}; registerProcessor('${p.name}', ${p.name})`

  let promiseByContext = new WeakMap<Context, Promise<void>>()

  const setup = async (ctx: Context) => {
    let promise = promiseByContext.get(ctx)
    if (!promise) {
      promise = ctx.audio.audioWorklet.addModule(url)
      promiseByContext.set(ctx, promise)
    }
    await promise
  }

  Context.setupFns.push(setup)

  return (context: AudioContext) =>
    new AudioWorkletNode(
      context,
      p.name,
      p.workletOptions,
    ) as AudioWorkletNode & {
      parameters: AudioParamMap & {
        get: (name: string) => AudioParam | undefined
      }
    }
}
