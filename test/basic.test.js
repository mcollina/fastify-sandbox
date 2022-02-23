'use strict'

const { test } = require('tap')
const isolate = require('../')
const Fastify = require('fastify')
const path = require('path')

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
    path: path.join(__dirname, '/plugin.js')
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

test('skip-override works', async ({ same, teardown }) => {
  const app = Fastify()
  teardown(app.close.bind(app))

  app.register(isolate, {
    path: path.join(__dirname, '/plugin.js')
  })

  const res = await app.inject({
    method: 'GET',
    url: '/set-cookie'
  })

  const cookie = res.headers['set-cookie'].split(';')[0]

  same(res.json(), { status: 'ok' })

  const res2 = await app.inject({
    method: 'GET',
    headers: {
      cookie
    },
    url: '/get-cookie'
  })

  same(res2.json(), { status: 'test' })
})
