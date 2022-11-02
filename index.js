'use strict'

const importFresh = require('import-fresh')
const { writeFile, unlink } = require('fs').promises
const { dirname, basename, join } = require('path')
let SynchronousWorker
let counter = 0

try {
  SynchronousWorker = require('@matteo.collina/worker')
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

    worker.process.on('uncaughtException', onError)
    worker.globalThis.Error = Error

    customizeGlobalThis(worker.globalThis)

    const _require = worker.createRequire(opts.path)
    let plugin
    try {
      plugin = _require(opts.path)
    } catch (err) {
      if (err.code === 'ERR_REQUIRE_ESM') {
        const dir = dirname(opts.path)
        const name = join(dir, `.esm-wrapper-${process.pid}-${counter++}.js`)
        await writeFile(name, `
          const plugin = import(${JSON.stringify(`./${basename(opts.path)}`)})
          module.exports = plugin
        `)
        plugin = _require(name)
        await unlink(name)
      } else {
        throw err
      }
    }

    app.register(plugin, opts)

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
