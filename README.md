# fastify-isolate

Loads a fastify plugin into a separate V8 isolate.
It will have a different require.cache, so loaded modules
could be safely gc'ed once the isolate goes out of scope.

## Install

```bash
npm i fastify-isolate
```

## Usage

```js
'use strict'

const Fastify = require('fastify')
const isolate = require('fastify-isolate')

const app = Fastify()

app.addHook('onRequest', async function (req) {
  req.p = Promise.resolve('hello')
  console.log('promise constructor is the same', Object.getPrototypeOf(req.p).constructor === Promise)
})

app.register(isolate, {
  path: __dirname + '/plugin.js',
  onError (err) {
    // uncaught exceptions within the isolate will land inside this
    // callback
  }
})

app.listen(3000)
```

Inside `plugin.js`:

```js
'use strict'

// We are in a diff V8 isolate now
const sleep = require('timers/promises').setTimeout

module.exports = async function (app) {
  app.get('/', async (req, res) => {
    console.log('promise constructor is different', Object.getPrototypeOf(req.p).constructor === Promise)
    return 'Hello World!'
  })
}
```

## License

MIT
