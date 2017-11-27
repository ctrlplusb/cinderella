/* @flow */

export type DOMTarget = {
  type: 'dom',
  actual: HTMLElement,
}
export type ObjectTarget = {
  type: 'object',
  actual: Object,
}
export type Unit = string
export type Prop = string
export type Time = number
export type Noop = () => void

export type RawValue = string | number
export type DOMValueType = 'dom-css-transform' | 'dom-css' | 'dom-attribute'
export type ValueType = 'object' | DOMValueType
export type Value = {
  number: number,
  unit?: Unit,
  originType: 'number' | 'string',
  type: ValueType,
}
export type Values = {
  [prop: Prop]: Value,
}

export type EasingFn = (t: number, b: number, c: number, d: number) => number

export type RawTarget = string | HTMLElement | Object
export type TargetResolver = RawTarget | Array<RawTarget>
export type Target = DOMTarget | ObjectTarget

export type TimeResolver = (
  target?: Target,
  index?: number,
  targetCount?: number,
) => Time

export type RawValueResolver = (
  target?: Target,
  index?: number,
  targetCount?: number,
) => RawValue

export type EasingResolver = (
  target?: Target,
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
  delay?: Time,
  onComplete?: Noop,
  onStart?: Noop,
  offset?: number | string,
  targets: TargetResolver,
  transform: {
    [prop: Prop]: TweenDefinition | Array<TweenDefinition>,
  },
  defaults?: TweenDefinition,
}

export type TweenRunValue = {
  targetId: string,
  prop: string,
  value: Value,
}

export type TimelineConfig = {
  loop?: boolean,
  onComplete?: Noop,
  onFrame?: Noop,
  onStart?: Noop,
  speed?: number,
}

export type Tween = {
  animationId: number,
  complete: boolean,
  diff: number,
  delay: Time,
  duration: Time,
  easing: string,
  executionStart: Time,
  executionEnd: Time,
  from: Value,
  name?: string,
  prop: Prop,
  targetId: string,
  to: Value,
}

export type Animation = {
  id: number,
  startTime: Time,
  endTime: Time,
  onComplete?: Noop,
  onStart?: Noop,
}

export type Timeline = {
  animations: {
    [id: string]: Animation,
  },
  complete: boolean,
  config: TimelineConfig,
  definitions: Array<AnimationDefinition>,
  endTime: number,
  executionTime?: Time,
  id: number,
  initializedTweens: boolean,
  paused: boolean,
  prevTime?: Time,
  startTime?: Time,
  targets: {
    [id: string]: {
      target: Target,
      idx: number,
      length: number,
    },
  },
  tweens: Array<Tween>,
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
