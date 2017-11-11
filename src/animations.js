/* @flow */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-continue */

import type { Animation, AnimationDefinition, Prop, Time, Tween } from './types'
import * as Easings from './easings'
import * as Utils from './utils'

export const initialize = (definition: AnimationDefinition): Animation => {
  const mapTransformDefinition = (
    transformDefinition,
    useDefaultsFromAnimation,
  ) => ({
    delay:
      transformDefinition.delay ||
      (useDefaultsFromAnimation ? definition.delay || 0 : 0),
    duration:
      transformDefinition.duration ||
      (useDefaultsFromAnimation ? definition.duration || 0 : 0),
    easing: transformDefinition.easing,
    from: transformDefinition.from,
    to: transformDefinition.to,
  })
  return {
    absoluteOffset:
      typeof definition.offset === 'number' ? definition.offset : undefined,
    complete: false,
    easing: definition.easing || 'linear',
    onComplete: definition.onComplete,
    onStart: definition.onStart,
    onUpdate: definition.onUpdate,
    relativeOffset:
      typeof definition.offset === 'string'
        ? Utils.resolveRelativeOffset(definition.offset)
        : undefined,
    state: null,
    target: definition.target,
    transform: Object.keys(definition.transform).reduce(
      (transforms, propName) => {
        const transformDefinition = definition.transform[propName]
        if (
          typeof transformDefinition === 'string' ||
          typeof transformDefinition === 'number' ||
          typeof transformDefinition === 'function'
        ) {
          transforms[propName] = [
            {
              delay: definition.delay || 0,
              duration: definition.duration || 0,
              to: transformDefinition,
            },
          ]
        } else if (Array.isArray(transformDefinition)) {
          transforms[propName] = transformDefinition.map(
            (subTransformDefinition, idx) =>
              mapTransformDefinition(subTransformDefinition, idx === 0),
          )
        } else if (typeof transformDefinition === 'object') {
          transforms[propName] = [
            mapTransformDefinition(transformDefinition, true),
          ]
        }
        return transforms
      },
      {},
    ),
  }
}

export const reset = (animation: Animation) => {
  animation.complete = false
  animation.fullDuration = undefined
  animation.startTime = undefined
  animation.resolvedTarget = undefined
  animation.tweens = undefined
}

const resolveToFromForTween = (
  animation: Animation,
  propName: Prop,
  tween: Tween,
) => {
  const { resolvedTarget } = animation

  if (tween.toValue && tween.fromValue && tween.diff) {
    return
  }

  if (tween.from == null) {
    tween.fromValue = Utils.getValueFromTarget(animation, propName)
  } else {
    tween.fromValue =
      typeof tween.from === 'function'
        ? Utils.extractValue(resolvedTarget, propName, tween.from())
        : Utils.extractValue(resolvedTarget, propName, tween.from)
  }

  tween.toValue =
    typeof tween.to === 'function'
      ? Utils.extractValue(resolvedTarget, propName, tween.to())
      : Utils.extractValue(resolvedTarget, propName, tween.to)

  if (tween.fromValue == null) {
    tween.fromValue = Utils.getDefaultFromValue(
      resolvedTarget,
      propName,
      tween.toValue,
    )
  }

  if (tween.fromValue.unit !== tween.toValue.unit) {
    // eslint-disable-next-line no-console
    console.warn(
      `Mixed units from from/to of ${propName}. from: ${tween.fromValue.unit ||
        ''}, to: "${tween.toValue.unit || ''}"`,
    )
  }

  tween.diff = tween.toValue.number - tween.fromValue.number
}

