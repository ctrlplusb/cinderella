/* @flow */

export type DOMTarget = {
  type: 'dom',
  actual: HTMLElement,
}
export type ObjectTarget = {
  type: 'object',
  actual: Object,
}
export type ResolvedTarget = DOMTarget | ObjectTarget
export type Unit = string
export type Prop = string
export type Time = number
export type Noop = () => void
export type RawValue = string | number
export type RawTarget = string | HTMLElement | Object
export type DOMValueType = 'dom-css-transform' | 'dom-css' | 'dom-attribute'
export type ValueType = 'object' | DOMValueType
export type EasingFn = (t: number, b: number, c: number, d: number) => number

export type TimeResolver = (
  target?: ResolvedTarget,
  index?: number,
  targetCount?: number,
) => Time

export type RawValueResolver = (
  target?: ResolvedTarget,
  index?: number,
  targetCount?: number,
) => RawValue

export type EasingResolver = (
  target?: ResolvedTarget,
  index?: number,
  targetCount?: number,
) => string

export type TweenDefinition = {
  delay?: Time | TimeResolver,
  duration?: Time | TimeResolver,
  easing?: string | EasingResolver,
  from?: RawValue | RawValueResolver,
  to?: RawValue | RawValueResolver,
}

export type AnimationDefinition = {
  delay?: Time | (() => Time),
  easing?: string,
  onComplete?: Noop,
  onStart?: Noop,
  onUpdate?: Noop,
  targets: RawTarget | Array<RawTarget>,
  transform: { [prop: Prop]: TweenDefinition | Array<TweenDefinition> },
  transformDefaults?: TweenDefinition,
}

export type Value = {
  number: number,
  unit?: Unit,
  originType: 'number' | 'string',
  type: ValueType,
}

export type Values = {
  [prop: Prop]: Value,
}

export type KeyFrame = {
  bufferedFromNumber?: number,
  bufferedDiff?: number,
  complete: boolean,
  currentVal?: number,
  delay: Time,
  diff?: number,
  duration: Time,
  easing?: string,
  from?: RawValue | RawValueResolver,
  fromValue?: Value,
  prevFramesFullDuration?: Time,
  runDuration?: Time,
  startTime?: Time,
  to: RawValue | RawValueResolver,
  toValue?: Value,
}

export type Tween = {
  fullDuration: number,
  keyframes: Array<KeyFrame>,
}

export type TargetTweens = {
  resolvedTarget: ResolvedTarget,
  propTweens: { [propName: Prop]: Tween },
  fullDuration: number,
}

export type KeyFrameDefinition = {
  delay: Time | TimeResolver,
  duration: Time | TimeResolver,
  easing?: string | EasingResolver,
  from?: RawValue | RawValueResolver,
  to: RawValue | RawValueResolver,
}

export type PropKeyFrameDefinitions = {
  [prop: Prop]: Array<KeyFrameDefinition>,
}

export type Animation = {
  absoluteOffset?: Time,
  complete: boolean,
  delay: Time | (() => Time),
  delayValue?: Time,
  fullDuration?: Time, // excluding the delay on the animation itself
  easing: string,
  executionOffset?: Time,
  onComplete?: Noop,
  onStart?: Noop,
  onUpdate?: Noop,
  relativeOffset?: Time,
  startTime?: Time,
  targets: RawTarget | Array<RawTarget>,
  transform: PropKeyFrameDefinitions,
  targetsTweens?: Array<TargetTweens>,
}

export type TimelineConfig = {
  loop?: boolean,
  onComplete?: Noop,
  onStart?: Noop,
}

export type Timeline = {
  animations: Array<Animation | Timeline>,
  complete: boolean,
  config: TimelineConfig,
  executionTime?: Time,
  id: number,
  initializedAnimations: boolean,
  paused: boolean,
  prevTime?: Time,
  startTime?: Time,
}

export type TimelineQueue = {
  [id: string]: Timeline,
}

export type TimelineAPI = {
  add: AnimationDefinition => TimelineAPI,
  play: (config?: TimelineConfig) => TimelineAPI,
  pause: () => TimelineAPI,
  stop: () => TimelineAPI,
}

export type Cinderella = (config?: TimelineConfig) => TimelineAPI
