/* @flow */

import type {
  ResolvedTarget,
  Transforms,
  RawValue,
  Value,
  Values,
  Prop,
  Unit,
} from './types'

// e.g. matches <translateX>(<25px>)
// 1 = translateX
// 2 = px
const styleTransformItemRegex = /(\w+)\((.+?)\)/g

// e.g. matches <25><px>
// 1 = 25
// 2 = px
const rawValueRegex = /([+-]?[0-9#.]+)(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/

const defaultNumberForProp = (propName: Prop): number => {
  if (propName === 'scale') {
    return 1
  }
  return 0
}

const defaultUnitForProp = (propName: Prop): Unit | void => {
  switch (propName) {
    case 'translateX':
    case 'translateY':
    case 'translateZ':
    case 'perspective':
    case 'width':
    case 'height':
    case 'top':
    case 'left':
    case 'right':
    case 'bottom':
      return 'px'
    case 'rotate':
    case 'rotateX':
    case 'rotateY':
    case 'rotateZ':
    case 'skewX':
    case 'skewY':
      return 'deg'
    case 'scale':
    case 'scaleX':
    case 'scaleY':
    case 'scaleZ':
    case 'value':
    default:
      return undefined
  }
}

export const extractValue = (propName: Prop, raw: RawValue): Value => {
  if (typeof raw === 'number') {
    return {
      number: raw,
      unit: defaultUnitForProp(propName),
    }
  }
  if (typeof raw === 'string') {
    const match = rawValueRegex.exec(raw)
    if (match) {
      return {
        number: parseInt(match[1], 10) || defaultNumberForProp(propName),
        unit: match[2] || defaultUnitForProp(propName),
      }
    }
  }
  return {
    number: defaultNumberForProp(propName),
    unit: defaultUnitForProp(propName),
  }
}

const getStyleTransformValues = (el: HTMLElement): Values => {
  const result: Values = {}
  if (!el.style.transform) {
    return result
  }
  const transformStr = el.style.transform
  let match = styleTransformItemRegex.exec(transformStr)
  while (match) {
    const propName = match[1]
    const value = match[2]
    const splitValue = rawValueRegex.exec(value)
    if (splitValue) {
      result[propName] = {
        number: parseInt(splitValue[1], 10),
        unit: splitValue[2],
      }
    }
    match = styleTransformItemRegex.exec(transformStr)
  }
  return result
}

export const getCurrentValues = (
  target: ResolvedTarget,
  transforms: Transforms,
): Values => {
  const result = {}
  const propNames: Array<Prop> = Object.keys(transforms)
  if (target.type === 'dom') {
    const styleTransformValues = getStyleTransformValues(target.actual)
    const styleTransformProps: Array<Prop> = Object.keys(styleTransformValues)
    styleTransformProps.forEach(propName => {
      result[propName] = styleTransformValues[propName]
    })
  }
  if (target.type === 'object') {
    propNames.forEach(propName => {
      const transform = transforms[propName]
      const from =
        typeof transform !== 'object' && transform.from == null
          ? undefined
          : typeof transform.from === 'function'
            ? extractValue(propName, transform.from())
            : extractValue(propName, transform.from)
      result[propName] = from
    })
  }
  return result
}
