'use strict'

const SynchronousWorker = require('@matteo.collina/isolates')

async function isolate (app, opts) {
  const worker = new SynchronousWorker({
    sharedEventLoop: true,
    sharedMicrotaskQueue: true
  })

  const stopTimeout = opts.stopTimeout || 100

  const onError = opts.onError || routeToProcess
  const customizeGlobalThis = opts.customizeGlobalThis || noop

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
