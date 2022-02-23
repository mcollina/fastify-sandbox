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
    setTimeout(stop, 1000, worker).unref()
  })
}

/* istanbul ignore next */
function stop (worker) {
  worker.stop()
}

module.exports = isolate
