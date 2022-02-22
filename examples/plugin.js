'use strict'

const sleep = require('timers/promises').setTimeout

module.exports = async function (app) {
  app.get('/', async (req, res) => {
    await sleep(10)
    console.log('promise constructor is different', Object.getPrototypeOf(req.p).constructor === Promise)
    return 'Hello World!'
  })
}
