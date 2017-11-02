import raf from 'raf'
import { frameRate } from '../constants'
import animate from '../dom'

const waitForFrames = (n = 1) =>
  new Promise(resolve => setTimeout(resolve, n * frameRate))

describe('dom', () => {
  beforeAll(() => {
    raf.polyfill(window)
  })

  it('opacity', async () => {
    const el = document.createElement('div')
    el.style.opacity = 1
    animate({
      target: el,
      opacity: 0,
      duration: 2 * frameRate,
    }).play()
    await waitForFrames(3)
    expect(el.style.opacity).toBe(0)
  })
})
