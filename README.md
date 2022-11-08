# fastify-sandbox

Loads a fastify plugin in a sandbox.
It will have a different require.cache, so loaded modules
could be safely gc'ed once the sandbox goes out of scope.

The plugin can be both commonjs or esm.

This modules pairs well with [`@fastify/restartable`](https://github.com/fastify/restartable)
to provide hot-reloading mechanism for Fastify applications.

## Install

```bash
npm i fastify-sandbox
```

## Usage

```js
'use strict'

const Fastify = require('fastify')
const sandbox = require('fastify-sandbox')

const app = Fastify()

app.addHook('onRequest', async function (req) {
  req.p = Promise.resolve('hello')
  console.log('promise constructor is the same', Object.getPrototypeOf(req.p).constructor === Promise)
})

app.register(sandbox, {
  path: __dirname + '/plugin.js',
  options: { // this object will be passed as the options of the loaded plugin
    hello: "world"
  },
  onError (err) {
    // uncaught exceptions within the sandbox will land inside this
    // callback
  }
})

app.listen(3000)
```

Inside `plugin.js`:

```js
'use strict'

// We are in a different V8 Context now
const sleep = require('timers/promises').setTimeout

module.exports = async function (app) {
  app.get('/', async (req, res) => {
    console.log('promise constructor is different', Object.getPrototypeOf(req.p).constructor === Promise)
    return 'Hello World!'
  })
}
```

## Missing compiler support

In case there is no compiler toolchain available in the system,
compiling the code needed to support for the current Node.js version would
be impossible. In this case we rely on [import-fresh](https://npm.im/import-fresh)
instead.

It's also possible to turn on the fallback mechanism with the `fallback: true` option:

```js
'use strict'

const Fastify = require('fastify')
const sandbox = require('fastify-sandbox')

const app = Fastify()

app.addHook('onRequest', async function (req) {
  req.p = Promise.resolve('hello')
  console.log('promise constructor is the same', Object.getPrototypeOf(req.p).constructor === Promise)
})

app.register(sandbox, {
  path: __dirname + '/plugin.js',
  fallback: true
})

app.listen(3000)
```

Note that ESM is only supported via the native code.

## Caveats

This module does not offer any protection against malicious code.

## License

MIT
