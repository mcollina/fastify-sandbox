'use strict'

const SynchronousWorker = require('synchronous-worker')

async function isolate (app, opts) {
  const worker = new SynchronousWorker({
    sharedEventLoop: true,
    sharedMicrotaskQueue: true
  })

  let _require = worker.createRequire(opts.path)

  app.register(_require(opts.path), opts)
  _require = null

  app.addHook('onClose', () => {
    return worker.stop()
    // setTimeout(stop, 1000, worker).unref()
  })
}

module.exports = isolate
