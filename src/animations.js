/* @flow */
/* eslint-disable no-param-reassign */

import type {
  AnimationDefinition,
  Time,
  Animation,
  ResolvedTarget,
  Tweens,
  Prop,
} from './types'
import * as Easings from './easings'

const relativeOffsetRegex = /^([+-]=)([0-9]+)$/

const resolveRelativeOffset = offset => {
  const match = relativeOffsetRegex.exec(offset)
  if (!match) {
    return undefined
  }
  const operator = match[1]
  const offsetValue = match[2]
  if (operator === '-=') {
    return offsetValue * -1
  }
  return offsetValue
}

const resolveTarget = (animation: Animation): ResolvedTarget => {
  const { target } = animation
  if (typeof target === 'string') {
    const el = document.querySelector(target)
    if (!el) {
      throw new Error(`Could not resolve target "${target}"`)
    }
    return {
      type: 'dom',
      actual: el,
    }
  } else if (target instanceof HTMLElement) {
    return {
      type: 'dom',
      actual: target,
    }
  } else if (typeof target === 'object') {
    return {
      type: 'object',
      actual: target,
    }
  }
  throw new Error(`Invalid target: ${target}`)
}

const initialiseAnimationState = (animation: Animation, time: Time) => {
  /*
    Object.keys(transform).reduce((acc, cur) => {
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
        state: null,
        result: {},
      }
      acc[cur] = initializedTween
      return acc
    }, {}),
    */

  const target = resolveTarget(animation)
  // const targetValues = resolveTargetInitialValues(target, animation.transform)

  const props: Array<Prop> = Object.keys(animation.transform)

  const tweens: Tweens = props.reduce((acc, propName) => {
    const definition = animation.transform[propName]
    const initialValue =
      definition.initialValue != null
        ? extractValue(definition.initialValue)
        : getValueFromTarget()
    return acc
  }, {})

  let fullDuration = 0

  props.forEach(prop => {
    tweens[prop].forEach(({ delay, duration }) => {
      const tweenDuration = delay + duration
      fullDuration = tweenDuration > fullDuration ? tweenDuration : fullDuration
    })
  })

  animation.state = {
    complete: false,
    fullDuration,
    startTime: time,
    target,
    tweens,
  }
}

export const process = (animation: Animation, time: Time) => {
  if (animation.state == null) {
    initialiseAnimationState(animation, time)
    if (animation.onStart != null) {
      animation.onStart()
    }
  }

  const { state } = animation
  if (state == null) throw new Error('💩')
  // TODO: Resolve target
  // resolveTargetAndSourceValues(animation)
  // state.targetType =
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
    */ tween.state.toValue =
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
export const initialize = (definition: AnimationDefinition): Animation => {
  const mapTransformDefinition = transformDefinition => ({
    delay: transformDefinition.delay || definition.delay || 0,
    duration: transformDefinition.duration || definition.duration || 0,
    easing: transformDefinition.easing,
    from: transformDefinition.from,
    to: transformDefinition.to,
  })
  return {
    absoluteOffset:
      typeof definition.offset === 'number' ? definition.offset : undefined,
    easing: definition.easing || 'linear',
    onComplete: definition.onComplete,
    onStart: definition.onStart,
    onUpdate: definition.onUpdate,
    relativeOffset:
      typeof definition.offset === 'string'
        ? resolveRelativeOffset(definition.offset)
        : undefined,
    state: null,
    target: definition.target,
    transform: Object.keys(definition.transform).reduce(
      (transforms, propName) => {
        const transformDefinition = definition.transform[propName]
        if (typeof transformDefinition === 'string') {
          transforms[propName] = [
            {
              delay: definition.delay || 0,
              duration: definition.duration || 0,
              to: transformDefinition,
            },
          ]
        } else if (Array.isArray(transformDefinition)) {
          transforms[propName] = transformDefinition.map(mapTransformDefinition)
        } else if (typeof transformDefinition === 'object') {
          transforms[propName] = [mapTransformDefinition(transformDefinition)]
        }
        return transforms
      },
      {},
    ),
  }
}
