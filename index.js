'use strict'

const importFresh = require('import-fresh')
let SynchronousWorker

try {
  SynchronousWorker = require('@matteo.collina/isolates')
} catch {
  // do nothing
}

async function isolate (app, opts) {
  const stopTimeout = opts.stopTimeout || 100

  const onError = opts.onError || routeToProcess
  const customizeGlobalThis = opts.customizeGlobalThis || noop
  const fallback = opts.fallback || !SynchronousWorker

  if (!fallback) {
    const worker = new SynchronousWorker({
      sharedEventLoop: true,
      sharedMicrotaskQueue: true
    })

    let _require = worker.createRequire(opts.path)

    worker.process.on('uncaughtException', onError)
    worker.globalThis.Error = Error

    customizeGlobalThis(worker.globalThis)

    app.register(_require(opts.path), opts)
    _require = null

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
    app.log.info('isolates are not available, relying on import-fresh instead')
    app.register(importFresh(opts.path), opts)
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

module.exports = isolate
