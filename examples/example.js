'use strict'

const Fastify = require('fastify')
const isolate = require('..')
const path = require('path')

const app = Fastify()

app.addHook('onRequest', async function (req) {
  req.p = Promise.resolve('hello')
  console.log('promise constructor is the same', Object.getPrototypeOf(req.p).constructor === Promise)
})

app.register(isolate, {
  path: path.join(__dirname, '/plugin.js')
})

app.listen(3000)

process.on('SIGINT', () => {
  app.close()
})