export const process = (animation: Animation, time: Time) => {
  if (animation.startTime == null) {
    const resolvedTarget = Utils.resolveTarget(animation)
    const props: Array<Prop> = Object.keys(animation.transform)
    const tweens = props.reduce((tweenAcc, propName) => {
      const definition = animation.transform[propName]
      tweenAcc[propName] = definition.reduce(
        (subTweenAcc, subTween) => {
          const initedSubTween = {
            complete: false,
            delay:
              subTweenAcc.prevFullDuration +
              (typeof subTween.delay === 'function'
                ? subTween.delay()
                : subTween.delay),
            duration:
              typeof subTween.duration === 'function'
                ? subTween.duration()
                : subTween.duration,
            easing: subTween.easing,
            from: subTween.from,
            to: subTween.to,
          }
          subTweenAcc.prevFullDuration +=
            initedSubTween.duration + initedSubTween.delay
          subTweenAcc.subTweens.push(initedSubTween)
          return subTweenAcc
        },
        { subTweens: [], prevFullDuration: 0 },
      ).subTweens
      return tweenAcc
    }, {})
    let fullDuration = 0
    props.forEach(prop => {
      tweens[prop].forEach(({ delay, duration }) => {
        const tweenDuration = delay + duration
        fullDuration =
          tweenDuration > fullDuration ? tweenDuration : fullDuration
      })
    })
    animation.fullDuration = fullDuration
    animation.startTime = time
    animation.resolvedTarget = resolvedTarget
    animation.tweens = tweens
    if (animation.onStart != null) {
      animation.onStart()
    }
  }
  const { startTime, fullDuration, resolvedTarget, tweens } = animation
  if (
    startTime == null ||
    fullDuration == null ||
    resolvedTarget == null ||
    tweens == null
  ) {
    throw new Error('💩')
  }
  animation.complete = time >= startTime + fullDuration
  const timePassed = time - startTime
  const values = Object.keys(tweens).reduce((acc, propName) => {
    const propTweens = tweens[propName]
    let value
    let unit
    let originType
    let type
    for (let i = 0; i < propTweens.length; i += 1) {
      const tween = propTweens[i]
      if (tween.complete) {
        continue
      }
      if (timePassed < tween.delay) {
        break
      }
      resolveToFromForTween(animation, propName, tween)
      // The below normalises our values so we can resolve a value that will
      // be correctly relative to the easing function that is being applied
      // across all of the values.
      if (
        tween.easing == null &&
        tween.duration + tween.delay !== animation.fullDuration &&
        tween.bufferedFromValue == null
      ) {
        const animDurPerc = fullDuration / 100
        const postRunDuration = fullDuration - tween.duration - tween.delay
        const prePercentage = tween.delay / animDurPerc
        const runPercentage = tween.duration / animDurPerc
        const postPercentage =
          postRunDuration > 0.001 ? postRunDuration / animDurPerc : 0
        const val = Math.abs(tween.diff) / runPercentage
        const beforeBuffer = prePercentage * val
        const postBuffer = postPercentage * val
        tween.bufferedFromNumber = tween.fromValue.number - beforeBuffer
        tween.bufferedDiff =
          tween.toValue.number + postBuffer - tween.bufferedFromNumber
      }
      if (timePassed > tween.duration + tween.delay) {
        tween.complete = true
        value = tween.toValue.number
        unit = tween.toValue.unit
        originType = tween.toValue.originType
        type = tween.toValue.type
      } else {
        value = Easings[tween.easing || animation.easing](
          tween.bufferedFromNumber != null
            ? timePassed - tween.delay
            : timePassed,
          tween.bufferedFromNumber != null
            ? tween.bufferedFromNumber
            : tween.fromValue.number,
          tween.bufferedDiff != null ? tween.bufferedDiff : tween.diff,
          tween.bufferedFromNumber != null
            ? animation.fullDuration
            : tween.duration,
        )
        unit = tween.toValue.unit
        originType = tween.toValue.originType
        type = tween.toValue.type
        break
      }
    }
    if (value != null) {
      acc[propName] = { number: value, unit, originType, type }
    }
    return acc
  }, {})
  Utils.setValuesOnTarget(resolvedTarget, values)
  if (animation.onUpdate) {
    animation.onUpdate()
  }
  if (animation.complete && animation.onComplete) {
    animation.onComplete()
  }
}
