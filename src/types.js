/* @flow */

export type Unit =
  | '%'
  | 'ch'
  | 'cm'
  | 'deg'
  | 'em'
  | 'ex'
  | 'in'
  | 'mm'
  | 'pc'
  | 'pt'
  | 'px'
  | 'rad'
  | 'rem'
  | 'turn'
  | 'vh'
  | 'vmax'
  | 'vmin'
  | 'vw'

export type Prop =
  | 'translateX'
  | 'translateY'
  | 'translateZ'
  | 'rotate'
  | 'rotateX'
  | 'rotateY'
  | 'rotateZ'
  | 'scale'
  | 'scaleX'
  | 'scaleY'
  | 'scaleZ'
  | 'skewX'
  | 'skewY'
  | 'perspective'
  | 'width'
  | 'height'
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'value'

export type Time = number

type Noop = () => void

export type RawValue = string | number

type RawTarget = string | HTMLElement | Object

type SimpleTransformDefinition = RawValue

type ComplexTransformDefinition = {
  delay?: Time | (() => Time),
  duration?: Time | (() => Time),
  easing?: string,
  from?: RawValue | (() => RawValue),
  to: RawValue | (() => RawValue),
}

type TransformDefinition =
  | SimpleTransformDefinition
  | ComplexTransformDefinition
  | Array<ComplexTransformDefinition>

export type TransformDefinitions = {
  [name: string]: TransformDefinition,
}

export type AnimationDefinition = {
  delay?: Time | (() => Time),
  duration?: Time | (() => Time),
  easing?: string,
  onComplete?: Noop,
  onStart?: Noop,
  onUpdate?: Noop,
  target: RawTarget,
  transform: TransformDefinitions,
}

export type Value = {
  number: number,
  unit?: Unit,
}

export type Values = {
  [prop: Prop]: Value,
}

type Tween = {
  complete: boolean,
  currentValue?: number,
  delay: Time,
  diff: number,
  duration: Time,
  easing?: string,
  from: number,
  to: number,
  unit: Unit,
}

export type Tweens = {
  [prop: Prop]: Array<Tween>,
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

export type AnimationState = {
  complete: boolean,
  fullDuration: Time,
  startTime: Time,
  target: ResolvedTarget,
  tweens: Tweens,
}

export type Transform = {
  delay: Time | (() => Time),
  duration: Time | (() => Time),
  easing?: string,
  from?: RawValue | (() => RawValue),
  to: RawValue | (() => RawValue),
}

export type Transforms = {
  [prop: Prop]: Array<Transform>,
}

export type Animation = {
  absoluteOffset?: Time,
  easing: string,
  onComplete?: Noop,
  onStart?: Noop,
  onUpdate?: Noop,
  relativeOffset?: Time,
  state: AnimationState | null,
  target: RawTarget,
  transform: Transforms,
}
