/* @flow */
/* eslint-disable no-use-before-define */

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
  target?: HTMLElement | Object,
  index?: number,
  targetCount?: number,
) => Time

export type RawValueResolver = (
  target?: HTMLElement | Object,
  index?: number,
  targetCount?: number,
) => RawValue

export type EasingResolver = (
  target?: HTMLElement | Object,
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
  propOrder: number,
  value: Value,
}

export type Update = {
  progress: number,
}

export type OnUpdate = Update => void

export type TimelineConfig = {
  direction?: 'normal' | 'reverse' | 'alternate',
  loop?: boolean | number,
  onComplete?: Noop,
  onUpdate?: OnUpdate,
  onStart?: Noop,
  speed?: number,
}

export type ResolvedTimelineConfig = {
  direction: 'normal' | 'reverse' | 'alternate',
  loop: boolean | number,
  onComplete?: Noop,
  onUpdate?: OnUpdate,
  onStart?: Noop,
  speed: number,
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
  propOrder: number,
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

export type PlayState = {
  onComplete?: Noop,
  promise?: Promise<TimelineAPI>,
}

export type Timeline = {
  animations: {
    [id: string]: Animation,
  },
  complete: boolean,
  config: ResolvedTimelineConfig,
  definitions: Array<AnimationDefinition>,
  endTime: number,
  executionTime?: Time,
  id: number,
  initialized: boolean,
  loopIndex?: number,
  paused: boolean,
  playState: PlayState,
  reverse: boolean,
  reversed?: Array<Tween>,
  seek?: Time,
  startTime?: Time,
  targets: {
    [id: string]: {
      target: Target,
      idx: number,
      length: number,
    },
  },
  tweens: Array<Tween>,
  unpause: boolean,
}

export type TimelineQueue = {
  [id: string]: Timeline,
}

export type TimelineAPI = {
  add: AnimationDefinition => TimelineAPI,
  play: (onComplete?: Noop) => Promise<TimelineAPI>,
  pause: () => TimelineAPI,
  seek: number => TimelineAPI,
  seekTime: number => TimelineAPI,
  stop: () => TimelineAPI,
}

export type Cinderella = (config?: TimelineConfig) => TimelineAPI
