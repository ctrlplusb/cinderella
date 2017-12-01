> Work in Progress

# cinderella

A tiny transformation library.

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

## Want more information?

Visit the website: https://cinderella.now.sh