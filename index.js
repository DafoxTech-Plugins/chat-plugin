var config = require('./config')
var router = require('./router')
var models = require('./models')
var { app } = require('plugin-core')

module.exports = {
  async init (id) {
    config.id = id
    await models.init()
    app.use(router)
  },
  uninstall () {
    // called with you uninstall the plugin
  }
}
