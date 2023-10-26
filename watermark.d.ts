export interface WatermarkOptions {
  container?: HTMLElement
  width?: number
  height?: number
  font?: string
  fillStyle?: string
  content?: string
  rotate?: number
  zIndex?: number
  targetClass?: string
}

export default class Watermark {
  static _instance: Watermark
  options: WatermarkOptions
  watermarkDiv?: HTMLElement
  constructor(options?: WatermarkOptions)
  paint(options?: string | WatermarkOptions): void
  destroy(): void
  static getInstance(options?: WatermarkOptions): Watermark
}
