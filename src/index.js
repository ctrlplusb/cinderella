/* @flow */
/* eslint-disable prefer-destructuring */

import type { Cinderella } from './types'
import * as Timelines from './timelines'
import * as RAF from './raf'

const cinderella: Cinderella = config => {
  RAF.run()
  return Timelines.create(config)
}

cinderella.animate = (definition, config) =>
  cinderella(config)
    .add(definition)
    .play()
cinderella.addFrameListener = RAF.addFrameListener
cinderella.removeFrameListener = RAF.removeFrameListener
cinderella.stopAll = () => {
  RAF.stop()
  Timelines.unqueueAll()
}

export default cinderella
