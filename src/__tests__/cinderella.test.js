/* @flow */

import cinderella from '../index'

const { stopAll, addFrameListener, removeFrameListener } = cinderella

const frameRate = 1000 / 60

describe('cinderella', () => {
  let waitForFrames

  beforeEach(() => {
    stopAll()
    let time = 100
    let frame
    window.requestAnimationFrame = fn => {
      frame = fn
      return frame
    }
    window.cancelAnimationFrame = () => undefined
    waitForFrames = (n = 1) => {
      for (let i = 0; i < n; i += 1) {
        time += frameRate
        if (frame) {
          frame(time)
        }
      }
    }
  })

  describe('timelines', () => {
    describe('execution', () => {
      let target
      let onStartSpy
      let onUpdateSpy
      let onCompleteSpy
      let animation

      beforeEach(() => {
        target = {}
        onStartSpy = jest.fn()
        onUpdateSpy = jest.fn()
        onCompleteSpy = jest.fn()
        animation = cinderella({
          onStart: onStartSpy,
          onUpdate: onUpdateSpy,
          onComplete: onCompleteSpy,
        }).add({
          targets: target,
          transform: {
            foo: {
              from: 0,
              to: 100,
              duration: 5 * frameRate,
            },
          },
        })
      })

      it('nothing happens if "play" is not executed', () => {
        waitForFrames(2)
        expect(onStartSpy).toHaveBeenCalledTimes(0)
      })

      it('onStart', () => {
        animation.play()
        waitForFrames(5)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
      })

      it('onUpdate', () => {
        animation.play()
        waitForFrames(1)
        expect(onUpdateSpy).toHaveBeenCalledTimes(1)
        expect(onUpdateSpy).toHaveBeenLastCalledWith({
          progress: 0,
        })
        waitForFrames(1)
        expect(onUpdateSpy).toHaveBeenCalledTimes(2)
        expect(onUpdateSpy.mock.calls[1][0].progress).toBeCloseTo(20.0)
        waitForFrames(1)
        expect(onUpdateSpy).toHaveBeenCalledTimes(3)
        expect(onUpdateSpy.mock.calls[2][0].progress).toBeCloseTo(40.0)
        waitForFrames(1)
        expect(onUpdateSpy).toHaveBeenCalledTimes(4)
        expect(onUpdateSpy.mock.calls[3][0].progress).toBeCloseTo(60.0)
        waitForFrames(1)
        expect(onUpdateSpy).toHaveBeenCalledTimes(5)
        expect(onUpdateSpy.mock.calls[4][0].progress).toBeCloseTo(80.0)
        waitForFrames(1)
        expect(onUpdateSpy).toHaveBeenCalledTimes(6)
        expect(onUpdateSpy.mock.calls[5][0].progress).toBeCloseTo(100.0)
        waitForFrames(1)
        expect(onUpdateSpy).toHaveBeenCalledTimes(6)
      })

      it('onComplete', () => {
        animation.play()
        waitForFrames(7)
        expect(onCompleteSpy).toHaveBeenCalledTimes(1)
      })

      it('delay on animation', () => {
        const target = {}
        const delayOnStartSpy = jest.fn()
        cinderella()
          .add({
            targets: target,
            transform: {
              foo: {
                from: 0,
                to: 100,
                delay: (t, i) => i * 100,
                duration: 5 * frameRate,
              },
              bar: {
                delay: (t, i) => i * 100,
                from: 0,
                to: 100,
                duration: 5 * frameRate,
              },
            },
            delay: 1 * frameRate,
            onStart: delayOnStartSpy,
          })
          .play()
        waitForFrames(1)
        expect(target.foo).toBeUndefined()
        expect(target.bar).toBeUndefined()
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(0.0)
        expect(target.bar).toBeCloseTo(0.0)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(20.0)
        expect(target.bar).toBeCloseTo(20.0)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(40.0)
        expect(target.bar).toBeCloseTo(40.0)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(60.0)
        expect(target.bar).toBeCloseTo(60.0)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(80.0)
        expect(target.bar).toBeCloseTo(80.0)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(100.0)
        expect(target.bar).toBeCloseTo(100.0)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(100.0)
        expect(target.bar).toBeCloseTo(100.0)
      })

      it('calling play has no effect on an animation that is still executing', () => {
        animation.play()
        waitForFrames(3)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
        expect(onCompleteSpy).toHaveBeenCalledTimes(0)
        animation.play()
        waitForFrames(4)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
        expect(onCompleteSpy).toHaveBeenCalledTimes(1)
      })

      it('calling play on an animation that has complete causes it to play again', () => {
        animation.play()
        waitForFrames(7)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
        expect(onCompleteSpy).toHaveBeenCalledTimes(1)
        animation.play()
        waitForFrames(3)
        expect(onStartSpy).toHaveBeenCalledTimes(2)
      })

      it('stop', () => {
        animation.play()
        waitForFrames(3)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
        animation.stop()
        waitForFrames(4)
        expect(onCompleteSpy).toHaveBeenCalledTimes(0)
      })

      it('runs once', () => {
        animation.play()
        waitForFrames(10)
        expect(onCompleteSpy).toHaveBeenCalledTimes(1)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
      })

      it('pause and play', () => {
        const target = {}
        const onStartSpy = jest.fn()
        const onCompleteSpy = jest.fn()
        const animation = cinderella({
          onStart: onStartSpy,
          onComplete: onCompleteSpy,
        }).add({
          targets: target,
          transform: {
            foo: {
              from: 0,
              to: 100,
              duration: 5 * frameRate,
            },
            bar: {
              from: 0,
              to: 100,
              duration: 5 * frameRate,
            },
          },
        })

        animation.play()
        waitForFrames(1)
        expect(target.foo).toBe(0)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
        waitForFrames(1)
        expect(target.foo).toBe(20)
        expect(target.bar).toBe(20)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(40)
        expect(target.bar).toBeCloseTo(40)
        animation.pause()
        waitForFrames(5)
        expect(onCompleteSpy).toHaveBeenCalledTimes(0)
        animation.play()
        waitForFrames(1)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
        expect(target.foo).toBe(40)
        expect(target.bar).toBe(40)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(60)
        expect(target.bar).toBeCloseTo(60)
        waitForFrames(2)
        expect(onCompleteSpy).toHaveBeenCalledTimes(1)
      })

      it('play onComplete', () => {
        const playOnCompleteSpy = jest.fn()
        animation.play(playOnCompleteSpy)
        waitForFrames(6)
        expect(playOnCompleteSpy).toHaveBeenCalledTimes(1)
      })

      it('play Promise', done => {
        setTimeout(() => {
          waitForFrames(6)
        }, 0)
        const result = animation.play()
        expect(result.then).not.toBeUndefined()
        result.then(x => {
          expect(x.add).not.toBeUndefined()
          done()
        })
      })

      it('seek', () => {
        animation.play()
        animation.seek(50)
        expect(target.foo).toBe(50)
        waitForFrames(1)
        expect(target.foo).toBe(50)
        waitForFrames(1)
        expect(target.foo).toBe(50)
      })

      it('seek time', () => {
        animation.seekTime(5 * frameRate / 2)
        expect(target.foo).toBeCloseTo(50)
      })

      it('seek and play', () => {
        animation.seek(50)
        expect(target.foo).toBe(50)
        animation.play()
        waitForFrames(1)
        expect(target.foo).toBe(50)
        waitForFrames(1)
        expect(target.foo).toBe(70)
        waitForFrames(1)
        expect(target.foo).toBe(90)
        waitForFrames(1)
        expect(target.foo).toBe(100)
        waitForFrames(1)
        expect(target.foo).toBe(100)
      })

      it('loop', () => {
        const loopStartSpy = jest.fn()
        cinderella({
          loop: true,
          onStart: loopStartSpy,
        })
          .add({
            targets: {},
            transform: {
              foo: {
                to: 10,
                duration: 3 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(12)
        expect(loopStartSpy).toHaveBeenCalledTimes(3)
      })

      it('loop count', () => {
        const loopStartSpy = jest.fn()
        cinderella({
          loop: 1,
          onStart: loopStartSpy,
        })
          .add({
            targets: {},
            transform: {
              foo: {
                to: 10,
                duration: 3 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(12)
        expect(loopStartSpy).toHaveBeenCalledTimes(2)
      })

      it('loop count play again', () => {
        const loopStartSpy = jest.fn()
        const animation = cinderella({
          loop: 1,
          onStart: loopStartSpy,
        }).add({
          targets: {},
          transform: {
            foo: {
              to: 10,
              duration: 3 * frameRate,
            },
          },
        })
        animation.play()
        waitForFrames(12)
        expect(loopStartSpy).toHaveBeenCalledTimes(2)
        animation.play()
        waitForFrames(12)
        expect(loopStartSpy).toHaveBeenCalledTimes(4)
      })

      it('speed faster', () => {
        const target = {}
        cinderella({
          speed: 2,
        })
          .add({
            targets: target,
            transform: {
              foo: {
                to: 10,
                duration: 10 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(6)
        expect(target.foo).toBe(10)
      })

      it('speed slower', () => {
        const target = {}
        cinderella({
          speed: 0.5,
        })
          .add({
            targets: target,
            transform: {
              foo: {
                to: 10,
                duration: 10 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(21)
        expect(target.foo).toBe(10)
      })

      it('direction "reverse"', () => {
        const target = {}
        cinderella({
          direction: 'reverse',
        })
          .add({
            targets: target,
            transform: {
              foo: {
                from: 0,
                to: 10,
                duration: 10 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(3)
        expect(target.foo).toBeCloseTo(8)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(7)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(6)
        waitForFrames(6)
        expect(target.foo).toBe(0)
      })

      it('direction "alternate"', () => {
        const target = {}
        cinderella({
          direction: 'alternate',
          loop: true,
        })
          .add({
            targets: target,
            transform: {
              foo: {
                from: 0,
                to: 10,
                duration: 10 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(3)
        expect(target.foo).toBeCloseTo(2)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(3)
        waitForFrames(7)
        expect(target.foo).toBe(10)
        waitForFrames(3)
        expect(target.foo).toBeCloseTo(8)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(7)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(6)
        waitForFrames(6)
      })

      it('direction "normal"', () => {
        const target = {}
        cinderella({
          direction: 'normal',
        })
          .add({
            targets: target,
            transform: {
              foo: {
                from: 0,
                to: 10,
                duration: 10 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(3)
        expect(target.foo).toBeCloseTo(2)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(3)
        waitForFrames(7)
        expect(target.foo).toBe(10)
      })

      it('direction "reverse" maintains transform prop order', () => {
        const domNode = window.document.createElement('div')
        cinderella({ direction: 'reverse' })
          .add({
            targets: domNode,
            transform: {
              width: {
                from: 100,
                to: '200px',
                duration: 5 * frameRate,
              },
              height: {
                from: 50,
                to: '100px',
                duration: 5 * frameRate,
              },
              translateX: {
                from: 10,
                to: '50px',
                duration: 5 * frameRate,
              },
              scale: {
                from: 1,
                to: 5,
                duration: 5 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(7)
        expect(domNode.style.width).toBe('100px')
        expect(domNode.style.height).toBe('50px')
        expect(domNode.style.transform).toBe('translateX(10px) scale(1)')
      })
    })

    describe('tweens', () => {
      it('units', () => {
        const validUnits = '%,px,pt,em,rem,in,cm,mm,ex,ch,pc,vw,vh,vmin,vmax,deg,rad,turn'.split(
          ',',
        )
        const target = {}
        cinderella()
          .add({
            targets: target,
            transform: validUnits.reduce(
              (acc, unit) => ({
                ...acc,
                [unit]: {
                  from: `10${unit}`,
                  to: `20${unit}`,
                  duration: 2 * frameRate,
                },
              }),
              {},
            ),
          })
          .play()
        waitForFrames(3)
        validUnits.forEach(unit => expect(target[unit]).toBe(`20${unit}`))
      })

      it('multiple', () => {
        const multiTarget = {
          foo: 100,
          bar: 0,
        }
        cinderella()
          .add({
            targets: multiTarget,
            transform: {
              foo: {
                to: 0,
                duration: 5 * frameRate,
              },
              bar: {
                to: 100,
                duration: 5 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(7)
        expect(multiTarget).toMatchObject({
          foo: 0,
          bar: 100,
        })
        waitForFrames(1)
        expect(multiTarget).toMatchObject({
          foo: 0,
          bar: 100,
        })
      })

      it('transform over time', () => {
        const target = {}
        cinderella()
          .add({
            targets: target,
            transform: {
              foo: {
                to: 100,
                duration: 5 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(0)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(20)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(40)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(60)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(80)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(100)
        waitForFrames(1)
        expect(target.foo).toBe(100)
        waitForFrames(1)
        expect(target.foo).toBe(100)
        waitForFrames(1)
        expect(target.foo).toBe(100)
        waitForFrames(1)
        expect(target.foo).toBe(100)
      })

      it('function values', () => {
        const values = {
          '0': {
            delay: 1 * frameRate,
            duration: 2 * frameRate,
            easing: 'linear',
            from: 0,
            to: 100,
          },
          '1': {
            delay: 2 * frameRate,
            duration: 3 * frameRate,
            easing: 'linear',
            from: 200,
            to: 100,
          },
        }

        const delayMock = jest.fn((target, i) => values[i].delay)
        const durationMock = jest.fn((target, i) => values[i].duration)
        const easingMock = jest.fn((target, i) => values[i].easing)
        const fromMock = jest.fn((target, i) => values[i].from)
        const toMock = jest.fn((target, i) => values[i].to)
        const target1 = {}
        const target2 = {}
        cinderella()
          .add({
            targets: [target1, target2],
            transform: {
              foo: {
                delay: delayMock,
                duration: durationMock,
                easing: easingMock,
                from: fromMock,
                to: toMock,
              },
            },
          })
          .play()
        waitForFrames(1)
        expect(target1.foo).toBeUndefined()
        expect(target2.foo).toBeUndefined()
        waitForFrames(1)
        expect(target1.foo).toBeCloseTo(0.0)
        expect(target2.foo).toBeUndefined()
        waitForFrames(1)
        expect(target1.foo).toBeCloseTo(50)
        expect(target2.foo).toBeCloseTo(199.999)
        waitForFrames(1)
        expect(target1.foo).toBeCloseTo(100)
        expect(target2.foo).toBeCloseTo(166.666)
        waitForFrames(1)
        expect(target1.foo).toBeCloseTo(100)
        expect(target2.foo).toBeCloseTo(133.33)
        waitForFrames(1)
        expect(target1.foo).toBeCloseTo(100)
        expect(target2.foo).toBeCloseTo(100)
      })

      it('delay', () => {
        const delayTarget = {}
        cinderella()
          .add({
            targets: delayTarget,
            transform: {
              foo: {
                to: 100,
                duration: 3 * frameRate,
                delay: 1 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(1)
        expect(delayTarget.foo).toBeUndefined()
        waitForFrames(1)
        expect(delayTarget.foo).toBeCloseTo(0.0)
        waitForFrames(1)
        expect(delayTarget.foo).toBeCloseTo(33.333)
        waitForFrames(1)
        expect(delayTarget.foo).toBeCloseTo(66.666)
        waitForFrames(1)
        expect(delayTarget.foo).toBeCloseTo(100)
      })

      it('defaults', () => {
        const defaultsTarget = {}
        cinderella()
          .add({
            targets: defaultsTarget,
            transform: {
              foo: {},
              bar: {},
            },
            defaults: {
              delay: 2 * frameRate,
              duration: 5 * frameRate,
              easing: 'linear',
              from: 0,
              to: 100,
            },
          })
          .play()
        waitForFrames(10)
        expect(defaultsTarget).toMatchObject({
          foo: 100,
          bar: 100,
        })
      })

      it('keyframes', () => {
        const keyFrameTarget = {
          foo: 0,
        }
        cinderella()
          .add({
            targets: keyFrameTarget,
            transform: {
              foo: [
                {
                  to: 100,
                  easing: 'linear',
                  duration: 5 * frameRate,
                },
                {
                  to: 200,
                  easing: 'easeOutQuad',
                  delay: 2 * frameRate,
                  duration: 5 * frameRate,
                },
              ],
            },
          })
          .play()
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBeCloseTo(0)
        // First keyframe runs for 2 frames
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBeCloseTo(20)
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBeCloseTo(40)
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBeCloseTo(60)
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBeCloseTo(80)
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBeCloseTo(100)
        // Second keyframe has delay for 2 frames
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBe(100)
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBe(100)
        // Second keyframe runs for 5 frames
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBeCloseTo(134.065)
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBeCloseTo(162.545)
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBeCloseTo(183.025)
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBeCloseTo(195.505)
        waitForFrames(1)
        expect(keyFrameTarget.foo).toBeCloseTo(199.985)
      })

      it('negative easing', () => {
        const target = {}
        cinderella()
          .add({
            targets: target,
            transform: {
              foo: {
                from: 1,
                to: 0,
                easing: 'linear',
                duration: 5 * frameRate,
              },
              bar: {
                from: 200,
                to: 100,
                easing: 'linear',
                duration: 5 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(1)
        expect(target).toMatchObject({
          foo: 1,
          bar: 200,
        })
        expect(target.foo * 100).toBeCloseTo(100)
        expect(target.bar).toBeCloseTo(200)
        waitForFrames(1)
        expect(target.foo * 100).toBeCloseTo(80)
        expect(target.bar).toBeCloseTo(180)
        waitForFrames(1)
        expect(target.foo * 100).toBeCloseTo(60)
        expect(target.bar).toBeCloseTo(160)
        waitForFrames(1)
        expect(target.foo * 100).toBeCloseTo(40)
        expect(target.bar).toBeCloseTo(140)
        waitForFrames(1)
        expect(target.foo * 100).toBeCloseTo(20)
        expect(target.bar).toBeCloseTo(120)
        waitForFrames(1)
        expect(target.foo * 100).toBeCloseTo(0)
        expect(target.bar).toBeCloseTo(100)
      })
    })

    it.skip('mixed from/to units')

    describe('multiple animations', () => {
      let target
      let animation
      let timelineOnCompleteSpy
      let timelineOnStartSpy

      beforeEach(() => {
        target = {}
        timelineOnCompleteSpy = jest.fn()
        timelineOnStartSpy = jest.fn()
        animation = cinderella({
          onComplete: timelineOnCompleteSpy,
          onStart: timelineOnStartSpy,
        })
          .add({
            targets: target,
            transform: {
              foo: {
                from: 0,
                to: 100,
                duration: 3 * frameRate,
              },
            },
          })
          .add({
            targets: target,
            transform: {
              foo: {
                from: 100,
                to: 200,
                duration: 3 * frameRate,
              },
              bar: {
                from: 0,
                to: 100,
                duration: 3 * frameRate,
              },
            },
          })
      })

      it('onComplete', () => {
        animation.play()
        waitForFrames(9)
        expect(timelineOnCompleteSpy).toHaveBeenCalledTimes(1)
      })

      it('onStart', () => {
        animation.play()
        waitForFrames(1)
        expect(timelineOnStartSpy).toHaveBeenCalledTimes(1)
      })

      it('relative execution', () => {
        animation.play()
        waitForFrames(1)
        expect(target.foo).toBe(0)
        waitForFrames(2)
        expect(target.foo).toBeCloseTo(66.666)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(100)
        expect(target.bar).toBeUndefined()
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(131.333)
        expect(target.bar).toBeCloseTo(31.333)
        waitForFrames(3)
        expect(target.foo).toBeCloseTo(200)
        expect(target.bar).toBeCloseTo(100)
      })

      it('absolute offset', () => {
        const target = {
          foo: 0,
          bar: 0,
        }
        const onCompleteSpy = jest.fn()
        cinderella({
          onComplete: onCompleteSpy,
        })
          .add({
            targets: target,
            transform: {
              foo: {
                to: 100,
                duration: 3 * frameRate,
              },
            },
            onUpdate: jest.fn(),
          })
          .add({
            targets: target,
            transform: {
              bar: {
                to: 100,
                duration: 3 * frameRate,
              },
            },
            offset: 0,
          })
          .play()
        waitForFrames(1)
        expect(target.foo).toBe(0)
        expect(target.bar).toBe(0)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(33.333)
        expect(target.bar).toBeCloseTo(31.333)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(66.666)
        expect(target.bar).toBeCloseTo(64.666)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(99.999)
        expect(target.bar).toBeCloseTo(98)
        waitForFrames(1)
        expect(target.foo).toBe(100)
        expect(target.bar).toBe(100)
        waitForFrames(1)
        expect(onCompleteSpy).toHaveBeenCalledTimes(1)
      })

      it('relative offset', () => {
        const onCompleteSpy = jest.fn()
        const target = {
          foo: 0,
          bar: 0,
        }
        cinderella({
          onComplete: onCompleteSpy,
        })
          .add({
            targets: target,
            transform: {
              foo: {
                to: 100,
                duration: 6 * frameRate,
              },
            },
          })
          .add({
            targets: target,
            transform: {
              bar: {
                to: 100,
                duration: 3 * frameRate,
              },
            },
            offset: `-=${3 * frameRate}`,
          })
          .play()
        waitForFrames(1)
        expect(target.foo).toBe(0)
        expect(target.bar).toBe(0)
        waitForFrames(3)
        expect(target.foo).toBeCloseTo(50)
        expect(target.bar).toBeCloseTo(0)
        waitForFrames(1)
        expect(target.foo).toBeCloseTo(66.666)
        expect(target.bar).toBeCloseTo(31.333)
        waitForFrames(3)
        expect(target.foo).toBe(100)
        expect(target.bar).toBeCloseTo(100)
        waitForFrames(1)
        expect(onCompleteSpy).toHaveBeenCalledTimes(1)
      })
    })

    describe('targets', () => {
      it('svg', () => {
        const svg = window.document.createElement('svg')
        cinderella()
          .add({
            targets: svg,
            transform: {
              width: {
                to: '200px',
                duration: 5 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(7)
        expect(svg.style.width).toBe('200px')
      })

      it('dom node', () => {
        const domNode = window.document.createElement('div')
        cinderella()
          .add({
            targets: domNode,
            transform: {
              width: {
                to: '200px',
                duration: 5 * frameRate,
              },
              height: {
                to: '100px',
                duration: 5 * frameRate,
              },
              translateX: {
                to: '50px',
                duration: 5 * frameRate,
              },
              scale: {
                to: 5,
                duration: 5 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(7)
        expect(domNode.style.width).toBe('200px')
        expect(domNode.style.height).toBe('100px')
        expect(domNode.style.transform).toBe('translateX(50px) scale(5)')
      })

      it('dom selectors', () => {
        const els = [...new Array(5)].map(() => {
          const el = window.document.createElement('div')
          el.className = 'foo'
          el.style.height = '200px'
          el.setAttribute('width', '100px')
          window.document.body.appendChild(el)
          return el
        })
        cinderella()
          .add({
            targets: '.foo',
            transform: {
              width: {
                to: '200px',
                duration: 5 * frameRate,
              },
              height: {
                to: '100px',
                duration: 5 * frameRate,
              },
              translateX: {
                to: '50px',
                duration: 5 * frameRate,
              },
              scale: {
                to: 5,
                duration: 5 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(7)
        els.forEach(el => {
          expect(el.width).toBe('200px')
          expect(el.style.height).toBe('100px')
          expect(el.style.transform).toBe('translateX(50px) scale(5)')
        })
      })
    })
  })

  describe('frame listeners', () => {
    let animation
    beforeEach(() => {
      animation = cinderella().add({
        targets: {},
        transform: {
          foo: {
            to: 100,
            duration: 3 * frameRate,
          },
        },
      })
    })
    it('add and remove', async () => {
      const listener = jest.fn()
      addFrameListener(listener)
      animation.play()
      await waitForFrames(3)
      expect(listener).toHaveBeenCalledTimes(3)
      removeFrameListener(listener)
      await waitForFrames(2)
      expect(listener).toHaveBeenCalledTimes(3)
    })
  })

  describe('easing functions', () => {
    // TODO
  })

  describe('bug fixes', () => {
    it('v0.19.1 play and pause', () => {
      const target = {}
      const duration = 10000
      const opacityDuration = 2000
      const animation = cinderella({ loop: true }).add({
        targets: target,
        transform: {
          opacity: [
            {
              from: 0,
              to: 1,
              duration: opacityDuration,
              easing: 'easeInCubic',
            },
            {
              delay: duration - opacityDuration - opacityDuration,
              from: 1,
              to: 0,
              duration: opacityDuration,
              easing: 'easeOutCubic',
            },
          ],
          translateY: {
            from: `500px`,
            to: `-500px`,
            duration,
          },
        },
      })
      animation.play()
      waitForFrames(parseInt(opacityDuration / frameRate, 10))
      expect(target.opacity).toBeCloseTo(0.95)
      expect(target.translateY).toBe('303.33333px')
      waitForFrames(parseInt(opacityDuration / frameRate, 10))
      expect(target.opacity).toBeCloseTo(1)
      expect(target.translateY).toBe('105px')
      animation.pause()
      waitForFrames(parseInt(opacityDuration / frameRate, 10))
      expect(target.opacity).toBeCloseTo(1)
      expect(target.translateY).toBe('105px')
      animation.play()
      waitForFrames(2)
      expect(target.opacity).toBeCloseTo(1)
      expect(target.translateY).toBe('103.33333px')
    })
  })
})
