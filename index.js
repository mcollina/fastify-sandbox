'use strict'

const SynchronousWorker = require('synchronous-worker')
const immediate = require('timers/promises').setImmediate

async function isolate (app, opts) {
  const worker = new SynchronousWorker({
    sharedEventLoop: true,
    sharedMicrotaskQueue: true
  })

  let _require = worker.createRequire(opts.path)

  app.register(_require(opts.path), opts)
  _require = null

  app.addHook('onClose', async () => {
    // the immediate blocks are needed to ensure that the worker
    // has actually finished its work before closing
    await immediate()
    await worker.stop()
    await immediate()
  })
}

module.exports = isolate
