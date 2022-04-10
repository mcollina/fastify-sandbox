'use strict'

const SynchronousWorker = require('synchronous-worker')
const immediate = require('timers/promises').setImmediate

async function isolate (app, opts) {
  const worker = new SynchronousWorker({
    sharedEventLoop: true,
    sharedMicrotaskQueue: true
  })

  const onError = opts.onError || routeToProcess

  let _require = worker.createRequire(opts.path)

  worker.process.on('uncaughtException', onError)

  app.register(_require(opts.path), opts)
  _require = null

  app.addHook('onClose', async () => {
    // the immediate blocks are needed to ensure that the worker
    // has actually finished its work before closing
    await immediate()
    await worker.stop()
    await immediate()
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

module.exports = isolate
