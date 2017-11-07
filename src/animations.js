/* @flow */
/* eslint-disable no-param-reassign */

import * as Easings from './easings'

type Time = number

type TransformState = {|
  fromValue?: number,
  toValue?: number,
  diff?: number,
  complete?: boolean,
|}

type Transform = {
  value: number | (() => number),
  delay: number,
  duration: number,
  easing?: string,
  state: TransformState,
}

type AnimationState = {|
  complete?: boolean,
  startTime?: Time,
  fullDuration?: Time,
|}

type Animation = {|
  delay: number,
  duration: number,
  easing: string,
  target: Object,
  transform: { [name: string]: Transform },
  onUpdate?: () => void,
  onStart?: () => void,
  onComplete?: () => void,
  state: AnimationState,
|}

export const initialize = ({
  target = {},
  delay = 0,
  duration = 0,
  transform = {},
  easing = 'linear',
  onUpdate = () => undefined,
  ...rest
}): Animation => {
  const animation = {
    target,
    delay,
    duration,
    easing,
    onUpdate,
    transform: Object.keys(transform).reduce((acc, cur) => {
      const tween =
        typeof transform[cur] === 'object'
          ? transform[cur]
          : {
              value: transform[cur],
            }
      const initializedTween = {
        value: tween.value,
        duration: tween.duration != null ? tween.duration : duration,
        delay: tween.delay != null ? tween.delay : delay,
        state: {},
        result: {},
      }
      acc[cur] = initializedTween
      return acc
    }, {}),
    state: {},
    ...rest,
  }
  if (typeof animation.offset === 'number') {
    animation.absoluteOffset = animation.offset
  } else if (
    typeof animation.offset === 'string' &&
    animation.offset.length > 3
  ) {
    const operator = animation.offset.substr(0, 2)
    const offsetValue = parseInt(animation.offset.substr(2), 10)
    if (operator === '-=') {
      animation.relativeOffset = offsetValue * -1
    } else if (operator === '+=') {
      animation.relativeOffset = offsetValue
    }
  }
  return animation
}

export const process = (animation: Animation, time: Time) => {
  const { state } = animation

  if (state.startTime == null && animation.onStart != null) {
    animation.onStart()
  }

  state.startTime = state.startTime != null ? state.startTime : time

  const transformPropNames = Object.keys(animation.transform)

  if (state.fullDuration == null) {
    state.fullDuration = animation.duration + animation.delay
    transformPropNames.forEach(propName => {
      const transform = animation.transform[propName]
      const transformFullDuration = transform.duration + transform.delay
      state.fullDuration =
        transformFullDuration > (state.fullDuration || 0)
          ? transformFullDuration
          : state.fullDuration
    })
  }

  state.complete = time >= state.startTime + state.fullDuration

  const timePassed = time - state.startTime

  const values = transformPropNames.reduce((acc, propName) => {
    const tween = animation.transform[propName]
    let value

    if (timePassed < tween.delay) {
      value = undefined
    } else {
      // TODO: Resolve the "fromValue" from various source types.
      tween.state.fromValue =
        tween.state.fromValue != null
          ? tween.state.fromValue
          : typeof animation.target === 'object'
            ? animation.target[propName] || 0
            : 0
      /*
    transform.state.fromValue =
      transform.state.fromValue != null
        ? transform.state.fromValue
        : typeof transform.from === 'function'
          ? transform.from()
          : transform.from
    */

      tween.state.toValue =
        tween.state.toValue != null
          ? tween.state.toValue
          : typeof tween.value === 'function' ? tween.value() : tween.value

      tween.state.diff =
        tween.state.diff != null
          ? tween.state.diff
          : tween.state.toValue - tween.state.fromValue

      if (
        tween.duration !== animation.duration &&
        tween.delay !== animation.delay &&
        tween.state.bufferedFromValue == null
      ) {
        // The below normalises our values so we can resolve a value that will
        // be correctly relative to the easing function that is being applied
        // across all of the values.
        const animDurPerc = state.fullDuration / 100
        const postRunDuration =
          state.fullDuration - tween.duration - tween.delay

        const prePercentage = tween.delay / animDurPerc
        const runPercentage = tween.duration / animDurPerc
        const postPercentage =
          postRunDuration > 0.001 ? postRunDuration / animDurPerc : 0

        const val = Math.abs(tween.state.diff) / runPercentage
        const beforeBuffer = prePercentage * val
        const postBuffer = postPercentage * val

        tween.state.bufferedFromValue = tween.state.fromValue - beforeBuffer
        tween.state.bufferedDiff =
          tween.toValue + postBuffer - tween.state.fromValue
      }

      if (timePassed > tween.duration + tween.delay) {
        tween.state.complete = true
        value = tween.state.toValue
      } else {
        value = Easings[animation.easing](
          timePassed,
          tween.state.bufferedFromValue != null
            ? tween.state.bufferedFromValue
            : tween.state.fromValue,
          tween.state.bufferedDiff != null
            ? tween.state.bufferedDiff
            : tween.state.diff,
          state.fullDuration,
        )
      }
    }
    acc[propName] = value
    return acc
  }, {})

  // TODO: Stuff with the values
  Object.keys(values).forEach(propName => {
    if (typeof animation.target === 'object' && values[propName] != null) {
      animation.target[propName] = values[propName]
    }
  })

  if (animation.onUpdate) {
    animation.onUpdate()
  }

  if (state.complete && animation.onComplete) {
    animation.onComplete()
  }
}
