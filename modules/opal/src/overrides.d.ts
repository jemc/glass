// Ask TypeScript to let us load shader modules as text (code).
declare module "*.glsl" {
  const value: string
  export = value
}
