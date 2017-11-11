/* @flow */

export type Unit = string
export type Prop = string
export type Time = number
export type Noop = () => void
export type RawValue = string | number
export type RawTarget = string | HTMLElement | Object
export type DOMValueType = 'dom-css-transform' | 'dom-css' | 'dom-attribute'
export type ValueType = 'object' | DOMValueType

export type TweenDefinition = {
  delay?: Time | (() => Time),
  duration?: Time | (() => Time),
  easing?: string,
  from?: RawValue | (() => RawValue),
  to: RawValue | (() => RawValue),
}

export type TweenDefinitions = {
  [prop: Prop]: TweenDefinition | Array<TweenDefinition>,
}

export type AnimationDefinition = {
  delay?: Time | (() => Time),
  easing?: string,
  onComplete?: Noop,
  onStart?: Noop,
  onUpdate?: Noop,
  target: RawTarget,
  transform: TweenDefinitions,
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

type DOMTarget = {
  type: 'dom',
  actual: HTMLElement,
}

type ObjectTarget = {
  type: 'object',
  actual: Object,
}

export type ResolvedTarget = DOMTarget | ObjectTarget

export type Tween = {
  bufferedFromNumber?: number,
  bufferedDiff?: number,
  complete: boolean,
  currentNumber?: number,
  delay: Time,
  diff: number,
  duration: Time,
  easing?: string,
  from: RawValue | (() => RawValue),
  fromValue: Value,
  startTime: Time,
  to: RawValue | (() => RawValue),
  toValue: Value,
}

export type Tweens = {
  [prop: Prop]: Array<Tween>,
}

export type Animation = {
  absoluteOffset?: Time,
  complete: boolean,
  delay: number | (() => number),
  delayValue?: number,
  easing: string,
  fullDuration?: Time,
  onComplete?: Noop,
  onStart?: Noop,
  onUpdate?: Noop,
  relativeOffset?: Time,
  startTime?: Time,
  target: RawTarget,
  resolvedTarget?: ResolvedTarget,
  transform: TweenDefinitions,
  tweens?: Tweens,
}
