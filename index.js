'use strict'

const SynchronousWorker = require('synchronous-worker')

async function isolate (app, opts) {
  const worker = new SynchronousWorker({
    sharedEventLoop: true,
    sharedMicrotaskQueue: true
  })

  const _require = worker.createRequire(opts.path)

  app.register(_require(opts.path), opts)
}

module.exports = isolate
