'use strict'

const importFresh = require('import-fresh')
const { join } = require('path')
const { pathToFileURL } = require('url')
const fp = require('fastify-plugin')
let SynchronousWorker

const esmWrapperPath = join(__dirname, 'esm-wrapper.js')

try {
  SynchronousWorker = require('@matteo.collina/worker')
} catch {
  // do nothing
}

async function sandbox (app, opts) {
  const stopTimeout = opts.stopTimeout || 100

  const onError = opts.onError || routeToProcess
  const customizeGlobalThis = opts.customizeGlobalThis || noop
  const fallback = opts.fallback || !SynchronousWorker

  if (!fallback) {
    const worker = new SynchronousWorker({
      sharedEventLoop: true,
      sharedMicrotaskQueue: true
    })

    worker.process.on('uncaughtException', onError)

    customizeGlobalThis(worker.globalThis)

    const _require = worker.createRequire(opts.path)
    let plugin
    try {
      plugin = _require(opts.path)
    } catch (err) {
      if (err.code === 'ERR_REQUIRE_ESM') {
        const _import = _require(esmWrapperPath)
        plugin = _import(pathToFileURL(opts.path))
      } else {
        throw err
      }
    }

    app.setErrorHandler(async (err, req, reply) => {
      if (err instanceof worker.globalThis.Error) {
        req.log.debug({ err }, 'error encounterated within the sandbox, wrapping it')
        const newError = new Error(err.message)
        newError.cause = err
        newError.statusCode = err.statusCode || 500
        err = newError
      }
      throw err
    })

    app.register(plugin, opts.options)

    app.addHook('onClose', (_, done) => {
      // the immediate blocks are needed to ensure that the worker
      // has actually finished its work before closing
      setTimeout(() => {
        worker.stop().then(() => {
          setImmediate(done)
        })
      }, stopTimeout)
    })
  } else {
    app.log.warn('isolates are not available, relying on import-fresh instead. Support for ESM is not available.')
    app.register(importFresh(opts.path), opts.options)
  }

  function routeToProcess (err) {
    app.log.error({
      err: {
        message: err.message,
        stack: err.stack
      }
    }, 'error encounterated within the isolate, routing to uncaughtException, use onError option to catch')
    process.emit('uncaughtException', err)
  }
}

function noop () {}

module.exports = fp(sandbox, {
  fastify: '4.x',
  name: 'fastify-sandbox'
})
