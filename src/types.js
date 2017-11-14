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
export type TweenTimeResolver = (
  target?: ResolvedTarget,
  index?: number,
  targetCount?: number,
) => Time
export type TweenRawValueResolver = (
  target?: ResolvedTarget,
  index?: number,
  targetCount?: number,
) => RawValue
export type TweenEasingResolver = (
  target?: ResolvedTarget,
  index?: number,
  targetCount?: number,
) => string

export type TweenDefinition = {
  delay?: Time | TweenTimeResolver,
  duration?: Time | TweenTimeResolver,
  easing?: string | TweenEasingResolver,
  from?: RawValue | TweenRawValueResolver,
  to?: RawValue | TweenRawValueResolver,
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

export type Tween = {
  bufferedFromNumber: Array<number | void>,
  bufferedDiff: Array<number | void>,
  complete: boolean,
  currentNumber?: number,
  delay: Array<Time>,
  diff: Array<number | void>,
  duration: Array<Time>,
  easing: Array<string | void>,
  from: RawValue | TweenRawValueResolver,
  fromValues: Array<Value | void>,
  startTime: Time,
  to: RawValue | TweenRawValueResolver,
  toValues: Array<Value | void>,
}

export type Animation = {
  absoluteOffset?: Time,
  complete: boolean,
  delay: Time | (() => Time),
  delayValue?: Time,
  easing: string,
  executionOffset?: Time,
  longestTweenDuration?: Time,
  onComplete?: Noop,
  onStart?: Noop,
  onUpdate?: Noop,
  relativeOffset?: Time,
  resolvedTargets?: Array<ResolvedTarget>,
  startTime?: Time,
  targets: RawTarget | Array<RawTarget>,
  transform: { [prop: Prop]: Array<TweenDefinition> },
  tweens?: { [prop: Prop]: Array<Tween> },
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
