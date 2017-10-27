import * as Easings from './easings'
import constants from './constants'

export default ({
  from,
  to,
  easing = constants.defaultEasing,
  delay,
  duration = 100,
  onStart,
  onUpdate,
  onComplete,
  ...unique
}) => ({
  ...unique,
  from,
  to,
  easing,
  easingFn: Easings[easing],
  delay,
  duration,
  onStart,
  onUpdate,
  onComplete,
})
