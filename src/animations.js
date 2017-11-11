/* @flow */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-continue */

import type { Animation, AnimationDefinition, Prop, Time } from './types'
import * as Easings from './easings'
import * as Utils from './utils'

export const initialize = (definition: AnimationDefinition): Animation => {
  const mapTransformDefinition = transformDefinition => ({
    delay: transformDefinition.delay || 0,
    duration: transformDefinition.duration || 0,
    easing: transformDefinition.easing,
    from: transformDefinition.from,
    to: transformDefinition.to,
  })
  return {
    absoluteOffset:
      typeof definition.offset === 'number' ? definition.offset : undefined,
    complete: false,
    delay: definition.delay || 0,
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
        if (Array.isArray(transformDefinition)) {
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

export const reset = (animation: Animation) => {
  animation.complete = false
  animation.delayValue = undefined
  animation.fullDuration = undefined
  animation.startTime = undefined
  animation.resolvedTarget = undefined
  animation.tweens = undefined
}

export const process = (animation: Animation, time: Time) => {
  // We first check to see if a start time has been registered, if not we consider
  // this the first run of the animation, therefore we want to do a whole bunch
  // of initial set up and do some basic resolving of some the lazy values for
  // tweens
  if (animation.startTime == null) {
    const resolvedTarget = Utils.resolveTarget(animation)
    const props: Array<Prop> = Object.keys(animation.transform)
    const tweens = props.reduce((tweenAcc, propName) => {
      const definition = animation.transform[propName]
      tweenAcc[propName] = Array.isArray(definition)
        ? definition.reduce(
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
            {
              subTweens: [],
              prevFullDuration: 0,
            },
          ).subTweens
        : [
            {
              complete: false,
              delay:
                typeof definition.delay === 'function'
                  ? definition.delay()
                  : definition.delay,
              duration:
                typeof definition.duration === 'function'
                  ? definition.duration()
                  : definition.duration,
              easing: definition.easing,
              from: definition.from,
              to: definition.to,
            },
          ]
      return tweenAcc
    }, {})
    let fullDuration = 0
    props.forEach(prop => {
      tweens[prop].forEach(({ delay, duration }) => {
        const tweenFullDuration = delay + duration
        fullDuration =
          tweenFullDuration > fullDuration ? tweenFullDuration : fullDuration
      })
    })
    animation.delayValue =
      typeof animation.delay === 'function'
        ? animation.delay()
        : animation.delay
    animation.fullDuration = fullDuration
    animation.startTime = time
    animation.resolvedTarget = resolvedTarget
    animation.tweens = tweens
    if (animation.onStart != null) {
      animation.onStart()
    }
  }
  const {
    startTime,
    fullDuration,
    resolvedTarget,
    tweens,
    delayValue,
  } = animation
  if (
    startTime == null ||
    fullDuration == null ||
    resolvedTarget == null ||
    tweens == null ||
    delayValue == null
  ) {
    throw new Error('💩')
  }
  const timePassed = time - startTime
  if (timePassed < delayValue) {
    return
  }
  animation.complete = time >= startTime + fullDuration
  const values = Object.keys(tweens).reduce((acc, propName) => {
    const propTweens = tweens[propName]
    let tweenCurrentValue
    for (let i = 0; i < propTweens.length; i += 1) {
      const tween = propTweens[i]
      if (tween.complete) {
        continue
      }
      if (timePassed < tween.delay) {
        break
      }
      // Resolve the to/from values for the tweens
      if (!tween.toValue || !tween.fromValue || !tween.diff) {
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
            `Mixed units from from/to of ${propName}. from: ${tween.fromValue
              .unit || ''}, to: "${tween.toValue.unit || ''}"`,
          )
        }
        tween.diff = tween.toValue.number - tween.fromValue.number
      }
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
      // If the time has passed the tween run time then we just use the "to"
      // as our value.
      if (timePassed > tween.duration + tween.delay) {
        tween.complete = true
        tweenCurrentValue = tween.toValue
      } else {
        tweenCurrentValue = Object.assign({}, tween.toValue, {
          number: Easings[tween.easing || animation.easing](
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
          ),
        })
        break
      }
    }
    if (tweenCurrentValue != null) {
      acc[propName] = tweenCurrentValue
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
