'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (app, opts) {
  app.decorate('foo', 'bar')
})
