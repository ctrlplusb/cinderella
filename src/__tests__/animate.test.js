import raf from 'raf'
import {
  animate,
  cancelAll,
  addFrameListener,
  removeFrameListener,
} from '../index'
import { frameRate } from '../constants'

expect.extend({
  toHaveBeenCalledBetweenNTimes(received, min, max) {
    const pass =
      received.mock.calls.length >= min && received.mock.calls.length <= max
    if (pass) {
      return {
        message: () =>
          `expected function to be called between ${min} and ${max} times`,
        pass: true,
      }
    }
    return {
      message: () =>
        `expected function to be called between ${min} and ${max} times, but it was called ${received
          .mock.calls.length} times`,
      pass: false,
    }
  },
})

describe('animate', () => {
  const waitForFrames = (n = 1) =>
    new Promise(resolve => setTimeout(resolve, n * frameRate))

  let onStartSpy
  let onUpdateSpy
  let onCompleteSpy
  let onTimelineCompleteSpy
  let animation

  beforeAll(() => {
    raf.polyfill(window)
  })

  beforeEach(() => {
    cancelAll()
    onStartSpy = jest.fn()
    onUpdateSpy = jest.fn()
    onCompleteSpy = jest.fn()
    onTimelineCompleteSpy = jest.fn()
    animation = animate(
      {
        from: 0,
        to: 100,
        duration: 5 * frameRate,
        onStart: onStartSpy,
        onUpdate: onUpdateSpy,
        onComplete: onCompleteSpy,
      },
      { onComplete: onTimelineCompleteSpy },
    )
  })

  it('does not executes if "play" is not executed', async () => {
    await waitForFrames(2)
    expect(onStartSpy).toHaveBeenCalledTimes(0)
  })

  it('calls "onStart" when animation starts', async () => {
    animation.play()
    await waitForFrames(2)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
  })

  it('calls "onUpdate" for each frame', async () => {
    animation.play()
    await waitForFrames(5)
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(3, 6)
  })

  it('calls "onComplete" when animation is done', async () => {
    animation.play()
    await waitForFrames(7)
    expect(onCompleteSpy).toHaveBeenCalledTimes(1)
  })

  it('multiple values', async () => {
    const actual = { a: null, b: null }
    animate({
      from: [0, 200],
      to: [50, 150],
      duration: 5 * frameRate,
      onUpdate: ([a, b]) => {
        actual.a = a
        actual.b = b
      },
    }).play()
    await waitForFrames(8)
    expect(actual).toMatchObject({
      a: 50,
      b: 150,
    })
  })

  it('function values', async () => {
    let actual = null
    animate({
      from: () => 0,
      to: () => 50,
      duration: 5 * frameRate,
      onUpdate: x => {
        actual = x
      },
    }).play()
    await waitForFrames(8)
    expect(actual).toBe(50)
  })

  it('half way through an animation produces the expected result', async () => {
    animation.play()
    await waitForFrames(4)
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(3, 4)
    const lastUpdateValue = Math.round(
      onUpdateSpy.mock.calls[onUpdateSpy.mock.calls.length - 1][0],
    )
    expect(
      lastUpdateValue === 100 / 5 * 3 || lastUpdateValue === 100 / 5 * 4,
    ).toBe(true)
  })

  it('calling play has no effect on an animation that is midway in their timeline', async () => {
    animation.play()
    await waitForFrames(3)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
    animation.play()
    await waitForFrames(3)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
    expect(onCompleteSpy).toHaveBeenCalledTimes(1)
  })

  it('calling play on an animation that has complete causes it to play again', async () => {
    animation.play()
    await waitForFrames(7)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
    expect(onCompleteSpy).toHaveBeenCalledTimes(1)
    animation.play()
    await waitForFrames(3)
    expect(onStartSpy).toHaveBeenCalledTimes(2)
  })

  it('disposing a timeline mid execution stops it immediately', async () => {
    animation.play()
    await waitForFrames(3)
    animation.dispose()
    await waitForFrames(2)
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(2, 4)
    expect(onCompleteSpy).toHaveBeenCalledTimes(0)
  })

  it('only runs an animation once', async () => {
    animation.play()
    await waitForFrames(10)
    expect(onCompleteSpy).toHaveBeenCalledTimes(1)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(5, 7)
  })

  it('looping works', async () => {
    const loopStartSpy = jest.fn()
    const loopUpdateSpy = jest.fn()
    const loopCompleteSpy = jest.fn()
    animate(
      {
        duration: 3 * frameRate,
        from: 0,
        to: 10,
        onStart: loopStartSpy,
        onUpdate: loopUpdateSpy,
        onComplete: loopCompleteSpy,
      },
      {
        loop: true,
      },
    ).play()
    await waitForFrames(9)
    expect(loopStartSpy).toHaveBeenCalledBetweenNTimes(2, 3)
    expect(loopUpdateSpy).toHaveBeenCalledBetweenNTimes(5, 8)
    expect(loopCompleteSpy).toHaveBeenCalledBetweenNTimes(1, 2)
  })

  it('pausing and resuming an animation works', async () => {
    const onStartTwoSpy = jest.fn()
    const onUpdateTwoSpy = jest.fn()
    const pausable = animate([
      {
        duration: 2 * frameRate,
        from: 0,
        to: 100,
        onUpdate: jest.fn(),
      },
      {
        duration: 3 * frameRate,
        from: 0,
        to: 100,
        onStart: onStartTwoSpy,
        onUpdate: onUpdateTwoSpy,
      },
    ])
    pausable.play()
    await waitForFrames(2)
    pausable.pause()
    await waitForFrames(5)
    expect(onStartTwoSpy).toHaveBeenCalledTimes(0)
    pausable.play()
    await waitForFrames(4)
    expect(onUpdateTwoSpy).toHaveBeenCalledBetweenNTimes(3, 4)
  })

  it('seeking works', async () => {
    const values = {
      x: 0,
      y: 0,
      z: 0,
    }
    const seekable = animate([
      {
        duration: 3 * frameRate,
        from: 0,
        to: 100,
        onUpdate: x => {
          values.x = x
        },
      },
      {
        duration: 3 * frameRate,
        from: 0,
        to: 100,
        onUpdate: y => {
          values.y = y
        },
      },
      {
        duration: 3 * frameRate,
        from: 0,
        to: 100,
        onUpdate: z => {
          values.z = z
        },
      },
    ])

    seekable.seek(50)
    await waitForFrames(1)
    expect(values.x).toBe(100)
    expect(values.y).toBeCloseTo(50)
    expect(values.z).toBe(0)

    seekable.seek(25)
    await waitForFrames(1)
    expect(values.x).toBeCloseTo(75)
    expect(values.y).toBe(0)
    expect(values.z).toBe(0)

    seekable.seek(100)
    await waitForFrames(1)
    expect(values.x).toBe(100)
    expect(values.y).toBe(100)
    expect(values.z).toBe(100)

    seekable.seek(0)
    await waitForFrames(1)
    expect(values.x).toBe(0)
    expect(values.y).toBe(0)
    expect(values.z).toBe(0)
  })

  it('play after seek', async () => {
    animation.seek(90)
    animation.play()
    await waitForFrames(3)
    // console.log(onUpdateSpy.mock.calls.map(([x]) => x))
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(2, 3)
    expect(onCompleteSpy).toHaveBeenCalledTimes(1)
  })

  it('registering custom onFrame listeners', async () => {
    const listener = jest.fn()
    addFrameListener(listener)
    animation.play()
    await waitForFrames(3)
    expect(listener).toHaveBeenCalledBetweenNTimes(3, 4)
    removeFrameListener(listener)
    await waitForFrames(3)
    expect(listener).toHaveBeenCalledBetweenNTimes(3, 4)
  })

  it('animation "onComplete"', async () => {
    animation.play()
    await waitForFrames(7)
    expect(onTimelineCompleteSpy).toHaveBeenCalledTimes(1)
  })
})
