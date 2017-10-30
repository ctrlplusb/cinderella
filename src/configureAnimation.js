import * as Easings from './easings'

export default ({
  from,
  to,
  easing = 'linear',
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
