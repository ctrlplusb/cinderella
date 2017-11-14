/* @flow */
/* eslint-disable no-param-reassign */

import type {
  Animation,
  DOMValueType,
  Prop,
  RawValue,
  ResolvedTarget,
  Unit,
  Value,
  Values,
  ValueType,
} from './types'

// e.g. matches <translateX>(<25px>)
// 1 = translateX
// 2 = px
const styleTransformItemRegex = /(\w+)\((.+?)\)/g

// e.g. matches <25><px>
// 1 = 25
// 2 = px
const rawValueRegex = /([+-]?[0-9#.]+)(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/

const styleTransformProps = [
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

export const isStyleTransformProp = (propName: string) =>
  styleTransformProps.some(y => y === propName)

const defaultNumberForProp = (propName: Prop): number => {
  if (propName === 'scale') {
    return 1
  }
  return 0
}

const camelCaseToHyphens = (x: string): string =>
  x.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

const defaultUnitForDOMValue = (propName: Prop): Unit | void => {
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

const getDOMPropType = (el: HTMLElement, propName: Prop): DOMValueType => {
  if (isStyleTransformProp(propName)) {
    return 'dom-transform'
  }
  if (el.style[propName] != null) {
    return 'dom-css'
  }
  return 'dom-attribute'
}

const getValueType = (
  resolvedTarget: ResolvedTarget,
  propName: Prop,
): ValueType =>
  resolvedTarget === 'dom'
    ? getDOMPropType(resolvedTarget.actual, propName)
    : 'object'

export const getDefaultFromValue = (
  resolvedTarget: ResolvedTarget,
  propName: Prop,
  toValue: Value,
): Value => ({
  number: defaultNumberForProp(propName),
  unit:
    toValue.unit ||
    (resolvedTarget.type === 'dom'
      ? defaultUnitForDOMValue(propName)
      : undefined),
  originType: toValue.originType,
  type: getValueType(resolvedTarget, propName),
})

export const extractValue = (
  resolvedTarget: ResolvedTarget,
  propName: Prop,
  raw: RawValue,
): Value => {
  if (raw == null || typeof raw === 'number') {
    return {
      number: raw == null ? defaultNumberForProp(propName) : raw,
      unit:
        resolvedTarget.type === 'dom'
          ? defaultUnitForDOMValue(propName)
          : undefined,
      originType: 'number',
      type: getValueType(resolvedTarget, propName),
    }
  }
  if (typeof raw === 'string') {
    const match = rawValueRegex.exec(raw)
    if (match) {
      return {
        number: parseInt(match[1], 10) || defaultNumberForProp(propName),
        unit:
          match[2] ||
          (resolvedTarget.type === 'dom'
            ? defaultUnitForDOMValue(propName)
            : undefined),
        originType: 'string',
        type: getValueType(resolvedTarget, propName),
      }
    }
  }
  throw new Error(`Unsupported value type: ${raw}`)
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
        originType: 'string',
        type: 'dom-css-transform',
      }
    }
    match = styleTransformItemRegex.exec(transformStr)
  }
  return result
}

export const getValueFromTarget = (
  resolvedTarget: ResolvedTarget,
  propName: Prop,
): Value => {
  if (resolvedTarget.type === 'dom') {
    const propType = getDOMPropType(resolvedTarget.actual, propName)
    if (propType === 'dom-css-transform') {
      return getStyleTransformValues(resolvedTarget.actual)[propName]
    } else if (propType === 'dom-css') {
      return extractValue(
        resolvedTarget,
        propName,
        resolvedTarget.actual.style[propName],
      )
    }
  }
  return extractValue(resolvedTarget, propName, resolvedTarget.actual[propName])
}

const relativeOffsetRegex = /^([+-]=)([0-9]+)$/

export const resolveRelativeOffset = (offset: string): number | void => {
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

export const resolveTargets = (animation: Animation): Array<ResolvedTarget> => {
  const result = []
  const resolve = targets => {
    if (Array.isArray(targets)) {
      targets.forEach(resolve)
    } else if (typeof targets === 'string') {
      const el = document.querySelector(targets)
      if (!el) {
        throw new Error(`Could not resolve target "${targets}"`)
      }
      result.push({
        type: 'dom',
        actual: el,
      })
    } else if (targets instanceof HTMLElement) {
      result.push({
        type: 'dom',
        actual: targets,
      })
    } else if (typeof targets === 'object') {
      result.push({
        type: 'object',
        actual: targets,
      })
    }
  }
  resolve(animation.targets)
  return result
}

export const setValuesOnTarget = (target: ResolvedTarget, values: Values) => {
  Object.keys(values).forEach(propName => {
    const value = values[propName]
    if (target.type === 'dom' && value.type === 'dom-css-transform') {
      return
    }

    const resolvedValue =
      value.originType === 'number'
        ? value.number
        : `${value.number}${value.unit || ''}`

    if (target.type === 'dom' && value.type === 'dom-css') {
      target.actual.style[propName] = resolvedValue
    } else {
      target.actual[propName] = resolvedValue
    }
  })

  // Make sure we set the transform css prop for dom target
  if (target.type === 'dom') {
    target.actual.style.transform = Object.keys(values)
      .filter(v => v.type === 'dom-css-transform')
      .map(
        propName =>
          `${camelCaseToHyphens(propName)}(${values[propName].number}${values[
            propName
          ].unit || ''})`,
      )
      .join(' ')
  }
}
