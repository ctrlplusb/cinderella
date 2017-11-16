/* @flow */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
/* eslint-disable no-cond-assign */
/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-properties */

import type { EasingFn } from './types'

/**
 * t = time (since easing began) in ms
 * b = start value
 * c = diff to end value
 * d = duration for ease in ms
 *
 * e.g.
 *
 * easeInQuad(500, 1, 100, 1000)
 *  |-> 50
 */

export const linear: EasingFn = (t, b, c, d) => {
  t /= d
  return b + c * t
}

export const easeInQuad: EasingFn = (t, b, c, d) => c * (t /= d) * t + b

export const easeOutQuad: EasingFn = (t, b, c, d) => -c * (t /= d) * (t - 2) + b

export const easeInOutQuad: EasingFn = (t, b, c, d) => {
  if ((t /= d / 2) < 1) return c / 2 * t * t + b
  return -c / 2 * (--t * (t - 2) - 1) + b
}

export const easeInCubic: EasingFn = (t, b, c, d) => c * (t /= d) * t * t + b

export const easeOutCubic: EasingFn = (t, b, c, d) =>
  c * ((t = t / d - 1) * t * t + 1) + b

export const easeInOutCubic: EasingFn = (t, b, c, d) => {
  if ((t /= d / 2) < 1) return c / 2 * t * t * t + b
  return c / 2 * ((t -= 2) * t * t + 2) + b
}

export const easeInQuart: EasingFn = (t, b, c, d) =>
  c * (t /= d) * t * t * t + b

export const easeOutQuart: EasingFn = (t, b, c, d) =>
  -c * ((t = t / d - 1) * t * t * t - 1) + b

export const easeInOutQuart: EasingFn = (t, b, c, d) => {
  if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b
  return -c / 2 * ((t -= 2) * t * t * t - 2) + b
}

export const easeInQuint: EasingFn = (t, b, c, d) =>
  c * (t /= d) * t * t * t * t + b

export const easeOutQuint: EasingFn = (t, b, c, d) =>
  c * ((t = t / d - 1) * t * t * t * t + 1) + b

export const easeInOutQuint: EasingFn = (t, b, c, d) => {
  if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b
  return c / 2 * ((t -= 2) * t * t * t * t + 2) + b
}

export const easeInSine: EasingFn = (t, b, c, d) =>
  -c * Math.cos(t / d * (Math.PI / 2)) + c + b

export const easeOutSine: EasingFn = (t, b, c, d) =>
  c * Math.sin(t / d * (Math.PI / 2)) + b

export const easeInOutSine: EasingFn = (t, b, c, d) =>
  -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b

export const easeInExpo: EasingFn = (t, b, c, d) =>
  t === 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b

export const easeOutExpo: EasingFn = (t, b, c, d) =>
  t === d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b

export const easeInOutExpo: EasingFn = (t, b, c, d) => {
  if (t === 0) return b
  if (t === d) return b + c
  if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b
  return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b
}

export const easeInCirc: EasingFn = (t, b, c, d) =>
  -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b

export const easeOutCirc: EasingFn = (t, b, c, d) =>
  c * Math.sqrt(1 - (t = t / d - 1) * t) + b

export const easeInOutCirc: EasingFn = (t, b, c, d) => {
  if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b
  return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b
}

export const easeInElastic: EasingFn = (t, b, c, d) => {
  let s = 1.70158
  let p = 0
  let a = c
  if (t === 0) {
    return b
  }
  if ((t /= d) === 1) {
    return b + c
  }
  if (!p) {
    p = d * 0.3
  }
  if (a < Math.abs(c)) {
    a = c
    s = p / 4
  } else {
    s = p / (2 * Math.PI) * Math.asin(c / a)
  }
  return (
    -(
      a *
      Math.pow(2, 10 * (t -= 1)) *
      Math.sin((t * d - s) * (2 * Math.PI) / p)
    ) + b
  )
}

export const easeOutElastic: EasingFn = (t, b, c, d) => {
  let s = 1.70158
  let p = 0
  let a = c
  if (t === 0) return b
  if ((t /= d) === 1) return b + c
  if (!p) p = d * 0.3
  if (a < Math.abs(c)) {
    a = c
    s = p / 4
  } else {
    s = p / (2 * Math.PI) * Math.asin(c / a)
  }
  return (
    a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b
  )
}

export const easeInOutElastic: EasingFn = (t, b, c, d) => {
  let s = 1.70158
  let p = 0
  let a = c
  if (t === 0) return b
  if ((t /= d / 2) === 2) return b + c
  if (!p) p = d * (0.3 * 1.5)
  if (a < Math.abs(c)) {
    a = c
    s = p / 4
  } else {
    s = p / (2 * Math.PI) * Math.asin(c / a)
  }
  if (t < 1)
    return (
      -0.5 *
        (a *
          Math.pow(2, 10 * (t -= 1)) *
          Math.sin((t * d - s) * (2 * Math.PI) / p)) +
      b
    )
  return (
    a *
      Math.pow(2, -10 * (t -= 1)) *
      Math.sin((t * d - s) * (2 * Math.PI) / p) *
      0.5 +
    c +
    b
  )
}

export const easeInBack: EasingFn = (t, b, c, d, s) => {
  if (s === undefined) s = 1.70158
  return c * (t /= d) * t * ((s + 1) * t - s) + b
}

export const easeOutBack: EasingFn = (t, b, c, d, s) => {
  if (s === undefined) s = 1.70158
  return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b
}

export const easeInOutBack: EasingFn = (t, b, c, d, s) => {
  if (s === undefined) s = 1.70158
  if ((t /= d / 2) < 1)
    return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b
  return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b
}

export const easeOutBounce: EasingFn = (t, b, c, d) => {
  if ((t /= d) < 1 / 2.75) {
    return c * (7.5625 * t * t) + b
  } else if (t < 2 / 2.75) {
    return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75) + b
  } else if (t < 2.5 / 2.75) {
    return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375) + b
  }
  return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375) + b
}

export const easeInBounce: EasingFn = (t, b, c, d) =>
  c - easeOutBounce(d - t, 0, c, d) + b

export const easeInOutBounce: EasingFn = (t, b, c, d) => {
  if (t < d / 2) return easeInBounce(t * 2, 0, c, d) * 0.5 + b
  return easeOutBounce(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b
}
