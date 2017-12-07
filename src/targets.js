/* @flow */
/* eslint-disable no-param-reassign */

import type {
  AnimationDefinition,
  DOMValueType,
  Prop,
  RawValue,
  Target,
  Unit,
  Value,
  Values,
  ValueType,
} from './types'
import * as Utils from './utils'

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

const getDOMPropType = (el: HTMLElement, prop: Prop): DOMValueType => {
  if (isStyleTransformProp(prop)) {
    return 'dom-css-transform'
  }
  if (el.getAttribute(prop) != null) {
    return 'dom-attribute'
  }
  if (el.style[prop] != null) {
    return 'dom-css'
  }
  return 'dom-attribute'
}

const getValueType = (target: Target, prop: Prop): ValueType =>
  target.type === 'dom' ? getDOMPropType(target.actual, prop) : 'object'

export const extractValue = (
  target: Target,
  prop: Prop,
  raw: RawValue,
): Value => {
  if (raw == null || typeof raw === 'number') {
    return {
      number: Utils.scaleUp(raw == null ? defaultNumberForProp(prop) : raw),
      unit: target.type === 'dom' ? defaultUnitForDOMValue(prop) : undefined,
      originType: 'number',
      type: getValueType(target, prop),
    }
  }
  if (typeof raw === 'string') {
    const match = rawValueRegex.exec(raw)
    if (match) {
      return {
        number: Utils.scaleUp(
          parseFloat(match[1]) || defaultNumberForProp(prop),
        ),
        unit:
          match[2] ||
          (target.type === 'dom' ? defaultUnitForDOMValue(prop) : undefined),
        originType: 'string',
        type: getValueType(target, prop),
      }
    }
  }
  throw new Error(`Unsupported value: ${raw}`)
}

export const resolveTargets = (
  animation: AnimationDefinition,
): Array<Target> => {
  const result = []
  const resolve = targets => {
    if (Array.isArray(targets)) {
      targets.forEach(resolve)
    } else if (typeof targets === 'string') {
      const els = [...document.querySelectorAll(targets)]
      els.forEach(el => {
        result.push({
          type: 'dom',
          actual: el,
        })
      })
    } else if (
      targets instanceof HTMLElement ||
      (typeof SVGElement === 'function' && targets instanceof SVGElement) ||
      (typeof targets === 'object' && typeof targets.nodeType !== 'undefined')
    ) {
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

const getCSSTransforms = domNode => {
  const result = {}

  domNode.style.transform.split(' ').forEach(transform => {
    const match = /(\w+)\((.*)\)/.exec(transform)
    if (match) {
      result[match[1]] = match[2]
    }
  })

  return result
}

export const setValuesOnTarget = (target: Target, values: Values) => {
  Object.keys(values).forEach(propName => {
    const value = values[propName]
    if (target.type === 'dom' && value.type === 'dom-css-transform') {
      return
    }

    const scaledDownNumber = Utils.scaleDown(value.number)

    const resolvedValue =
      value.originType === 'number'
        ? scaledDownNumber
        : `${scaledDownNumber}${value.unit || ''}`

    if (target.type === 'dom' && value.type === 'dom-css') {
      target.actual.style[propName] = resolvedValue
    } else {
      target.actual[propName] = resolvedValue
    }
  })

  // Make sure we set the transform css prop for dom target
  if (target.type === 'dom') {
    const existingTransforms =
      target.actual.style.transform != null &&
      target.actual.style.transform !== ''
        ? getCSSTransforms(target.actual)
        : {}

    // We have to ensure that we carry across any existing transforms
    const cssTransforms = Object.keys(values).reduce((acc, propName) => {
      const value = values[propName]
      const scaledDown = Utils.scaleDown(value.number)
      if (target.type === 'dom' && value.type === 'dom-css-transform') {
        acc[propName] = `${scaledDown}${value.unit || ''}`
      }
      return acc
    }, existingTransforms)

    target.actual.style.transform = Object.keys(cssTransforms)
      .reduce((acc, propName) => {
        acc.push(`${propName}(${cssTransforms[propName]})`)
        return acc
      }, [])
      .join(' ')
  }
}
