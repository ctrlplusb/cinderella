import raf from 'raf'
import { animate, cancelAll } from '../index'

describe('animate', () => {
  const frameRate = 1000 / 60

  const waitForFrames = (n = 1) =>
    new Promise(resolve => setTimeout(resolve, n * frameRate))

  let onStartSpy
  let onUpdateSpy
  let onCompleteSpy
  let animation

  beforeAll(() => {
    raf.polyfill(window)
  })

  beforeEach(() => {
    cancelAll()
    onStartSpy = jest.fn()
    onUpdateSpy = jest.fn()
    onCompleteSpy = jest.fn()
    animation = animate({
      from: 0,
      to: 100,
      duration: 5 * frameRate,
      onStart: onStartSpy,
      onUpdate: onUpdateSpy,
      onComplete: onCompleteSpy,
    })
  })

  it('does not executes if "run" is not executed', async () => {
    await waitForFrames(1)
    expect(onStartSpy.mock.calls.length).toBe(0)
  })

  it('calls "onStart" when animation starts', async () => {
    animation.run()
    await waitForFrames(1)
    expect(onStartSpy.mock.calls.length).toBe(1)
  })

  it('calls "onUpdate" for each frame', async () => {
    animation.run()
    await waitForFrames(6)
    expect(onUpdateSpy.mock.calls.length).toBe(5)
  })

  it('calls "onComplete" when animation is done', async () => {
    animation.run()
    await waitForFrames(6)
    expect(onCompleteSpy.mock.calls.length).toBe(1)
  })

  it('half way through an animation produces the expected result', async () => {
    animation.run()
    await waitForFrames(4)
    expect(onUpdateSpy.mock.calls.length).toBe(3)
    expect(Math.round(onUpdateSpy.mock.calls[2][0])).toBe(100 / 5 * 3)
  })
})
