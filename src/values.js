/* @flow */

const styleTransformPropNames = [
  'translateX',
  'translateY',
  'translateZ',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'scale',
  'scaleX',
  'scaleY',
  'scaleZ',
  'skewX',
  'skewY',
  'perspective',
]

const getDefaultUnitForStyleTransform = propName => {
  if (propName.indexOf('translate') !== -1 || propName === 'perspective')
    return 'px'
  if (propName.indexOf('rotate') !== -1 || propName.indexOf('skew') !== -1)
    return 'deg'
  return undefined
}

// const defaultValue = propName.indexOf('scale') !== -1 ? 1 : 0

export const isStyleTransformProp = (propName: string) =>
  styleTransformPropNames.some(y => y === propName)

/*
function stringContains(str, text) {
  return str.indexOf(text) > -1
}

function arrayContains(arr, val) {
  return arr.some(a => a === val)
}

function stringToHyphens(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

const is = {
  arr: a => Array.isArray(a),
  obj: a => stringContains(Object.prototype.toString.call(a), 'Object'),
  pth: a => is.obj(a) && Object.prototype.hasOwnProperty.call(a, 'totalLength'),
  svg: a => a instanceof SVGElement,
  dom: a => a.nodeType || is.svg(a),
  str: a => typeof a === 'string',
  fnc: a => typeof a === 'function',
  und: a => typeof a === 'undefined',
  hex: a => /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a),
  rgb: a => /^rgb/.test(a),
  hsl: a => /^hsl/.test(a),
  col: a => is.hex(a) || is.rgb(a) || is.hsl(a),
}

// Colors

function rgbToRgba(rgbValue) {
  const rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue)
  return rgb ? `rgba(${rgb[1]},1)` : rgbValue
}

function hexToRgba(hexValue) {
  const rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  const hex = hexValue.replace(rgx, (m, r, g, b) => r + r + g + g + b + b)
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  const r = parseInt(rgb[1], 16)
  const g = parseInt(rgb[2], 16)
  const b = parseInt(rgb[3], 16)
  return `rgba(${r},${g},${b},1)`
}

function hslToRgba(hslValue) {
  const hsl =
    /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) ||
    /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue)
  const h = parseInt(hsl[1], 10) / 360
  const s = parseInt(hsl[2], 10) / 100
  const l = parseInt(hsl[3], 10) / 100
  const a = hsl[4] || 1

  function hue2rgb(p, q, t) {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let r
  let g
  let b
  if (s == 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return `rgba(${r * 255},${g * 255},${b * 255},${a})`
}

function colorToRgb(val) {
  if (is.rgb(val)) return rgbToRgba(val)
  if (is.hex(val)) return hexToRgba(val)
  if (is.hsl(val)) return hslToRgba(val)
}

// Units

function getUnit(val) {
  const split = /([\+\-]?[0-9#\.]+)(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(
    val,
  )
  if (split) return split[2]
}

// Values

function minMaxValue(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

function getFunctionValue(val, animatable) {
  if (!is.fnc(val)) return val
  return val(animatable.target, animatable.id, animatable.total)
}

function getCSSValue(target, propName) {
  if (target.style[propName] != null) {
    return (
      getComputedStyle(target).getPropertyValue(stringToHyphens(propName)) ||
      '0'
    )
  }
  return undefined
}

export const getTargetType = (target: mixed) => {
  if (is.dom(target)) {
    return 'dom'
  }
}

export const getAnimationType = (target: mixed, propName: string) => {
  if (is.dom(target) && arrayContains(styleTransformPropNames, propName)) {
    return 'transform'
  }
  if (
    (is.dom(target) && target.getAttribute(propName)) ||
    (is.svg(target) && target[propName])
  ) {
    return 'attribute'
  }
  if (
    is.dom(target) &&
    propName !== 'transform' &&
    getCSSValue(target, propName)
  ) {
    return 'css'
  }
  return 'object'
}

function getTransformUnit(propName) {
  if (stringContains(propName, 'translate') || propName === 'perspective')
    return 'px'
  if (stringContains(propName, 'rotate') || stringContains(propName, 'skew'))
    return 'deg'
  return undefined
}

function getTransformValue(el, propName) {
  const defaultUnit = getTransformUnit(propName)
  const defaultVal = stringContains(propName, 'scale') ? 1 : 0 + defaultUnit
  const str = el.style.transform
  if (!str) return defaultVal
  const props = []
  const values = []
  const rgx = /(\w+)\((.+?)\)/g
  let match = rgx.exec(str)
  while (match) {
    props.push(match[1])
    values.push(match[2])
    match = rgx.exec(str)
  }
  const value = filterArray(values, (val, i) => props[i] === propName)
  return value.length ? value[0] : defaultVal
}

function getOriginalTargetValue(target, propName) {
  switch (getAnimationType(target, propName)) {
    case 'transform':
      return getTransformValue(target, propName)
    case 'css':
      return getCSSValue(target, propName)
    case 'attribute':
      return target.getAttribute(propName)
  }
  return target[propName] || 0
}

function getRelativeValue(to, from) {
  const operator = /^(\*=|\+=|-=)/.exec(to)
  if (!operator) return to
  const u = getUnit(to) || 0
  const x = parseFloat(from)
  const y = parseFloat(to.replace(operator[0], ''))
  switch (operator[0][0]) {
    case '+':
      return x + y + u
    case '-':
      return x - y + u
    case '*':
      return x * y + u
  }
}

function validateValue(val, unit) {
  if (is.col(val)) return colorToRgb(val)
  const originalUnit = getUnit(val)
  const unitLess = originalUnit ?
    val.substr(0, val.length - originalUnit.length) :
    val
  return unit && !/\s/g.test(val) ? unitLess + unit : unitLess
}
*/
