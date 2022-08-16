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

  app.get('/check', async function (req) {
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
    const data = res.json()

    same(data, { check: true })
  }

  {
    const res = await app.inject({
      method: 'GET',
      url: '/'
    })
    const data = res.json()

    same(data, { check: false })
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

test('throw and onError option', ({ same, plan, teardown }) => {
  plan(1)

  const app = Fastify()
  teardown(app.close.bind(app))

  app.register(isolate, {
    path: path.join(__dirname, '/plugin.js'),
    onError (err) {
      same(err.message, 'kaboom')
    }
  })

  // this will never get a response
  app.inject({
    method: 'GET',
    url: '/throw'
  })
})

test('throw and route to uncaughtException', ({ same, plan, teardown }) => {
  plan(1)

  const app = Fastify()
  teardown(app.close.bind(app))

  const uncaughtException = process.listeners('uncaughtException')
  process.removeAllListeners('uncaughtException')
  teardown(() => {
    process.removeAllListeners('uncaughtException')
    for (const listener of uncaughtException) {
      process.on('uncaughtException', listener)
    }
  })

  process.on('uncaughtException', (err) => {
    same(err.message, 'kaboom')
  })

  app.register(isolate, {
    path: path.join(__dirname, '/plugin.js')
  })

  // this will never get a response
  app.inject({
    method: 'GET',
    url: '/throw'
  })
})

test('error is the same', async ({ equal, teardown }) => {
  const app = Fastify()
  teardown(app.close.bind(app))

  app.register(isolate, {
    path: path.join(__dirname, '/plugin.js')
  })

  const res = await app.inject({
    method: 'GET',
    url: '/error'
  })
  equal(res.statusCode, 500)
  const data = res.json()
  equal(data.message, 'kaboom')
})

test('stopTimeout', async ({ equal, teardown }) => {
  const app = Fastify()
  teardown(app.close.bind(app))

  app.addHook('onRequest', async function (req) {
    req.p = Promise.resolve('hello')
  })

  app.get('/check', async function (req) {
    return {
      check: Object.getPrototypeOf(req.p).constructor === Promise
    }
  })

  app.register(isolate, {
    path: path.join(__dirname, '/plugin.js'),
    stopTimeout: 500
  })

  const timer = Date.now()

  await app.close()

  const timer2 = Date.now()

  equal(timer2 - timer >= 500, true)
})

test('customize isolate globalThis', async ({ same, teardown }) => {
  const app = Fastify()
  teardown(app.close.bind(app))

  app.register(isolate, {
    path: path.join(__dirname, '/plugin.js'),
    customizeGlobalThis (_globalThis) {
      _globalThis.test = 'test'
    }
  })

  {
    const res = await app.inject({
      method: 'GET',
      url: '/globalThis'
    })
    const data = res.json()

    same(data, { value: 'test' })
  }
})
