> __WORK IN PROGRESS - DO NOT USE ME__

# cinderella

A tiny transformation library.

```javascript
import { timeline } from 'cinderella'

timeline().add({
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

 - Simple API
 - Play, pause, loop, stop, reverse, alternate
 - Compose animations to create timelines
 - Easing functions
 - Devtools to visualise and debug
 - Optimised over requestAnimationFrame
 - 3.5kB gzipped

## TOCs

  - [Introduction](#introduction)
  - [Tutorial](#tutorial)
  - [API](#api)
  - [Development Tools](#development-tools)
  - [Credits](#credits)

## Introduction

`cinderella` is _heavily_ inspired by [`animejs`](http://animejs.com/) - a wildly popular, well maintained, and just all out badass library - so if you are a sane person you'll likely want to check them out first.

I created `cinderella` for the following reasons:

 - a selfish desire for specific timeline semantics
 - a more rigid API so that I could provide some guarantees

## Tutorial

> WIP

## API

```javascript
timeline({ onStart: () => 'started', onComplete: () => 'completed' })
  .add({
    targets: '.foo',
    transform: {
      opacity: {
        from: 1,
        to: 0,
        easing: 'easeOutQuad',
      },
      scale: {
        from: 1,
        to: 2,
        delay: 500,
        easing: 'easeInQuad',
      },
      // Keyframes via array
      translateX: [ // 👈
        { from: 0, to: 250, duration: 250 },
        { to: 0, delay: 500, duration: 250 }
      ]
    },
    defaults: {
      duration: 1000
    }
  })
  .add({
    targets: '.bar',
    transform: {
      width: {
        to: '200px',
        duration: 500
      }
    }
  })
  .play()
```

## Development Tools

> WIP

## Credits

Humongous 😘 to Julian Garnier for the amazement that is `animejs`.

Massive ❤️ to Mark O'Connor for donating the npm package name `cinderella`.  ️