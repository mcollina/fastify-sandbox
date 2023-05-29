'use strict'

module.exports = async function (app, opts) {
  app.get('/', async (req) => {
    const data = {
      check: Object.getPrototypeOf(req.p).constructor === Promise
    }
    return data
  })

  app.get('/throw', () => {
    process.nextTick(() => {
      throw new Error('kaboom')
    })
    return 'ok'
  })

  app.get('/error', () => {
    throw new Error('kaboom')
  })

  app.get('/perror', () => {
    throw new Error('kaboom')
  })

  app.get('/typeerror', () => {
    throw new TypeError('kaboom - typeerror')
  })

  app.get('/rangeerror', () => {
    throw new RangeError('kaboom - rangeerror')
  })

  app.get('/evalerror', () => {
    throw new EvalError('kaboom - evalerror')
  })

  app.get('/referenceerror', () => {
    throw new ReferenceError('kaboom - referenceerror')
  })

  app.get('/syntaxerror', () => {
    throw new SyntaxError('kaboom - syntaxerror')
  })

  app.get('/urierror', () => {
    throw new URIError('kaboom - urierror')
  })

  app.get('/errorcode', () => {
    const err = new Error('kaboom')
    err.code = 'MY_ERROR_CODE'
    throw err
  })

  app.register(async function (app) {
    app.register(require('@fastify/cookie'), {
      secret: 'secret'
    })

    app.get('/set-cookie', async (_, res) => {
      res.cookie('test', 'test')
      return {
        status: 'ok'
      }
    })

    app.get('/get-cookie', async (req) => {
      return {
        status: req.cookies.test
      }
    })
  })

  app.get('/globalThis', async (req) => {
    return { value: globalThis.test || 'not set' }
  })

  app.get('/options', async () => opts)
}
