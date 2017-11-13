> __WORK IN PROGRESS - DO NOT USE ME__

# cinderella

A tiny transformation library.

```javascript
import cinderella from 'cinderella'

cinderella({
  target: '#foo',
  transform: {
    width: {
      to: '200px',
      duration: 1000
    }
  }
}).play()
```

[![npm](https://img.shields.io/npm/v/cinderella.svg?style=flat-square)](http://npm.im/cinderella)
[![MIT License](https://img.shields.io/npm/l/cinderella.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Travis](https://img.shields.io/travis/ctrlplusb/cinderella.svg?style=flat-square)](https://travis-ci.org/ctrlplusb/cinderella)
[![Codecov](https://img.shields.io/codecov/c/github/ctrlplusb/cinderella.svg?style=flat-square)](https://codecov.io/github/ctrlplusb/cinderella)

 - Play, pause, loop, stop.
 - Compose animations to create timelines.
 - Easing functions.
 - Simple API.
 - Optimised over requestAnimationFrame.
 - 3kB gzipped

## TOCs

  - [Introduction](#introduction)
  - [Tutorial](#tutorial)
  - [API](#api)
  - [Credits](#credits)

## Introduction

`cinderella` is _heavily_ inspired by [`animejs`](http://animejs.com/) - a wildly popular, well maintained, and just all out badass library - so if you are a sane person you'll likely want to check them out first. I created `cinderella` out of a selfishly desire for specific timeline semantics.

## Tutorial

> WIP

## API

```javascript
cinderella({
  targets: '#foo',
  transform: {
    opacity: {
      to: 50
    },
    scale: {
      to: 2, 
      delay: 500,
      easing: 'linear',
    },
    translateX: [
      { to: 250, duration: 250 },
      { to: 0, delay: 500, duration: 250 }
    ]
  },
  transformDefaults: { 
    duration: 1000
  }
})
```

## Credits

Humongous 😘 to Julian Garnier for the amazement that is `animejs`.  ️
Massive ❤️ to Mark O'Connor for donating the npm package name `cinderella`.  ️