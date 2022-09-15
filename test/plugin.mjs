export default async function (app) {
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

  app.register(async function (app) {
    app.register(import('@fastify/cookie'), {
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
}
