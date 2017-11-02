import { animate as coreAnimate } from './index'

export { addFrameListener, removeFrameListener, cancelAll } from './index'

const units = ['%', 'px', 'rem', 'em', 'deg', 'turn']

const dom = config => {
  const {
    // new config
    target,

    // core config
    onStart,
    onUpdate,
    onComplete,
    from,
    to,
    duration,
    offset,

    // additional config
    ...animationTargets
  } = config

  return {
    onStart: () => {
      Object.keys(animationTargets).map(name => {
        switch (name) {
          // transform props
          case 'rotate':
          case 'rotateX':
          case 'rotateY':
          case 'rotateZ':
            break
          case 'scale':
          case 'scaleX':
          case 'scaleY':
            break
          case 'skew':
          case 'skewX':
          case 'skewY':
            break
          case 'translateX':
          case 'translateY':
          case 'translateZ':
            break

          // standard style props
          case 'backgroundColor':
          case 'bottom':
          case 'color':
          case 'fontSize':
          case 'height':
          case 'left':
          case 'marginBottom':
          case 'marginLeft':
          case 'marginRight':
          case 'marginTop':
          case 'opacity':
          case 'paddingBottom':
          case 'paddingLeft':
          case 'paddingRight':
          case 'paddingTop':
          case 'right':
          case 'top':
          case 'width':
          case 'zIndex':
            break

          default: {
            console.warn(`Unsupported style property ${name}`)
          }
        }
      })
    },
    onUpdate: x => {
      //
    },
    onComplete: t => {
      //
    },
    duration,
    offset,
    from: () => {
      //
    },
    to: () => {
      //
    },
  }
}

export const animate = animations => {
  const transformed = Array.isArray(animations)
    ? animations.map(
        animation =>
          typeof animation.play === 'function' ? animation : dom(animation),
      )
    : dom(animations)

  return coreAnimate(transformed)
}

export default animate
