> Work in Progress

# cinderella

A tiny transformation library.

https://cinderella.now.sh

```javascript
import cinderella from 'cinderella'

cinderella().add({
  targets: '.foo',
  transform: {
    translateY: {
      from: 0,
      to: '-200px',
      duration: 1000,
      easing: 'easeInOutQuad',
    }
  }
}).play()
```

[![npm](https://img.shields.io/npm/v/cinderella.svg?style=flat-square)](http://npm.im/cinderella)
[![MIT License](https://img.shields.io/npm/l/cinderella.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Travis](https://img.shields.io/travis/ctrlplusb/cinderella.svg?style=flat-square)](https://travis-ci.org/ctrlplusb/cinderella)
[![Codecov](https://img.shields.io/codecov/c/github/ctrlplusb/cinderella.svg?style=flat-square)](https://codecov.io/github/ctrlplusb/cinderella)

## Credits

`cinderella` is _heavily_ inspired by [`animejs`](http://animejs.com/) - a wildly popular, well maintained, and just all out badass library - so if you are a sane person you'll likely want to check them out first.

I created `cinderella` for the following reasons:

 - a selfish desire for specific timeline semantics
 - a more rigid API so that I could provide some guarantees to the way I intend to use the library

Humongous 😘 to Julian Garnier for the amazement that is `animejs`.

Massive ❤️ to Mark O'Connor for donating the npm package name `cinderella`.  ️