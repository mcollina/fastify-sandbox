'use strict'

module.exports = async function (app) {
  app.get('/', async (req, res) => {
    return {
      check: Object.getPrototypeOf(req.p).constructor === Promise
    }
  })
}
