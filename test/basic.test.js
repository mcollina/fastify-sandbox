'use strict'

const { test } = require('tap')
const isolate = require('../')
const Fastify = require('fastify')


test('different isolates', async ({ same, teardown }) => {
  const app = Fastify()
  teardown(app.close.bind(app))

  app.addHook('onRequest', async function (req) {
    req.p = Promise.resolve('hello')
  })

  app.get('/check', async function (req, reply) {
    return {
      check: Object.getPrototypeOf(req.p).constructor === Promise
    }
  })

  app.register(isolate, {
    path: __dirname + '/plugin.js'
  })

  {
    const res = await app.inject({
      method: 'GET',
      url: '/check'
    })

    same(res.json(), { check: true })
  }

  {
    const res = await app.inject({
      method: 'GET',
      url: '/'
    })

    same(res.json(), { check: false })
  }
})
