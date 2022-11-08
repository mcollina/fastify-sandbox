'use strict'

const { test } = require('tap')
const proxyquire = require('proxyquire')

const Fastify = require('fastify')
const path = require('path')

test('different isolates', async ({ same, teardown }) => {
  const isolate = proxyquire('../', {
    '@matteo.collina/worker': null
  })

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

    // Bummer, we have do not have isolates
    same(data, { check: true })
  }
})

test('different isolates', async ({ same, teardown }) => {
  const isolate = require('../')
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
    fallback: true
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

    // Bummer, we have do not have isolates
    same(data, { check: true })
  }
})

test('pass options through', async ({ same, teardown }) => {
  const isolate = proxyquire('../', {
    '@matteo.collina/worker': null
  })

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
    options: {
      something: 'else'
    }
  })

  {
    const res = await app.inject({
      method: 'GET',
      url: '/options'
    })
    const data = res.json()

    same(data, { something: 'else' })
  }
})
