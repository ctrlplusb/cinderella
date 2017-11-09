import * as Utils from '../utils'

describe('utils', () => {
  describe('getCurrentValues', () => {
    it('works', () => {
      const el = document.createElement('div')
      el.style.transform =
        'translateX(25px) translateY(50vh) translateZ(15%) rotate(90deg)'
      const actual = Utils.getCurrentValues(el)
      expect(actual).toEqual({
        translateX: {
          value: 25,
          unit: 'px',
        },
        translateY: {
          value: 50,
          unit: 'vh',
        },
        translateZ: {
          value: 15,
          unit: '%',
        },
        rotate: {
          value: 90,
          unit: 'deg',
        },
      })
    })
  })
})
