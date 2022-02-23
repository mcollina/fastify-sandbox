'use strict'

module.exports = async function (app) {
  app.get('/', async (req, res) => {
    return {
      check: Object.getPrototypeOf(req.p).constructor === Promise
    }
  })

  app.register(async function (app) {
    app.register(require('fastify-cookie'), {
      secret: 'secret'
    })

    app.get('/set-cookie', async (req, res) => {
      res.cookie('test', 'test')
      return {
        status: 'ok'
      }
    })

    app.get('/get-cookie', async (req, res) => {
      return {
        status: req.cookies.test
      }
    })
  })
}
